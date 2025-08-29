-- Function to compact old import_jobs records (older than 7 days)
CREATE OR REPLACE FUNCTION compact_old_import_jobs() RETURNS INTEGER AS $$
DECLARE
  compacted_count INTEGER := 0;
BEGIN
  -- Update old import_jobs to minimal summary format
  -- Keep only essential fields for audit purposes
  UPDATE import_jobs 
  SET 
    mapping = '{"compacted": true}'::jsonb,
    options = '{"compacted": true}'::jsonb,
    error_message = CASE 
      WHEN error_message IS NOT NULL THEN error_message
      ELSE 'Compacted by maintenance job'
    END,
    updated_at = NOW()
  WHERE 
    created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed', 'cancelled')
    AND (mapping->>'compacted')::boolean IS DISTINCT FROM true;
  
  GET DIAGNOSTICS compacted_count = ROW_COUNT;
  
  RETURN compacted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run all maintenance tasks
CREATE OR REPLACE FUNCTION run_maintenance_cleanup() RETURNS JSONB AS $$
DECLARE
  result JSONB;
  stuck_runs INTEGER;
  temp_uploads INTEGER;
  raw_items INTEGER;
  import_jobs INTEGER;
BEGIN
  -- Mark stuck runs
  SELECT mark_stuck_import_runs() INTO stuck_runs;
  
  -- Cleanup temp uploads
  SELECT cleanup_temp_uploads() INTO temp_uploads;
  
  -- Cleanup old raw items
  SELECT cleanup_old_raw_items() INTO raw_items;
  
  -- Compact old import jobs
  SELECT compact_old_import_jobs() INTO import_jobs;
  
  -- Return summary
  result := jsonb_build_object(
    'timestamp', NOW(),
    'stuckRunsMarked', stuck_runs,
    'tempUploadsPurged', temp_uploads,
    'rawItemsCleaned', raw_items,
    'importJobsCompacted', import_jobs
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION compact_old_import_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION run_maintenance_cleanup() TO authenticated;

-- Create a view for monitoring maintenance status
CREATE OR REPLACE VIEW maintenance_status AS
SELECT 
  'stuck_runs' as task,
  COUNT(*) as count,
  'Import runs stuck in processing for >24h' as description
FROM import_runs 
WHERE status = 'processing' 
  AND started_at < NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'old_temp_uploads' as task,
  COUNT(*) as count,
  'Temp uploads older than 24h' as description
FROM temp_uploads 
WHERE created_at < NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'old_raw_items' as task,
  COUNT(*) as count,
  'Raw import items from failed runs older than 30 days' as description
FROM raw_import_items 
WHERE created_at < NOW() - INTERVAL '30 days'
  AND import_run_id IN (
    SELECT id FROM import_runs 
    WHERE status IN ('failed', 'partial') 
      AND started_at < NOW() - INTERVAL '30 days'
  )
UNION ALL
SELECT 
  'old_import_jobs' as task,
  COUNT(*) as count,
  'Import jobs older than 7 days that can be compacted' as description
FROM import_jobs 
WHERE created_at < NOW() - INTERVAL '7 days'
  AND status IN ('completed', 'failed', 'cancelled')
  AND (mapping->>'compacted')::boolean IS DISTINCT FROM true;

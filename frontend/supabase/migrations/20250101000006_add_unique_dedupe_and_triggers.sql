-- Prompt 1 — DB hard guarantees: unique index + trigger + stuck/TTL helpers
-- Migration: 20250101000006_add_unique_dedupe_and_triggers.sql

-- Enable pgcrypto extension for SHA256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to compute unique hash for deduplication
CREATE OR REPLACE FUNCTION compute_unique_hash(ex record) 
RETURNS text AS $$
BEGIN
  -- Build SHA256 hash of (timestamp|symbol|side|abs(quantity)|price|coalesce(broker_account_id::text,''))
  RETURN encode(
    digest(
      COALESCE(ex.timestamp::text, '') || '|' ||
      COALESCE(ex.symbol::text, '') || '|' ||
      COALESCE(ex.side::text, '') || '|' ||
      COALESCE(ABS(ex.quantity)::text, '') || '|' ||
      COALESCE(ex.price::text, '') || '|' ||
      COALESCE(ex.broker_account_id::text, ''),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add unique_hash column to executions_normalized if it doesn't exist
ALTER TABLE executions_normalized 
ADD COLUMN IF NOT EXISTS unique_hash text;

-- Create index on unique_hash for performance
CREATE INDEX IF NOT EXISTS idx_executions_unique_hash 
ON executions_normalized (unique_hash);

-- Function to handle BEFORE INSERT trigger
CREATE OR REPLACE FUNCTION before_insert_exec_norm()
RETURNS trigger AS $$
BEGIN
  -- Set unique_hash if it's null or empty
  IF NEW.unique_hash IS NULL OR NEW.unique_hash = '' THEN
    NEW.unique_hash := compute_unique_hash(NEW);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically compute unique_hash on insert
DROP TRIGGER IF EXISTS trigger_before_insert_exec_norm ON executions_normalized;
CREATE TRIGGER trigger_before_insert_exec_norm
  BEFORE INSERT ON executions_normalized
  FOR EACH ROW
  EXECUTE FUNCTION before_insert_exec_norm();

-- Create unique index for deduplication
-- This prevents duplicate executions based on user_id, broker_account_id, and unique_hash
CREATE UNIQUE INDEX IF NOT EXISTS ux_exec_dedupe
ON executions_normalized (
  user_id,
  COALESCE(broker_account_id, '00000000-0000-0000-0000-000000000000'::uuid),
  unique_hash
);

-- Function to mark "stuck" import runs as failed
CREATE OR REPLACE FUNCTION mark_stuck_import_runs()
RETURNS integer AS $$
DECLARE
  stuck_count integer;
BEGIN
  -- Update runs that have been processing for more than 24 hours
  UPDATE import_runs 
  SET 
    status = 'failed',
    finished_at = now(),
    summary = jsonb_set(
      COALESCE(summary, '{}'::jsonb),
      '{error}',
      '"timeout"'
    )
  WHERE 
    status = 'processing' 
    AND started_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS stuck_count = ROW_COUNT;
  
  RETURN stuck_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old temp uploads
CREATE OR REPLACE FUNCTION cleanup_temp_uploads()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete temp uploads older than 24 hours
  DELETE FROM temp_uploads 
  WHERE created_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old raw import items (optional cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_raw_items()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete raw import items older than 30 days that are not associated with successful runs
  DELETE FROM raw_import_items 
  WHERE 
    created_at < now() - interval '30 days'
    AND import_run_id IN (
      SELECT id FROM import_runs 
      WHERE status IN ('failed', 'partial') 
      AND finished_at < now() - interval '30 days'
    );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a comprehensive cleanup function
CREATE OR REPLACE FUNCTION run_cleanup_maintenance()
RETURNS json AS $$
DECLARE
  stuck_runs integer;
  temp_uploads integer;
  raw_items integer;
  result json;
BEGIN
  -- Mark stuck runs
  stuck_runs := mark_stuck_import_runs();
  
  -- Cleanup temp uploads
  temp_uploads := cleanup_temp_uploads();
  
  -- Cleanup old raw items
  raw_items := cleanup_old_raw_items();
  
  -- Return summary
  result := json_build_object(
    'stuck_runs_marked', stuck_runs,
    'temp_uploads_deleted', temp_uploads,
    'raw_items_deleted', raw_items,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION compute_unique_hash(record) IS 'Computes SHA256 hash for execution deduplication based on timestamp, symbol, side, quantity, price, and broker_account_id';
COMMENT ON FUNCTION before_insert_exec_norm() IS 'Trigger function to automatically compute unique_hash for new executions';
COMMENT ON FUNCTION mark_stuck_import_runs() IS 'Marks import runs as failed if they have been processing for more than 24 hours';
COMMENT ON FUNCTION cleanup_temp_uploads() IS 'Deletes temporary uploads older than 24 hours';
COMMENT ON FUNCTION cleanup_old_raw_items() IS 'Deletes old raw import items from failed/partial runs older than 30 days';
COMMENT ON FUNCTION run_cleanup_maintenance() IS 'Runs all cleanup operations and returns summary';

-- Create a view to monitor stuck runs
CREATE OR REPLACE VIEW stuck_import_runs AS
SELECT 
  id,
  user_id,
  source,
  status,
  started_at,
  EXTRACT(EPOCH FROM (now() - started_at))/3600 as hours_stuck
FROM import_runs 
WHERE 
  status = 'processing' 
  AND started_at < now() - interval '24 hours'
ORDER BY started_at ASC;

-- Create a view to monitor temp uploads
CREATE OR REPLACE VIEW old_temp_uploads AS
SELECT 
  id,
  user_id,
  filename,
  created_at,
  EXTRACT(EPOCH FROM (now() - created_at))/3600 as hours_old
FROM temp_uploads 
WHERE created_at < now() - interval '24 hours'
ORDER BY created_at ASC;

-- Add comments to views
COMMENT ON VIEW stuck_import_runs IS 'Shows import runs that have been processing for more than 24 hours';
COMMENT ON VIEW old_temp_uploads IS 'Shows temporary uploads older than 24 hours';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION compute_unique_hash(record) TO authenticated;
GRANT EXECUTE ON FUNCTION before_insert_exec_norm() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_stuck_import_runs() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_temp_uploads() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_raw_items() TO authenticated;
GRANT EXECUTE ON FUNCTION run_cleanup_maintenance() TO authenticated;

GRANT SELECT ON stuck_import_runs TO authenticated;
GRANT SELECT ON old_temp_uploads TO authenticated;

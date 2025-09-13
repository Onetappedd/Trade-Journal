-- Add resume/retry capabilities to import system
-- This allows users to resume large imports that fail mid-way

-- Add new fields to import_runs table
ALTER TABLE import_runs 
ADD COLUMN IF NOT EXISTS processed_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_row_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS resume_token TEXT DEFAULT NULL;

-- Add index for faster resume lookups
CREATE INDEX IF NOT EXISTS idx_import_runs_resume_token ON import_runs(resume_token);
CREATE INDEX IF NOT EXISTS idx_import_runs_status_processing ON import_runs(status) WHERE status = 'processing';

-- Update the summary JSONB structure to include resume information
-- This will be populated by the import system
COMMENT ON COLUMN import_runs.processed_bytes IS 'Number of bytes processed so far (for resume capability)';
COMMENT ON COLUMN import_runs.last_row_index IS 'Last successfully processed row index (0-based, for resume capability)';
COMMENT ON COLUMN import_runs.total_bytes IS 'Total file size in bytes (for progress calculation)';
COMMENT ON COLUMN import_runs.resume_token IS 'Unique token for resuming this import run';

-- Function to generate resume token
CREATE OR REPLACE FUNCTION generate_resume_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'resume_' || gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

-- Function to mark import run as resumable
CREATE OR REPLACE FUNCTION mark_import_resumable(
  p_import_run_id UUID,
  p_last_row_index INTEGER,
  p_processed_bytes BIGINT
)
RETURNS VOID AS $$
BEGIN
  UPDATE import_runs 
  SET 
    last_row_index = p_last_row_index,
    processed_bytes = p_processed_bytes,
    resume_token = COALESCE(resume_token, generate_resume_token()),
    updated_at = NOW()
  WHERE id = p_import_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if import can be resumed
CREATE OR REPLACE FUNCTION can_resume_import(p_import_run_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  run_record import_runs%ROWTYPE;
BEGIN
  SELECT * INTO run_record FROM import_runs WHERE id = p_import_run_id;
  
  -- Can resume if:
  -- 1. Import exists and is owned by current user
  -- 2. Status is 'processing' (failed mid-way)
  -- 3. Has a resume token
  -- 4. Has processed some rows
  RETURN run_record IS NOT NULL 
         AND run_record.user_id = auth.uid()
         AND run_record.status = 'processing'
         AND run_record.resume_token IS NOT NULL
         AND run_record.last_row_index > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get resume information
CREATE OR REPLACE FUNCTION get_import_resume_info(p_import_run_id UUID)
RETURNS TABLE(
  can_resume BOOLEAN,
  resume_token TEXT,
  last_row_index INTEGER,
  processed_bytes BIGINT,
  total_bytes BIGINT,
  total_rows INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    can_resume_import(p_import_run_id) as can_resume,
    ir.resume_token,
    ir.last_row_index,
    ir.processed_bytes,
    ir.total_bytes,
    COALESCE(ir.summary->>'totalRows', '0')::INTEGER as total_rows
  FROM import_runs ir
  WHERE ir.id = p_import_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_import_resumable TO authenticated;
GRANT EXECUTE ON FUNCTION can_resume_import TO authenticated;
GRANT EXECUTE ON FUNCTION get_import_resume_info TO authenticated;
GRANT EXECUTE ON FUNCTION generate_resume_token TO authenticated;

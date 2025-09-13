-- Prompt 2 — Make CSV commit robust: Node runtime + chunked processing + progress
-- Migration: 20250101000007_create_import_jobs_table.sql

-- Create import_jobs table for tracking chunked processing
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id UUID NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_ref TEXT NOT NULL, -- Reference to temp upload or file path
  mapping JSONB NOT NULL, -- Field mapping configuration
  options JSONB, -- Processing options (timezone, currency, etc.)
  total_rows INTEGER NOT NULL,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_import_run_id ON import_jobs(import_run_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_import_jobs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_import_jobs_updated_at
  BEFORE UPDATE ON import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_import_jobs_updated_at();

-- Add RLS policies
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own import jobs
CREATE POLICY "Users can view own import jobs" ON import_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own import jobs
CREATE POLICY "Users can insert own import jobs" ON import_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own import jobs
CREATE POLICY "Users can update own import jobs" ON import_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON import_jobs TO authenticated;

-- Create a view for job progress
CREATE OR REPLACE VIEW import_job_progress AS
SELECT 
  j.id as job_id,
  j.import_run_id,
  j.user_id,
  j.total_rows,
  j.processed_rows,
  j.status,
  j.created_at,
  j.started_at,
  j.finished_at,
  j.error_message,
  CASE 
    WHEN j.total_rows > 0 THEN 
      ROUND((j.processed_rows::numeric / j.total_rows::numeric) * 100, 2)
    ELSE 0 
  END as progress_percentage,
  j.total_rows - j.processed_rows as remaining_rows
FROM import_jobs j;

-- Grant permissions on view
GRANT SELECT ON import_job_progress TO authenticated;

-- Add comments
COMMENT ON TABLE import_jobs IS 'Tracks chunked CSV import processing jobs';
COMMENT ON COLUMN import_jobs.upload_ref IS 'Reference to temporary upload file or storage path';
COMMENT ON COLUMN import_jobs.mapping IS 'Field mapping configuration for CSV processing';
COMMENT ON COLUMN import_jobs.total_rows IS 'Total number of rows to process';
COMMENT ON COLUMN import_jobs.processed_rows IS 'Number of rows processed so far';
COMMENT ON COLUMN import_jobs.status IS 'Current status of the import job';
COMMENT ON VIEW import_job_progress IS 'View for tracking import job progress with percentage calculation';

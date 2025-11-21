-- Add missing file_name and file_size columns to import_runs table
-- These columns are needed by the CSV import endpoint

ALTER TABLE import_runs 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS total_rows INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processed_rows INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS errors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS result JSONB,
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN import_runs.file_name IS 'Original filename of the imported file';
COMMENT ON COLUMN import_runs.file_size IS 'Size of the imported file in bytes';
COMMENT ON COLUMN import_runs.total_rows IS 'Total number of rows in the import file';
COMMENT ON COLUMN import_runs.processed_rows IS 'Number of rows processed so far';
COMMENT ON COLUMN import_runs.progress IS 'Import progress percentage (0-100)';
COMMENT ON COLUMN import_runs.errors IS 'Array of error messages encountered during import';
COMMENT ON COLUMN import_runs.result IS 'Final import result with stats (inserted, skipped, errors)';
COMMENT ON COLUMN import_runs.options IS 'Import options used (skipDuplicates, normalizeTimestamps, etc.)';


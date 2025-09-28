-- Bulletproof Import System Migration
-- Adds tables for import runs, matching jobs, and row-level idempotency

-- Import runs table
CREATE TABLE IF NOT EXISTS import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'csv',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  file_name TEXT,
  file_size BIGINT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  errors TEXT[] DEFAULT '{}',
  result JSONB,
  options JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matching jobs table
CREATE TABLE IF NOT EXISTS matching_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_run_id UUID REFERENCES import_runs(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add row_hash column to trades table for idempotency
ALTER TABLE trades ADD COLUMN IF NOT EXISTS row_hash TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS broker TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS broker_trade_id TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS import_run_id UUID REFERENCES import_runs(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_runs_user_id ON import_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_runs_status ON import_runs(status);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_user_id ON matching_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_status ON matching_jobs(status);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_symbol_date ON matching_jobs(symbol, date);
CREATE INDEX IF NOT EXISTS idx_trades_row_hash ON trades(row_hash);
CREATE INDEX IF NOT EXISTS idx_trades_broker_trade_id ON trades(broker_trade_id);
CREATE INDEX IF NOT EXISTS idx_trades_import_run_id ON trades(import_run_id);

-- RLS policies for import_runs
ALTER TABLE import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import runs" ON import_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import runs" ON import_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import runs" ON import_runs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for matching_jobs
ALTER TABLE matching_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matching jobs" ON matching_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matching jobs" ON matching_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matching jobs" ON matching_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_import_runs_updated_at 
  BEFORE UPDATE ON import_runs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create matching jobs after import completion
CREATE OR REPLACE FUNCTION create_matching_jobs()
RETURNS TRIGGER AS $$
DECLARE
  trade_record RECORD;
  batch_key TEXT;
  batches JSONB := '{}';
BEGIN
  -- Only process when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get unique symbol/date combinations from the import
    FOR trade_record IN 
      SELECT DISTINCT symbol, DATE(opened_at) as trade_date
      FROM trades 
      WHERE import_run_id = NEW.id
    LOOP
      batch_key := trade_record.symbol || '_' || trade_record.trade_date;
      
      -- Insert matching job if not exists
      INSERT INTO matching_jobs (user_id, import_run_id, symbol, date, status)
      VALUES (NEW.user_id, NEW.id, trade_record.symbol, trade_record.trade_date, 'queued')
      ON CONFLICT (user_id, import_run_id, symbol, date) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create matching jobs
CREATE TRIGGER create_matching_jobs_trigger
  AFTER UPDATE ON import_runs
  FOR EACH ROW EXECUTE FUNCTION create_matching_jobs();

-- Add unique constraint for matching jobs
CREATE UNIQUE INDEX IF NOT EXISTS idx_matching_jobs_unique 
  ON matching_jobs(user_id, import_run_id, symbol, date);

-- Add comments for documentation
COMMENT ON TABLE import_runs IS 'Tracks CSV import runs with status and progress';
COMMENT ON TABLE matching_jobs IS 'Tracks trade matching jobs for imported trades';
COMMENT ON COLUMN trades.row_hash IS 'SHA256 hash for row-level idempotency';
COMMENT ON COLUMN trades.broker IS 'Broker source for the trade';
COMMENT ON COLUMN trades.broker_trade_id IS 'Original trade ID from broker';
COMMENT ON COLUMN trades.import_run_id IS 'Reference to the import run that created this trade';


-- Complete Database Setup for Riskr Trading Journal
-- Run this in Supabase SQL Editor to set up the entire database schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. CORE TRADING SCHEMA
-- =============================================================================

-- Create broker_accounts table
CREATE TABLE IF NOT EXISTS broker_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker TEXT NOT NULL CHECK (broker IN ('td_ameritrade', 'etrade', 'fidelity', 'robinhood', 'ibkr', 'tastyworks')),
    label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled', 'connected', 'error', 'expired')),
    connected_at TIMESTAMPTZ,
    access_token_enc TEXT,
    refresh_token_enc TEXT,
    expires_at TIMESTAMPTZ,
    account_ids JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create import_runs table
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

-- Create matching_jobs table
CREATE TABLE IF NOT EXISTS matching_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    import_run_id UUID REFERENCES import_runs(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create raw_import_items table
CREATE TABLE IF NOT EXISTS raw_import_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_run_id UUID NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_line INTEGER NOT NULL,
    raw_payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'parsed' CHECK (status IN ('parsed', 'error', 'duplicate')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create executions_normalized table
CREATE TABLE IF NOT EXISTS executions_normalized (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_account_id UUID REFERENCES broker_accounts(id) ON DELETE SET NULL,
    source_import_run_id UUID REFERENCES import_runs(id) ON DELETE SET NULL,
    instrument_type TEXT NOT NULL CHECK (instrument_type IN ('equity', 'option', 'futures')),
    symbol TEXT NOT NULL,
    occ_symbol TEXT,
    futures_symbol TEXT,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell', 'short', 'cover')),
    quantity NUMERIC NOT NULL CHECK (quantity != 0),
    price NUMERIC NOT NULL CHECK (price > 0),
    fees NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    timestamp TIMESTAMPTZ NOT NULL,
    venue TEXT,
    order_id TEXT,
    exec_id TEXT,
    multiplier NUMERIC DEFAULT 1,
    expiry DATE,
    strike NUMERIC,
    option_type TEXT CHECK (option_type IN ('C', 'P')),
    underlying TEXT,
    notes TEXT,
    unique_hash TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trades table (main trading table)
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_key TEXT NOT NULL,
    instrument_type TEXT NOT NULL CHECK (instrument_type IN ('equity', 'option', 'futures')),
    symbol TEXT NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    qty_opened NUMERIC NOT NULL CHECK (qty_opened > 0),
    qty_closed NUMERIC DEFAULT 0 CHECK (qty_closed >= 0),
    avg_open_price NUMERIC NOT NULL CHECK (avg_open_price > 0),
    avg_close_price NUMERIC,
    realized_pnl NUMERIC,
    fees NUMERIC DEFAULT 0,
    legs JSONB,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    -- Import system columns
    row_hash TEXT,
    broker TEXT,
    broker_trade_id TEXT,
    import_run_id UUID REFERENCES import_runs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create instruments table
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_type TEXT NOT NULL CHECK (instrument_type IN ('equity', 'option', 'futures')),
    unique_symbol TEXT NOT NULL UNIQUE,
    multiplier NUMERIC DEFAULT 1,
    exchange TEXT,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create instrument_aliases table
CREATE TABLE IF NOT EXISTS instrument_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    alias_symbol TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(alias_symbol, source)
);

-- Create corporate_actions table
CREATE TABLE IF NOT EXISTS corporate_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('split', 'dividend', 'occ_adjustment')),
    effective_date DATE NOT NULL,
    factor NUMERIC,
    memo_url TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- =============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================================================

-- broker_accounts indexes
CREATE INDEX IF NOT EXISTS idx_broker_accounts_user_id ON broker_accounts(user_id);

-- import_runs indexes
CREATE INDEX IF NOT EXISTS idx_import_runs_user_id ON import_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_runs_status ON import_runs(status);

-- matching_jobs indexes
CREATE INDEX IF NOT EXISTS idx_matching_jobs_user_id ON matching_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_status ON matching_jobs(status);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_symbol_date ON matching_jobs(symbol, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_matching_jobs_unique ON matching_jobs(user_id, import_run_id, symbol, date);

-- raw_import_items indexes
CREATE INDEX IF NOT EXISTS idx_raw_import_items_import_run_id ON raw_import_items(import_run_id);
CREATE INDEX IF NOT EXISTS idx_raw_import_items_user_id ON raw_import_items(user_id);

-- executions_normalized indexes
CREATE INDEX IF NOT EXISTS idx_executions_normalized_user_id_timestamp ON executions_normalized(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_executions_normalized_unique_hash ON executions_normalized(unique_hash);
CREATE INDEX IF NOT EXISTS idx_executions_normalized_symbol ON executions_normalized(symbol);
CREATE INDEX IF NOT EXISTS idx_executions_normalized_broker_account_id ON executions_normalized(broker_account_id);

-- trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id_opened_at ON trades(user_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_group_key ON trades(group_key);
CREATE INDEX IF NOT EXISTS idx_trades_row_hash ON trades(row_hash);
CREATE INDEX IF NOT EXISTS idx_trades_broker_trade_id ON trades(broker_trade_id);
CREATE INDEX IF NOT EXISTS idx_trades_import_run_id ON trades(import_run_id);

-- instruments indexes
CREATE INDEX IF NOT EXISTS idx_instruments_unique_symbol ON instruments(unique_symbol);

-- instrument_aliases indexes
CREATE INDEX IF NOT EXISTS idx_instrument_aliases_alias_symbol ON instrument_aliases(alias_symbol);

-- corporate_actions indexes
CREATE INDEX IF NOT EXISTS idx_corporate_actions_symbol_effective_date ON corporate_actions(symbol, effective_date DESC);

-- watchlist indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(symbol);

-- =============================================================================
-- 3. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to compute unique_hash
CREATE OR REPLACE FUNCTION compute_execution_hash(
    p_timestamp TIMESTAMPTZ,
    p_symbol TEXT,
    p_side TEXT,
    p_quantity NUMERIC,
    p_price NUMERIC,
    p_broker_account_id UUID
) RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        digest(
            concat_ws('|', 
                p_timestamp::text,
                p_symbol,
                p_side,
                abs(p_quantity)::text,
                p_price::text,
                coalesce(p_broker_account_id::text, '')
            ),
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function for execution hash
CREATE OR REPLACE FUNCTION set_execution_hash() RETURNS TRIGGER AS $$
BEGIN
    NEW.unique_hash = compute_execution_hash(
        NEW.timestamp,
        NEW.symbol,
        NEW.side,
        NEW.quantity,
        NEW.price,
        NEW.broker_account_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for execution hash
DROP TRIGGER IF EXISTS trigger_set_execution_hash ON executions_normalized;
CREATE TRIGGER trigger_set_execution_hash
    BEFORE INSERT OR UPDATE ON executions_normalized
    FOR EACH ROW
    EXECUTE FUNCTION set_execution_hash();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_broker_accounts_updated_at ON broker_accounts;
CREATE TRIGGER update_broker_accounts_updated_at BEFORE UPDATE ON broker_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_instruments_updated_at ON instruments;
CREATE TRIGGER update_instruments_updated_at BEFORE UPDATE ON instruments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_import_runs_updated_at ON import_runs;
CREATE TRIGGER update_import_runs_updated_at BEFORE UPDATE ON import_runs
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
DROP TRIGGER IF EXISTS create_matching_jobs_trigger ON import_runs;
CREATE TRIGGER create_matching_jobs_trigger
  AFTER UPDATE ON import_runs
  FOR EACH ROW EXECUTE FUNCTION create_matching_jobs();

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE broker_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. RLS POLICIES
-- =============================================================================

-- broker_accounts policies
DROP POLICY IF EXISTS "Users can view their own broker accounts" ON broker_accounts;
CREATE POLICY "Users can view their own broker accounts" ON broker_accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own broker accounts" ON broker_accounts;
CREATE POLICY "Users can insert their own broker accounts" ON broker_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own broker accounts" ON broker_accounts;
CREATE POLICY "Users can update their own broker accounts" ON broker_accounts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own broker accounts" ON broker_accounts;
CREATE POLICY "Users can delete their own broker accounts" ON broker_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- import_runs policies
DROP POLICY IF EXISTS "Users can view their own import runs" ON import_runs;
CREATE POLICY "Users can view their own import runs" ON import_runs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own import runs" ON import_runs;
CREATE POLICY "Users can insert their own import runs" ON import_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own import runs" ON import_runs;
CREATE POLICY "Users can update their own import runs" ON import_runs
  FOR UPDATE USING (auth.uid() = user_id);

-- matching_jobs policies
DROP POLICY IF EXISTS "Users can view their own matching jobs" ON matching_jobs;
CREATE POLICY "Users can view their own matching jobs" ON matching_jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own matching jobs" ON matching_jobs;
CREATE POLICY "Users can insert their own matching jobs" ON matching_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own matching jobs" ON matching_jobs;
CREATE POLICY "Users can update their own matching jobs" ON matching_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- trades policies
DROP POLICY IF EXISTS "Users can view their own trades" ON trades;
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON trades;
CREATE POLICY "Users can insert their own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON trades;
CREATE POLICY "Users can update their own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trades" ON trades;
CREATE POLICY "Users can delete their own trades" ON trades
    FOR DELETE USING (auth.uid() = user_id);

-- profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- watchlist policies
DROP POLICY IF EXISTS "Users can view own watchlist" ON watchlist;
CREATE POLICY "Users can view own watchlist" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own watchlist" ON watchlist;
CREATE POLICY "Users can manage own watchlist" ON watchlist
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE import_runs IS 'Tracks CSV import runs with status and progress';
COMMENT ON TABLE matching_jobs IS 'Tracks trade matching jobs for imported trades';
COMMENT ON TABLE trades IS 'Main trading records with import tracking';
COMMENT ON COLUMN trades.row_hash IS 'SHA256 hash for row-level idempotency';
COMMENT ON COLUMN trades.broker IS 'Broker source for the trade';
COMMENT ON COLUMN trades.broker_trade_id IS 'Original trade ID from broker';
COMMENT ON COLUMN trades.import_run_id IS 'Reference to the import run that created this trade';

-- =============================================================================
-- 8. VERIFICATION
-- =============================================================================

-- Show final table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('trades', 'profiles', 'watchlist', 'import_runs', 'executions_normalized', 'broker_accounts')
ORDER BY table_name, ordinal_position;

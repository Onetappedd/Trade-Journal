-- =============================================================================
-- SIMPLE SUPABASE DATABASE SETUP FOR RISKR TRADING JOURNAL
-- =============================================================================
-- This script works with existing tables and adds only what's needed
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. CREATE MISSING TABLES
-- =============================================================================

-- Create import_runs table (CSV import tracking) - THIS IS THE KEY MISSING TABLE
CREATE TABLE IF NOT EXISTS public.import_runs (
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

-- Create matching_jobs table (trade matching)
CREATE TABLE IF NOT EXISTS public.matching_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    import_run_id UUID REFERENCES public.import_runs(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. ADD MISSING COLUMNS TO EXISTING TRADES TABLE
-- =============================================================================

-- Add import system columns to trades table if they don't exist
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS row_hash TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS broker TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS broker_trade_id TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS import_run_id UUID REFERENCES public.import_runs(id);

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Import runs indexes
CREATE INDEX IF NOT EXISTS idx_import_runs_user_id ON public.import_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_runs_status ON public.import_runs(status);

-- Matching jobs indexes
CREATE INDEX IF NOT EXISTS idx_matching_jobs_user_id ON public.matching_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_status ON public.matching_jobs(status);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_symbol_date ON public.matching_jobs(symbol, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_matching_jobs_unique ON public.matching_jobs(user_id, import_run_id, symbol, date);

-- Trades indexes for import system
CREATE INDEX IF NOT EXISTS idx_trades_row_hash ON public.trades(row_hash);
CREATE INDEX IF NOT EXISTS idx_trades_import_run_id ON public.trades(import_run_id);

-- =============================================================================
-- 4. FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate row hash for deduplication
CREATE OR REPLACE FUNCTION public.generate_row_hash(
    p_user_id uuid,
    p_symbol text,
    p_side text,
    p_quantity numeric,
    p_price numeric,
    p_timestamp timestamptz
) RETURNS text AS $$
BEGIN
    RETURN encode(
        digest(
            p_user_id::text || '|' || 
            p_symbol || '|' || 
            p_side || '|' || 
            p_quantity::text || '|' || 
            p_price::text || '|' || 
            p_timestamp::text,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to set trade row hash (using created_at since entry_date doesn't exist)
CREATE OR REPLACE FUNCTION public.set_trade_row_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.row_hash IS NULL THEN
        NEW.row_hash := public.generate_row_hash(
            NEW.user_id,
            NEW.symbol,
            NEW.side,
            NEW.quantity,
            NEW.entry_price,
            NEW.created_at
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

-- Updated_at trigger for import_runs
DROP TRIGGER IF EXISTS update_import_runs_updated_at ON public.import_runs;
CREATE TRIGGER update_import_runs_updated_at 
    BEFORE UPDATE ON public.import_runs 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Row hash trigger for trades
DROP TRIGGER IF EXISTS trigger_set_trade_row_hash ON public.trades;
CREATE TRIGGER trigger_set_trade_row_hash
    BEFORE INSERT OR UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.set_trade_row_hash();

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_jobs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. RLS POLICIES
-- =============================================================================

-- Import runs policies
DROP POLICY IF EXISTS "Users can view their own import runs" ON public.import_runs;
CREATE POLICY "Users can view their own import runs" ON public.import_runs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own import runs" ON public.import_runs;
CREATE POLICY "Users can insert their own import runs" ON public.import_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own import runs" ON public.import_runs;
CREATE POLICY "Users can update their own import runs" ON public.import_runs
    FOR UPDATE USING (auth.uid() = user_id);

-- Matching jobs policies
DROP POLICY IF EXISTS "Users can view their own matching jobs" ON public.matching_jobs;
CREATE POLICY "Users can view their own matching jobs" ON public.matching_jobs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own matching jobs" ON public.matching_jobs;
CREATE POLICY "Users can insert their own matching jobs" ON public.matching_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own matching jobs" ON public.matching_jobs;
CREATE POLICY "Users can update their own matching jobs" ON public.matching_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 8. GRANT PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.import_runs TO authenticated;
GRANT ALL ON public.matching_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_row_hash TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_trade_row_hash TO authenticated;

-- =============================================================================
-- 9. VERIFICATION
-- =============================================================================

-- Show what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('trades', 'profiles', 'watchlist', 'import_runs', 'matching_jobs')
ORDER BY table_name;

-- Show import_runs table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'import_runs'
ORDER BY ordinal_position;

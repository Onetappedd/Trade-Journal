-- =============================================================================
-- COMPLETE SUPABASE DATABASE SETUP FOR RISKR TRADING JOURNAL (FIXED)
-- =============================================================================
-- Run this SQL script in your Supabase SQL Editor
-- Project: https://supabase.com/dashboard/project/lobigrwmngwirucuklmc
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. CORE TABLES
-- =============================================================================

-- Create profiles table (user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table (main trading records)
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(15,4) NOT NULL,
    entry_price DECIMAL(15,4) NOT NULL,
    exit_price DECIMAL(15,4),
    entry_date DATE NOT NULL,
    exit_date DATE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT,
    -- Import system columns
    row_hash TEXT,
    broker TEXT,
    broker_trade_id TEXT,
    import_run_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create import_runs table (CSV import tracking)
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

-- Create watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- =============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON public.trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_row_hash ON public.trades(row_hash);
CREATE INDEX IF NOT EXISTS idx_trades_import_run_id ON public.trades(import_run_id);

-- Import runs indexes
CREATE INDEX IF NOT EXISTS idx_import_runs_user_id ON public.import_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_runs_status ON public.import_runs(status);

-- Matching jobs indexes
CREATE INDEX IF NOT EXISTS idx_matching_jobs_user_id ON public.matching_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_status ON public.matching_jobs(status);
CREATE INDEX IF NOT EXISTS idx_matching_jobs_symbol_date ON public.matching_jobs(symbol, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_matching_jobs_unique ON public.matching_jobs(user_id, import_run_id, symbol, date);

-- Watchlist indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON public.watchlist(symbol);

-- =============================================================================
-- 3. FUNCTIONS AND TRIGGERS
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

-- Function to set trade row hash
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
            NEW.entry_date::timestamptz
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create matching jobs after import completion
CREATE OR REPLACE FUNCTION public.create_matching_jobs()
RETURNS TRIGGER AS $$
DECLARE
  trade_record RECORD;
BEGIN
  -- Only process when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get unique symbol/date combinations from the import
    FOR trade_record IN 
      SELECT DISTINCT symbol, entry_date as trade_date
      FROM public.trades 
      WHERE import_run_id = NEW.id
    LOOP
      -- Insert matching job if not exists
      INSERT INTO public.matching_jobs (user_id, import_run_id, symbol, date, status)
      VALUES (NEW.user_id, NEW.id, trade_record.symbol, trade_record.trade_date, 'queued')
      ON CONFLICT (user_id, import_run_id, symbol, date) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON public.trades 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

-- Matching jobs trigger
DROP TRIGGER IF EXISTS create_matching_jobs_trigger ON public.import_runs;
CREATE TRIGGER create_matching_jobs_trigger
    AFTER UPDATE ON public.import_runs
    FOR EACH ROW EXECUTE FUNCTION public.create_matching_jobs();

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. RLS POLICIES
-- =============================================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Trades policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
CREATE POLICY "Users can insert their own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
CREATE POLICY "Users can update their own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
CREATE POLICY "Users can delete their own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

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

-- Watchlist policies
DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
CREATE POLICY "Users can view own watchlist" ON public.watchlist
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own watchlist" ON public.watchlist;
CREATE POLICY "Users can manage own watchlist" ON public.watchlist
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 7. GRANT PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_row_hash TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_trade_row_hash TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_matching_jobs TO authenticated;

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
AND table_name IN ('trades', 'profiles', 'watchlist', 'import_runs', 'matching_jobs')
ORDER BY table_name, ordinal_position;

-- Show RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('trades', 'profiles', 'watchlist', 'import_runs', 'matching_jobs')
ORDER BY tablename;

-- Migration: Verify CSV Import Schema
-- Description: Ensure all required tables, columns, indexes, and RLS policies exist
-- Date: 2025-01-27

-- 1) Verify and create ingestion_runs table with all required columns
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    source text NOT NULL,
    file_name text NOT NULL,
    row_count int NOT NULL DEFAULT 0,
    inserted_count int NOT NULL DEFAULT 0,
    failed_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Ensure trades table has required columns
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS ingestion_run_id uuid;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS row_hash text;

-- 3) Create required indexes
CREATE UNIQUE INDEX IF NOT EXISTS trades_user_rowhash_uidx ON public.trades (user_id, row_hash);
CREATE INDEX IF NOT EXISTS trades_ingestion_run_idx ON public.trades (ingestion_run_id);

-- 4) Enable RLS on both tables
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- 5) Create RLS policies for trades table
DROP POLICY IF EXISTS trades_insert_own ON public.trades;
CREATE POLICY trades_insert_own ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS trades_select_own ON public.trades;
CREATE POLICY trades_select_own ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS trades_update_own ON public.trades;
CREATE POLICY trades_update_own ON public.trades
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS trades_delete_own ON public.trades;
CREATE POLICY trades_delete_own ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- 6) Create RLS policies for ingestion_runs table
DROP POLICY IF EXISTS runs_insert_own ON public.ingestion_runs;
CREATE POLICY runs_insert_own ON public.ingestion_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS runs_select_own ON public.ingestion_runs;
CREATE POLICY runs_select_own ON public.ingestion_runs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS runs_update_own ON public.ingestion_runs;
CREATE POLICY runs_update_own ON public.ingestion_runs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS runs_delete_own ON public.ingestion_runs;
CREATE POLICY runs_delete_own ON public.ingestion_runs
    FOR DELETE USING (auth.uid() = user_id);

-- 7) Add foreign key constraint for ingestion_run_id
ALTER TABLE public.trades 
ADD CONSTRAINT IF NOT EXISTS fk_trades_ingestion_run_id 
FOREIGN KEY (ingestion_run_id) REFERENCES public.ingestion_runs(id) ON DELETE SET NULL;

-- 8) Add foreign key constraint for user_id in ingestion_runs
ALTER TABLE public.ingestion_runs 
ADD CONSTRAINT IF NOT EXISTS fk_ingestion_runs_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 9) Add foreign key constraint for user_id in trades (if not already exists)
ALTER TABLE public.trades 
ADD CONSTRAINT IF NOT EXISTS fk_trades_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 10) Create a function to generate row hash for deduplication
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

-- 11) Create a trigger to automatically set row_hash on insert/update
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
            NEW.entry_date
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_set_trade_row_hash ON public.trades;
CREATE TRIGGER trigger_set_trade_row_hash
    BEFORE INSERT OR UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.set_trade_row_hash();

-- 12) Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.ingestion_runs TO authenticated;
GRANT ALL ON public.trades TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_row_hash TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_trade_row_hash TO authenticated;


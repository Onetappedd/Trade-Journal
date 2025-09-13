-- Migration: CSV Import System
-- Description: Create ingestion tracking tables and enhance trades table for new CSV import system
-- Date: 2025-01-15

-- 1) Create ingestion_runs table
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

-- 2) Add ingestion tracking columns to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS ingestion_run_id uuid;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS row_hash text;

-- 3) Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS trades_user_rowhash_uidx ON public.trades (user_id, row_hash);
CREATE INDEX IF NOT EXISTS trades_ingestion_run_idx ON public.trades (ingestion_run_id);

-- 4) Enable RLS on tables
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- 5) Create RLS policies for trades table
CREATE POLICY IF NOT EXISTS trades_insert_own ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS trades_select_own ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

-- 6) Create RLS policies for ingestion_runs table
CREATE POLICY IF NOT EXISTS runs_insert_own ON public.ingestion_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS runs_select_own ON public.ingestion_runs
    FOR SELECT USING (auth.uid() = user_id);

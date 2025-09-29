-- Apply Idempotency Migration for Webull Imports
-- Run this in your Supabase SQL Editor

-- 1) Add missing columns to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS symbol_raw text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS meta jsonb;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS broker text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS asset_type text CHECK (asset_type IN ('equity', 'option', 'futures'));
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS fees numeric DEFAULT 0;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS commission numeric DEFAULT 0;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS executed_at timestamptz;

-- 2) Create unique index on (user_id, idempotency_key) for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS trades_user_idempotency_uidx 
ON public.trades (user_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 3) Create other useful indexes
CREATE INDEX IF NOT EXISTS trades_symbol_raw_idx 
ON public.trades (symbol_raw) 
WHERE symbol_raw IS NOT NULL;

CREATE INDEX IF NOT EXISTS trades_broker_idx 
ON public.trades (broker) 
WHERE broker IS NOT NULL;

CREATE INDEX IF NOT EXISTS trades_external_id_idx 
ON public.trades (external_id) 
WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS trades_executed_at_idx 
ON public.trades (executed_at) 
WHERE executed_at IS NOT NULL;

-- 4) Add comments to document the new columns
COMMENT ON COLUMN public.trades.idempotency_key IS 'Unique key per user for deduplication of imports';
COMMENT ON COLUMN public.trades.symbol_raw IS 'Original symbol as provided by broker (e.g., TSLA250822C00325000)';
COMMENT ON COLUMN public.trades.meta IS 'Additional metadata from broker (rowIndex, raw data, etc.)';
COMMENT ON COLUMN public.trades.broker IS 'Broker name (e.g., webull, td_ameritrade)';
COMMENT ON COLUMN public.trades.external_id IS 'External ID from broker (e.g., order ID)';
COMMENT ON COLUMN public.trades.asset_type IS 'Type of asset (equity, option, futures)';
COMMENT ON COLUMN public.trades.fees IS 'Fees charged by broker';
COMMENT ON COLUMN public.trades.commission IS 'Commission charged by broker';
COMMENT ON COLUMN public.trades.executed_at IS 'Precise execution timestamp from broker';

-- 5) Verify the migration worked
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'trades' 
  AND table_schema = 'public'
  AND column_name IN ('idempotency_key', 'symbol_raw', 'meta', 'broker', 'external_id', 'asset_type', 'fees', 'commission', 'executed_at')
ORDER BY column_name;

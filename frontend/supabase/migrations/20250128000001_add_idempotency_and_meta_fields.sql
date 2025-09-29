-- Migration: Add Idempotency Key and Meta Fields
-- Description: Add idempotency_key, symbol_raw, and meta jsonb columns to trades table
-- Date: 2025-01-28

-- 1) Add missing columns to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS symbol_raw text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS meta jsonb;

-- 2) Add broker and external_id columns if missing (for Webull imports)
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS broker text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS external_id text;

-- 3) Add asset_type column if missing (for options vs equity)
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS asset_type text CHECK (asset_type IN ('equity', 'option', 'futures'));

-- 4) Add fees and commission columns if missing
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS fees numeric DEFAULT 0;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS commission numeric DEFAULT 0;

-- 5) Add executed_at column if missing (for precise execution timing)
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS executed_at timestamptz;

-- 6) Create unique index on (user_id, idempotency_key) for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS trades_user_idempotency_uidx 
ON public.trades (user_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 7) Create index on symbol_raw for lookups
CREATE INDEX IF NOT EXISTS trades_symbol_raw_idx 
ON public.trades (symbol_raw) 
WHERE symbol_raw IS NOT NULL;

-- 8) Create index on broker for filtering
CREATE INDEX IF NOT EXISTS trades_broker_idx 
ON public.trades (broker) 
WHERE broker IS NOT NULL;

-- 9) Create index on external_id for broker-specific lookups
CREATE INDEX IF NOT EXISTS trades_external_id_idx 
ON public.trades (external_id) 
WHERE external_id IS NOT NULL;

-- 10) Create index on executed_at for time-based queries
CREATE INDEX IF NOT EXISTS trades_executed_at_idx 
ON public.trades (executed_at) 
WHERE executed_at IS NOT NULL;

-- 11) Create composite index for user + executed_at for performance
CREATE INDEX IF NOT EXISTS trades_user_executed_at_idx 
ON public.trades (user_id, executed_at DESC) 
WHERE executed_at IS NOT NULL;

-- 12) Create composite index for user + broker for filtering
CREATE INDEX IF NOT EXISTS trades_user_broker_idx 
ON public.trades (user_id, broker) 
WHERE broker IS NOT NULL;

-- 13) Add comments to document the new columns
COMMENT ON COLUMN public.trades.idempotency_key IS 'Unique key per user for deduplication of imports';
COMMENT ON COLUMN public.trades.symbol_raw IS 'Original symbol as provided by broker (e.g., TSLA250822C00325000)';
COMMENT ON COLUMN public.trades.meta IS 'Additional metadata from broker (rowIndex, raw data, etc.)';
COMMENT ON COLUMN public.trades.broker IS 'Broker name (e.g., webull, td_ameritrade)';
COMMENT ON COLUMN public.trades.external_id IS 'External ID from broker (e.g., order ID)';
COMMENT ON COLUMN public.trades.asset_type IS 'Type of asset (equity, option, futures)';
COMMENT ON COLUMN public.trades.fees IS 'Fees charged by broker';
COMMENT ON COLUMN public.trades.commission IS 'Commission charged by broker';
COMMENT ON COLUMN public.trades.executed_at IS 'Precise execution timestamp from broker';

-- 14) Create a function to generate idempotency key
CREATE OR REPLACE FUNCTION public.generate_idempotency_key(
    p_broker text,
    p_external_id text,
    p_symbol_raw text,
    p_executed_at timestamptz,
    p_side text,
    p_price numeric,
    p_quantity numeric
) RETURNS text AS $$
BEGIN
    -- If external_id exists, use it as primary key
    IF p_external_id IS NOT NULL AND p_external_id != '' THEN
        RETURN encode(
            digest(
                p_broker || '|' || p_external_id,
                'sha256'
            ),
            'hex'
        );
    END IF;
    
    -- Otherwise, create hash from trade details
    RETURN encode(
        digest(
            p_broker || '|' || 
            COALESCE(p_symbol_raw, '') || '|' || 
            p_executed_at::text || '|' || 
            p_side || '|' || 
            p_price::text || '|' || 
            p_quantity::text,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 15) Create a trigger to automatically set idempotency_key on insert
CREATE OR REPLACE FUNCTION public.set_trade_idempotency_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.idempotency_key IS NULL THEN
        NEW.idempotency_key := public.generate_idempotency_key(
            NEW.broker,
            NEW.external_id,
            NEW.symbol_raw,
            NEW.executed_at,
            NEW.side,
            NEW.entry_price,
            NEW.quantity
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_set_trade_idempotency_key ON public.trades;
CREATE TRIGGER trigger_set_trade_idempotency_key
    BEFORE INSERT OR UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.set_trade_idempotency_key();

-- 16) Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.generate_idempotency_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_trade_idempotency_key TO authenticated;

-- 17) Add constraints to ensure data integrity
ALTER TABLE public.trades 
ADD CONSTRAINT IF NOT EXISTS trades_asset_type_check 
CHECK (asset_type IN ('equity', 'option', 'futures'));

ALTER TABLE public.trades 
ADD CONSTRAINT IF NOT EXISTS trades_fees_positive 
CHECK (fees >= 0);

ALTER TABLE public.trades 
ADD CONSTRAINT IF NOT EXISTS trades_commission_positive 
CHECK (commission >= 0);

-- 18) Create a view for easy querying of import metadata
CREATE OR REPLACE VIEW public.trades_with_meta AS
SELECT 
    t.*,
    t.meta->>'rowIndex' as row_index,
    t.meta->>'source' as import_source,
    t.meta->>'originalPrice' as original_price,
    t.meta->>'originalFees' as original_fees,
    t.meta->>'originalCommission' as original_commission
FROM public.trades t;

-- Grant permissions on the view
GRANT SELECT ON public.trades_with_meta TO authenticated;

-- Add comment to the view
COMMENT ON VIEW public.trades_with_meta IS 'Enhanced trades view with parsed metadata fields';



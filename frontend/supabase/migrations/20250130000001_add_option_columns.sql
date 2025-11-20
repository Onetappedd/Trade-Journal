-- Migration: Add Option Columns to Trades Table
-- Description: Add columns for storing option trade data (underlying_symbol, option_expiration, option_strike, option_type)
-- Date: 2025-01-30

-- Add option-specific columns to trades table
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS underlying_symbol text;

ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS option_expiration date;

ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS option_strike numeric;

ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS option_type text CHECK (option_type IN ('CALL', 'PUT'));

-- Create indexes for efficient option queries
CREATE INDEX IF NOT EXISTS trades_underlying_symbol_idx 
ON public.trades (underlying_symbol) 
WHERE underlying_symbol IS NOT NULL;

CREATE INDEX IF NOT EXISTS trades_option_expiration_idx 
ON public.trades (option_expiration) 
WHERE option_expiration IS NOT NULL;

CREATE INDEX IF NOT EXISTS trades_option_strike_idx 
ON public.trades (option_strike) 
WHERE option_strike IS NOT NULL;

-- Composite index for option lookups (underlying + expiry + strike + type)
CREATE INDEX IF NOT EXISTS trades_option_composite_idx 
ON public.trades (underlying_symbol, option_expiration, option_strike, option_type) 
WHERE underlying_symbol IS NOT NULL 
  AND option_expiration IS NOT NULL 
  AND option_strike IS NOT NULL 
  AND option_type IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.trades.underlying_symbol IS 'Underlying symbol for option trades (e.g., AAPL for AAPL 6/28/2024 Call $125.00)';
COMMENT ON COLUMN public.trades.option_expiration IS 'Expiration date for option trades (YYYY-MM-DD)';
COMMENT ON COLUMN public.trades.option_strike IS 'Strike price for option trades';
COMMENT ON COLUMN public.trades.option_type IS 'Option type: CALL or PUT';


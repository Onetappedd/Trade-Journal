-- Fix trades table constraints to allow imports
-- This makes optional fields that are currently NOT NULL

-- Make group_key optional (allow NULL)
ALTER TABLE public.trades ALTER COLUMN group_key DROP NOT NULL;

-- Make instrument_type optional (allow NULL)  
ALTER TABLE public.trades ALTER COLUMN instrument_type DROP NOT NULL;

-- Make opened_at optional (allow NULL)
ALTER TABLE public.trades ALTER COLUMN opened_at DROP NOT NULL;

-- Make qty_opened optional (allow NULL)
ALTER TABLE public.trades ALTER COLUMN qty_opened DROP NOT NULL;

-- Make avg_open_price optional (allow NULL)
ALTER TABLE public.trades ALTER COLUMN avg_open_price DROP NOT NULL;

-- Add default values for existing records if needed
UPDATE public.trades 
SET group_key = symbol || '_' || DATE(executed_at)
WHERE group_key IS NULL;

UPDATE public.trades 
SET instrument_type = asset_type
WHERE instrument_type IS NULL;

UPDATE public.trades 
SET opened_at = executed_at
WHERE opened_at IS NULL;

UPDATE public.trades 
SET qty_opened = qty
WHERE qty_opened IS NULL;

UPDATE public.trades 
SET avg_open_price = price
WHERE avg_open_price IS NULL;

-- Verify the changes
SELECT 
  column_name, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'trades' 
  AND table_schema = 'public'
  AND column_name IN ('group_key', 'instrument_type', 'opened_at', 'qty_opened', 'avg_open_price')
ORDER BY column_name;

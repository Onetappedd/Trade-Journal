-- Add tags column to trades table
-- This migration adds support for user-defined tags on trades

-- Add tags column as TEXT array
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create GIN index for efficient tag searches
CREATE INDEX IF NOT EXISTS idx_trades_tags ON trades USING GIN(tags);

-- Add comment
COMMENT ON COLUMN trades.tags IS 'User-defined tags for categorizing and filtering trades';


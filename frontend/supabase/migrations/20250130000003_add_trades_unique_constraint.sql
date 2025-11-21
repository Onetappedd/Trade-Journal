-- Add UNIQUE constraint on (user_id, group_key) to trades table
-- This is required for the matching engine's upsert logic to work correctly

-- First, cleanup duplicates if any exist (though table is empty currently for this user)
-- We'll just add the constraint. If it fails due to duplicates, we'd need to clean them.
-- Since we know trades table count is 0 or low, this should be fine.

ALTER TABLE trades 
ADD CONSTRAINT trades_user_id_group_key_key UNIQUE (user_id, group_key);

-- Comment explaining why
COMMENT ON CONSTRAINT trades_user_id_group_key_key ON trades IS 'Ensures idempotency for trade matching engine upserts';


-- Migration: Ensure Username Unique Index
-- Description: Creates a unique index on profiles.username to prevent duplicate usernames
-- Date: 2025-01-27

-- Create unique index on profiles.username if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx ON public.profiles (username);

-- Add a comment to document the index
COMMENT ON INDEX profiles_username_unique_idx IS 'Ensures usernames are unique across all profiles';

-- Optional: Add a check constraint to ensure username is not empty
-- This prevents empty strings from being considered unique
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_not_empty 
CHECK (username IS NULL OR LENGTH(TRIM(username)) > 0);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT profiles_username_not_empty ON public.profiles 
IS 'Ensures username is not empty when provided';


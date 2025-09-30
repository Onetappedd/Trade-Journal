-- Safe setup for profiles table
-- This script checks for existing components before creating them

-- 1) Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name text,
  last_name text,
  username text UNIQUE,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'profiles' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 3) Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at);

-- 4) Add comments
COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON COLUMN public.profiles.id IS 'User ID from auth.users';
COMMENT ON COLUMN public.profiles.username IS 'Unique username for the user';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image';

-- 5) Create function to handle updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6) Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_profiles_updated_at'
  ) THEN
    CREATE TRIGGER handle_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 7) Verify the setup
SELECT 
  'Table created successfully' as status,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY column_name;

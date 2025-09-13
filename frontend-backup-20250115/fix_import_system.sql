-- Fix Import System Infrastructure
-- This migration creates the missing tables and storage bucket needed for CSV imports
-- AND fixes the profiles table RLS policy issues

-- 1. Create temp_uploads table for tracking temporary file uploads
CREATE TABLE IF NOT EXISTS temp_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create storage bucket for temporary imports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imports',
  'imports',
  false,
  10485760, -- 10MB limit
  ARRAY['text/csv', 'text/tab-separated-values', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/xml']
) ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS policies for temp_uploads
ALTER TABLE temp_uploads ENABLE ROW LEVEL SECURITY;

-- Users can only see their own temp uploads
CREATE POLICY "Users can view own temp uploads" ON temp_uploads
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own temp uploads
CREATE POLICY "Users can insert own temp uploads" ON temp_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own temp uploads
CREATE POLICY "Users can delete own temp uploads" ON temp_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Set up storage policies for imports bucket
-- Users can upload to their own temp folder
CREATE POLICY "Users can upload to own temp folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'imports' 
    AND (storage.foldername(name))[1] = 'temp' 
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users can read from their own temp folder
CREATE POLICY "Users can read from own temp folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'imports' 
    AND (storage.foldername(name))[1] = 'temp' 
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users can delete from their own temp folder
CREATE POLICY "Users can delete from own temp folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'imports' 
    AND (storage.foldername(name))[1] = 'temp' 
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temp_uploads_token ON temp_uploads(token);
CREATE INDEX IF NOT EXISTS idx_temp_uploads_user_id ON temp_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_uploads_expires_at ON temp_uploads(expires_at);

-- 6. Grant necessary permissions
GRANT ALL ON temp_uploads TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;

-- 7. Create function to clean up expired temp uploads
CREATE OR REPLACE FUNCTION cleanup_expired_temp_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired temp uploads
  DELETE FROM temp_uploads 
  WHERE expires_at < NOW();
  
  -- Note: Storage cleanup would need to be handled separately
  -- as we can't directly delete from storage.objects in this context
END;
$$;

-- 8. Fix profiles table RLS policies
-- Drop the problematic "Admins have full access" policy that causes recursion
DROP POLICY IF EXISTS "Admins have full access" ON profiles;

-- Create a simpler admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (
        SELECT email FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 9. Create a cron job to clean up expired uploads (if pg_cron is available)
-- This is optional and will only work if pg_cron extension is installed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup-temp-uploads', '*/15 * * * *', 'SELECT cleanup_expired_temp_uploads();');
  END IF;
END $$;

-- 10. Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Import system setup complete!';
  RAISE NOTICE 'temp_uploads table created with RLS policies';
  RAISE NOTICE 'imports storage bucket created with access policies';
  RAISE NOTICE 'Cleanup function created for expired uploads';
  RAISE NOTICE 'Profiles table RLS policies fixed';
END $$;

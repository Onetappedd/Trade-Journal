-- Fix Storage Policy Syntax Error
-- The storage policies have a typo in the foldername function call

-- Drop the incorrect policies
DROP POLICY IF EXISTS "Users can upload to own temp folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from own temp folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from own temp folder" ON storage.objects;

-- Recreate the policies with correct syntax
CREATE POLICY "Users can upload to own temp folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'imports' 
    AND (storage.foldername(name))[1] = 'temp' 
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can read from own temp folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'imports' 
    AND (storage.foldername(name))[1] = 'temp' 
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can delete from own temp folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'imports' 
    AND (storage.foldername(name))[1] = 'temp' 
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Verify the policies are correct
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE 'Users can%';

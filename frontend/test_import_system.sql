-- Test Import System Components
-- This script tests each component of the import system to identify issues

-- 1. Test temp_uploads table access
SELECT 
  'temp_uploads table exists' as test,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'temp_uploads'
  ) as result;

-- 2. Test storage bucket access
SELECT 
  'imports bucket exists' as test,
  EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'imports'
  ) as result;

-- 3. Test storage policies
SELECT 
  'storage policies exist' as test,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE 'Users can%';

-- 4. Test temp_uploads RLS policies
SELECT 
  'temp_uploads RLS policies exist' as test,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'temp_uploads';

-- 5. Test basic insert into temp_uploads (this will fail due to auth.uid() in RLS)
-- But it will show if there are syntax errors
SELECT 
  'temp_uploads table structure' as test,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'temp_uploads'
ORDER BY ordinal_position;

-- 6. Test storage bucket permissions
SELECT 
  'storage bucket permissions' as test,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'imports';

-- 7. Test if we can see storage.objects table
SELECT 
  'storage.objects accessible' as test,
  COUNT(*) as object_count
FROM storage.objects 
WHERE bucket_id = 'imports';

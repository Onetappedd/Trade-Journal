-- Test Import Infrastructure
-- Run this in your Supabase SQL Editor to verify everything is working

-- 1. Check if temp_uploads table exists and has correct structure
SELECT 
  'temp_uploads table' as test,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'temp_uploads'
  ) as exists,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'temp_uploads')
    THEN (SELECT COUNT(*) FROM temp_uploads)
    ELSE 'N/A'
  END as record_count;

-- 2. Check if imports storage bucket exists
SELECT 
  'imports bucket' as test,
  EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'imports'
  ) as exists,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'imports')
    THEN (SELECT file_size_limit FROM storage.buckets WHERE name = 'imports')
    ELSE 'N/A'
  END as file_size_limit;

-- 3. Check storage policies
SELECT 
  'storage policies' as test,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE 'Users can%';

-- 4. Check temp_uploads RLS policies
SELECT 
  'temp_uploads RLS policies' as test,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'temp_uploads';

-- 5. Test basic insert (this will fail due to auth.uid() but shows if table is accessible)
SELECT 
  'temp_uploads accessible' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'temp_uploads')
    THEN 'Yes - table exists'
    ELSE 'No - table missing'
  END as result;

-- 6. Check if we can see storage.objects
SELECT 
  'storage.objects accessible' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'imports')
    THEN (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'imports')
    ELSE 'N/A'
  END as object_count;

-- 7. Check current user context
SELECT 
  'current user' as test,
  auth.uid() as user_id,
  current_user as db_user,
  current_schema as schema;

-- Fix infinite recursion in profiles RLS policy
-- The "Admins can view all profiles" policy was querying the profiles table to get the user's email,
-- which triggered the policy again, causing infinite recursion.
-- Fix: Use auth.jwt() ->> 'email' to get the current user's email directly from the JWT.

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM admin_users
    WHERE admin_users.email = (auth.jwt() ->> 'email')
  )
);

-- Also fix the insert policy if it has the same issue
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;

CREATE POLICY "Admins can insert any profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM admin_users
    WHERE admin_users.email = (auth.jwt() ->> 'email')
  )
);


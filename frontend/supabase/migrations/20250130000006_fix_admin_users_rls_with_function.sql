-- Fix infinite recursion in admin_users RLS policies using a security definer function
-- The previous fix still caused recursion because the policy was querying admin_users
-- from within the admin_users policy itself.
-- Solution: Create a SECURITY DEFINER function that bypasses RLS to check admin status.

-- Create a security definer function to check if user is admin without RLS recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- Drop and recreate admin_users policies using the security definer function
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

CREATE POLICY "Admins can view admin users"
ON admin_users
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admins can manage admin users"
ON admin_users
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Also update profiles policies to use the same function for consistency
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "Admins can insert any profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin_user());


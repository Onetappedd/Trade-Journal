-- Fix circular dependency in admin_users RLS policies
-- The admin_users policies were querying the profiles table to check if a user is an admin,
-- but the profiles policies query admin_users, creating infinite recursion.
-- Fix: Use auth.jwt() ->> 'email' directly to check admin_users without querying profiles.

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

-- Recreate policies using JWT email directly (no profiles query)
CREATE POLICY "Admins can view admin users"
ON admin_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM admin_users au
    WHERE au.email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Admins can manage admin users"
ON admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM admin_users au
    WHERE au.email = (auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM admin_users au
    WHERE au.email = (auth.jwt() ->> 'email')
  )
);


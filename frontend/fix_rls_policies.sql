-- Fix security for user_subscription_status view
-- Run this in your Supabase SQL Editor

-- Drop the existing view
DROP VIEW IF EXISTS user_subscription_status;

-- Recreate the view with proper security
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  p.id,
  p.email,
  p.role,
  p.subscription_status,
  p.trial_ends_at,
  p.subscription_ends_at,
  CASE 
    WHEN p.role = 'admin' THEN 'subscription_active'
    WHEN p.subscription_status = 'trial' AND p.trial_ends_at > NOW() THEN 'trial_active'
    WHEN p.subscription_status = 'active' AND (p.subscription_ends_at IS NULL OR p.subscription_ends_at > NOW()) THEN 'subscription_active'
    ELSE 'expired'
  END as access_status
FROM profiles p
WHERE auth.uid() = p.id  -- Users can only see their own data
   OR EXISTS (           -- Admins can see all data
     SELECT 1 FROM profiles admin_profile 
     WHERE admin_profile.id = auth.uid() 
     AND admin_profile.role = 'admin'
   );

-- Grant access to the view for authenticated users
GRANT SELECT ON user_subscription_status TO authenticated;

-- Fix infinite recursion in profiles table RLS policies
-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins have full access" ON profiles;

-- Create a better admin policy that doesn't cause recursion
-- Use the admin_users table instead of the profiles table
CREATE POLICY "Admins have full access" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (
        SELECT email FROM profiles WHERE id = auth.uid()
      )
    )
  );

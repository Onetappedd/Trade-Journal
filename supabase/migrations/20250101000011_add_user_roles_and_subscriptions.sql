-- Create user roles enum
CREATE TYPE user_role AS ENUM ('free', 'pro', 'admin');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled', 'expired');

-- Add role and subscription fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create admin users table for managing admin access
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to set trial period for new users
CREATE OR REPLACE FUNCTION set_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial period to 7 days from now
  NEW.trial_ends_at = NOW() + INTERVAL '7 days';
  NEW.role = 'free';
  NEW.subscription_status = 'trial';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set trial for new users
DROP TRIGGER IF EXISTS trigger_set_user_trial ON profiles;
CREATE TRIGGER trigger_set_user_trial
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_user_trial();

-- Function to check if user has access to features
CREATE OR REPLACE FUNCTION user_has_access(user_id UUID, required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  IF user_profile IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admin has access to everything
  IF user_profile.role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if trial is still active
  IF user_profile.subscription_status = 'trial' AND user_profile.trial_ends_at > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- Check if subscription is active
  IF user_profile.subscription_status = 'active' AND 
     (user_profile.subscription_ends_at IS NULL OR user_profile.subscription_ends_at > NOW()) THEN
    RETURN TRUE;
  END IF;
  
  -- Check role requirements
  CASE required_role
    WHEN 'free' THEN
      RETURN TRUE;
    WHEN 'pro' THEN
      RETURN user_profile.role IN ('pro', 'admin');
    WHEN 'admin' THEN
      RETURN user_profile.role = 'admin';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to add admin user
CREATE OR REPLACE FUNCTION add_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_users (email, role) 
  VALUES (admin_email, 'admin')
  ON CONFLICT (email) DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();
    
  -- Update existing profile if user exists
  UPDATE profiles 
  SET role = 'admin' 
  WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql;

-- Function to remove admin user
CREATE OR REPLACE FUNCTION remove_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM admin_users WHERE email = admin_email;
  
  -- Reset user role to free if they exist
  UPDATE profiles 
  SET role = 'free' 
  WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users table
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert/update/delete admin_users
CREATE POLICY "Admins can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update profiles RLS to include role-based access
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Add RLS policy for admin access to all data
CREATE POLICY "Admins have full access" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create view for subscription status
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  id,
  email,
  role,
  subscription_status,
  trial_ends_at,
  subscription_ends_at,
  CASE 
    WHEN subscription_status = 'trial' AND trial_ends_at > NOW() THEN 'trial_active'
    WHEN subscription_status = 'active' AND (subscription_ends_at IS NULL OR subscription_ends_at > NOW()) THEN 'subscription_active'
    ELSE 'expired'
  END as access_status
FROM profiles;

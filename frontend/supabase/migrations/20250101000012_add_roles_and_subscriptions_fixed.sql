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
  NEW.subscription_status = 'trial';
  NEW.role = 'free';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  now_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  -- If user doesn't exist, no access
  IF user_profile IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admin users always have access
  IF user_profile.role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has required role
  IF user_profile.role = required_role OR 
     (required_role = 'free' AND user_profile.role IN ('free', 'pro', 'admin')) OR
     (required_role = 'pro' AND user_profile.role IN ('pro', 'admin')) THEN
    
    -- Check if subscription is active
    IF user_profile.subscription_status = 'active' THEN
      -- Check if subscription hasn't expired
      IF user_profile.subscription_ends_at IS NULL OR user_profile.subscription_ends_at > now_time THEN
        RETURN TRUE;
      END IF;
    END IF;
    
    -- Check if trial is still active
    IF user_profile.subscription_status = 'trial' AND user_profile.trial_ends_at > now_time THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add admin user
CREATE OR REPLACE FUNCTION add_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Insert into admin_users table
  INSERT INTO admin_users (email, role) 
  VALUES (admin_email, 'admin')
  ON CONFLICT (email) DO NOTHING;
  
  -- Update user's role to admin if they exist in profiles
  UPDATE profiles 
  SET role = 'admin', updated_at = NOW()
  WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin user
CREATE OR REPLACE FUNCTION remove_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Remove from admin_users table
  DELETE FROM admin_users WHERE email = admin_email;
  
  -- Update user's role back to free if they exist in profiles
  UPDATE profiles 
  SET role = 'free', updated_at = NOW()
  WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can view admin users
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage admin users
CREATE POLICY "Admins can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins have full access to profiles
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
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON user_subscription_status TO authenticated;

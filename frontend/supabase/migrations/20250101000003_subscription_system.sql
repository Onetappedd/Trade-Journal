-- Subscription System Migration
-- Adds tables for subscription management, webhook events, and billing customers

-- Billing customers table
CREATE TABLE IF NOT EXISTS billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User entitlements table (for feature flags)
CREATE TABLE IF NOT EXISTS user_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium BOOLEAN DEFAULT FALSE,
  features TEXT[] DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_customers_user_id ON billing_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe_customer_id ON billing_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON user_entitlements(user_id);

-- RLS policies for billing_customers
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing info" ON billing_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing info" ON billing_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing info" ON billing_customers
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for user_entitlements
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlements" ON user_entitlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entitlements" ON user_entitlements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entitlements" ON user_entitlements
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_billing_customers_updated_at 
  BEFORE UPDATE ON billing_customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_entitlements_updated_at 
  BEFORE UPDATE ON user_entitlements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync subscription with entitlements
CREATE OR REPLACE FUNCTION sync_subscription_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user entitlements when subscription changes
  INSERT INTO user_entitlements (user_id, is_premium, features, limits)
  VALUES (
    NEW.user_id,
    NEW.tier != 'free',
    CASE 
      WHEN NEW.tier = 'pro' THEN ARRAY['unlimited_trades', 'unlimited_imports', 'advanced_analytics', 'custom_reports', 'api_access', 'priority_support', 'data_export', 'real_time_data']
      WHEN NEW.tier = 'basic' THEN ARRAY['limited_trades', 'basic_imports', 'standard_analytics', 'email_support']
      WHEN NEW.tier = 'enterprise' THEN ARRAY['unlimited_trades', 'unlimited_imports', 'advanced_analytics', 'custom_reports', 'api_access', 'priority_support', 'data_export', 'real_time_data', 'white_label', 'custom_integrations', 'dedicated_support', 'sla_guarantee']
      ELSE ARRAY['basic_features']
    END,
    CASE 
      WHEN NEW.tier = 'pro' THEN '{"maxTrades": -1, "maxImports": -1, "maxStorage": 10737418240}'::jsonb
      WHEN NEW.tier = 'basic' THEN '{"maxTrades": 1000, "maxImports": 10, "maxStorage": 1073741824}'::jsonb
      WHEN NEW.tier = 'enterprise' THEN '{"maxTrades": -1, "maxImports": -1, "maxStorage": -1}'::jsonb
      ELSE '{"maxTrades": 100, "maxImports": 3, "maxStorage": 104857600}'::jsonb
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_premium = EXCLUDED.is_premium,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync subscription with entitlements
CREATE TRIGGER sync_subscription_entitlements_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_entitlements();

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
  entitled BOOLEAN,
  tier TEXT,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  features TEXT[],
  limits JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.status = 'active' as entitled,
    s.tier,
    s.status,
    s.current_period_end,
    s.cancel_at_period_end,
    e.features,
    e.limits
  FROM subscriptions s
  LEFT JOIN user_entitlements e ON s.user_id = e.user_id
  WHERE s.user_id = user_uuid
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE billing_customers IS 'Stores Stripe customer information for users';
COMMENT ON TABLE subscriptions IS 'Tracks user subscription status and billing information';
COMMENT ON TABLE webhook_events IS 'Stores webhook events for idempotency processing';
COMMENT ON TABLE user_entitlements IS 'Caches user feature entitlements for fast access';
COMMENT ON FUNCTION get_user_subscription_status IS 'Returns user subscription status with entitlements';

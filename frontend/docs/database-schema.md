# Database Schema

Complete database schema documentation for the trading journal application.

## Table of Contents

1. [Core Tables](#core-tables)
2. [Import System](#import-system)
3. [Subscription System](#subscription-system)
4. [Indexes](#indexes)
5. [RLS Policies](#rls-policies)
6. [Functions](#functions)

---

## Core Tables

### trades

Main table for storing trade data.

```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  pnl DECIMAL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  asset_type TEXT NOT NULL DEFAULT 'equity',
  commission DECIMAL DEFAULT 0,
  fees DECIMAL DEFAULT 0,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### executions_normalized

Normalized execution data for trade matching.

```sql
CREATE TABLE executions_normalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  execution_id TEXT,
  broker TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### instruments

Reference data for financial instruments.

```sql
CREATE TABLE instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  exchange TEXT,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Import System

### import_runs

Track CSV import operations.

```sql
CREATE TABLE import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### matching_jobs

Background jobs for trade matching.

```sql
CREATE TABLE matching_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id UUID REFERENCES import_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  date_batch DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Subscription System

### subscriptions

User subscription information.

```sql
CREATE TABLE subscriptions (
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
```

### billing_customers

Stripe customer information.

```sql
CREATE TABLE billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### user_entitlements

Cached user feature entitlements.

```sql
CREATE TABLE user_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium BOOLEAN DEFAULT FALSE,
  features TEXT[] DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### webhook_events

Stripe webhook event tracking for idempotency.

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Indexes

### Performance Indexes

```sql
-- Trades indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_opened_at ON trades(opened_at);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_user_symbol ON trades(user_id, symbol);
CREATE INDEX idx_trades_user_opened_at ON trades(user_id, opened_at);

-- Executions indexes
CREATE INDEX idx_executions_user_id ON executions_normalized(user_id);
CREATE INDEX idx_executions_symbol ON executions_normalized(symbol);
CREATE INDEX idx_executions_executed_at ON executions_normalized(executed_at);
CREATE INDEX idx_executions_user_symbol ON executions_normalized(user_id, symbol);

-- Import system indexes
CREATE INDEX idx_import_runs_user_id ON import_runs(user_id);
CREATE INDEX idx_import_runs_status ON import_runs(status);
CREATE INDEX idx_matching_jobs_user_id ON matching_jobs(user_id);
CREATE INDEX idx_matching_jobs_status ON matching_jobs(status);
CREATE INDEX idx_matching_jobs_symbol_date ON matching_jobs(symbol, date_batch);

-- Subscription indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_billing_customers_user_id ON billing_customers(user_id);
CREATE INDEX idx_billing_customers_stripe_id ON billing_customers(stripe_customer_id);

-- Webhook indexes
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
```

### Unique Indexes

```sql
-- Idempotency indexes
CREATE UNIQUE INDEX idx_trades_user_row_hash ON trades(user_id, row_hash) WHERE row_hash IS NOT NULL;
CREATE UNIQUE INDEX idx_trades_user_broker_trade_id ON trades(user_id, broker, broker_trade_id) 
  WHERE broker IS NOT NULL AND broker_trade_id IS NOT NULL;

-- Webhook idempotency
CREATE UNIQUE INDEX idx_webhook_events_event_id_unique ON webhook_events(event_id);
```

---

## RLS Policies

### trades

```sql
-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);
```

### executions_normalized

```sql
ALTER TABLE executions_normalized ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own executions" ON executions_normalized
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own executions" ON executions_normalized
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### import_runs

```sql
ALTER TABLE import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import runs" ON import_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import runs" ON import_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### subscriptions

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Functions

### get_user_subscription_status

Get user's subscription status with entitlements.

```sql
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
```

### sync_subscription_entitlements

Sync subscription changes with entitlements.

```sql
CREATE OR REPLACE FUNCTION sync_subscription_entitlements()
RETURNS TRIGGER AS $$
BEGIN
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
```

### update_updated_at_column

Automatically update the updated_at timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### Update Timestamps

```sql
-- Trades table
CREATE TRIGGER update_trades_updated_at 
  BEFORE UPDATE ON trades 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Import runs table
CREATE TRIGGER update_import_runs_updated_at 
  BEFORE UPDATE ON import_runs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions table
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User entitlements table
CREATE TRIGGER update_user_entitlements_updated_at 
  BEFORE UPDATE ON user_entitlements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Subscription Sync

```sql
-- Sync subscription with entitlements
CREATE TRIGGER sync_subscription_entitlements_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_entitlements();
```

---

## Data Types

### Custom Types

```sql
-- Trade side enum
CREATE TYPE trade_side AS ENUM ('BUY', 'SELL');

-- Trade status enum
CREATE TYPE trade_status AS ENUM ('open', 'closed');

-- Asset type enum
CREATE TYPE asset_type AS ENUM ('equity', 'option', 'crypto', 'forex', 'bond');

-- Subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete', 'trialing');

-- Import status enum
CREATE TYPE import_status AS ENUM ('queued', 'processing', 'completed', 'failed');

-- Job status enum
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
```

---

## Views

### user_trade_summary

Summary view for user trade data.

```sql
CREATE VIEW user_trade_summary AS
SELECT 
  user_id,
  COUNT(*) as total_trades,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_trades,
  COUNT(*) FILTER (WHERE side = 'BUY') as buy_trades,
  COUNT(*) FILTER (WHERE side = 'SELL') as sell_trades,
  SUM(pnl) FILTER (WHERE status = 'closed') as realized_pnl,
  SUM(pnl) FILTER (WHERE status = 'open') as unrealized_pnl,
  AVG(pnl) FILTER (WHERE status = 'closed' AND pnl > 0) as avg_win,
  AVG(pnl) FILTER (WHERE status = 'closed' AND pnl < 0) as avg_loss
FROM trades
GROUP BY user_id;
```

### subscription_features

View of subscription features by tier.

```sql
CREATE VIEW subscription_features AS
SELECT 
  tier,
  CASE 
    WHEN tier = 'free' THEN ARRAY['basic_features']
    WHEN tier = 'basic' THEN ARRAY['limited_trades', 'basic_imports', 'standard_analytics', 'email_support']
    WHEN tier = 'pro' THEN ARRAY['unlimited_trades', 'unlimited_imports', 'advanced_analytics', 'custom_reports', 'api_access', 'priority_support', 'data_export', 'real_time_data']
    WHEN tier = 'enterprise' THEN ARRAY['unlimited_trades', 'unlimited_imports', 'advanced_analytics', 'custom_reports', 'api_access', 'priority_support', 'data_export', 'real_time_data', 'white_label', 'custom_integrations', 'dedicated_support', 'sla_guarantee']
  END as features,
  CASE 
    WHEN tier = 'free' THEN '{"maxTrades": 100, "maxImports": 3, "maxStorage": 104857600}'::jsonb
    WHEN tier = 'basic' THEN '{"maxTrades": 1000, "maxImports": 10, "maxStorage": 1073741824}'::jsonb
    WHEN tier = 'pro' THEN '{"maxTrades": -1, "maxImports": -1, "maxStorage": 10737418240}'::jsonb
    WHEN tier = 'enterprise' THEN '{"maxTrades": -1, "maxImports": -1, "maxStorage": -1}'::jsonb
  END as limits
FROM (VALUES ('free'), ('basic'), ('pro'), ('enterprise')) as tiers(tier);
```

---

## Migration History

### 20250101000001_initial_schema.sql
- Core tables (trades, executions, instruments)
- Basic RLS policies
- Initial indexes

### 20250101000002_bulletproof_import_system.sql
- Import system tables (import_runs, matching_jobs)
- Idempotency fields
- Background job processing

### 20250101000003_subscription_system.sql
- Subscription tables (subscriptions, billing_customers, user_entitlements)
- Webhook event tracking
- Feature entitlement system

---

*Last updated: 2025-09-27*
*Version: 1.0.0*


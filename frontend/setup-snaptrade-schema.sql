-- SnapTrade Integration Database Schema
-- Run this in your Supabase SQL Editor

-- 1) SnapTrade Users Table
CREATE TABLE IF NOT EXISTS public.snaptrade_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  snaptrade_user_id text NOT NULL,
  user_secret text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(snaptrade_user_id)
);

-- 2) SnapTrade Connections Table
CREATE TABLE IF NOT EXISTS public.snaptrade_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  snaptrade_connection_id text NOT NULL,
  broker_id text NOT NULL,
  broker_name text,
  status text CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'active',
  last_sync timestamptz DEFAULT now(),
  sync_status text CHECK (sync_status IN ('pending', 'success', 'error')) DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(snaptrade_connection_id)
);

-- 3) SnapTrade Accounts Table
CREATE TABLE IF NOT EXISTS public.snaptrade_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.snaptrade_connections(id) ON DELETE CASCADE,
  snaptrade_account_id text NOT NULL,
  account_number text,
  account_type text,
  balance numeric DEFAULT 0,
  account_data jsonb,
  holdings jsonb,
  last_sync timestamptz DEFAULT now(),
  sync_status text CHECK (sync_status IN ('pending', 'success', 'error')) DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(snaptrade_account_id)
);

-- 4) SnapTrade Sessions Table (for connection portal)
CREATE TABLE IF NOT EXISTS public.snaptrade_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  status text CHECK (status IN ('pending', 'completed', 'expired', 'failed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  UNIQUE(session_id)
);

-- 5) Enable RLS on all tables
ALTER TABLE public.snaptrade_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snaptrade_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snaptrade_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snaptrade_sessions ENABLE ROW LEVEL SECURITY;

-- 6) Create RLS Policies
-- Users can only access their own data
CREATE POLICY "Users can view own snaptrade data" ON public.snaptrade_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snaptrade data" ON public.snaptrade_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snaptrade data" ON public.snaptrade_users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own connections" ON public.snaptrade_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON public.snaptrade_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON public.snaptrade_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own accounts" ON public.snaptrade_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON public.snaptrade_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON public.snaptrade_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON public.snaptrade_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.snaptrade_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.snaptrade_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 7) Create Indexes for Performance
CREATE INDEX IF NOT EXISTS snaptrade_users_user_id_idx ON public.snaptrade_users (user_id);
CREATE INDEX IF NOT EXISTS snaptrade_connections_user_id_idx ON public.snaptrade_connections (user_id);
CREATE INDEX IF NOT EXISTS snaptrade_connections_broker_id_idx ON public.snaptrade_connections (broker_id);
CREATE INDEX IF NOT EXISTS snaptrade_connections_status_idx ON public.snaptrade_connections (status);
CREATE INDEX IF NOT EXISTS snaptrade_accounts_user_id_idx ON public.snaptrade_accounts (user_id);
CREATE INDEX IF NOT EXISTS snaptrade_accounts_connection_id_idx ON public.snaptrade_accounts (connection_id);
CREATE INDEX IF NOT EXISTS snaptrade_sessions_user_id_idx ON public.snaptrade_sessions (user_id);
CREATE INDEX IF NOT EXISTS snaptrade_sessions_status_idx ON public.snaptrade_sessions (status);

-- 8) Create Function to Handle Updated At
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9) Create Triggers for Updated At
CREATE TRIGGER handle_snaptrade_users_updated_at
  BEFORE UPDATE ON public.snaptrade_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_snaptrade_connections_updated_at
  BEFORE UPDATE ON public.snaptrade_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_snaptrade_accounts_updated_at
  BEFORE UPDATE ON public.snaptrade_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 10) Add Comments
COMMENT ON TABLE public.snaptrade_users IS 'SnapTrade user registrations and secrets';
COMMENT ON TABLE public.snaptrade_connections IS 'Broker connections via SnapTrade';
COMMENT ON TABLE public.snaptrade_accounts IS 'Account data and holdings from SnapTrade';
COMMENT ON TABLE public.snaptrade_sessions IS 'Connection portal sessions';

-- 11) Verify the setup
SELECT 
  'SnapTrade schema created successfully' as status,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE 'snaptrade_%'
ORDER BY table_name, ordinal_position;

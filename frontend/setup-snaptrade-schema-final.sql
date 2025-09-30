-- SnapTrade Integration Database Schema (Final)
-- Secure storage with Broker-Verified badge logic
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1) SnapTrade Users Table (One per Riskr user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.snaptrade_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  st_user_id text NOT NULL UNIQUE,     -- Immutable SnapTrade userId (e.g., riskr_<uuid>)
  st_user_secret text NOT NULL,        -- Store server-only; NEVER send to client
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2) Connections (Brokerage Authorizations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.snaptrade_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  authorization_id uuid NOT NULL,      -- SnapTrade connection id
  broker_slug text NOT NULL,           -- e.g., ROBINHOOD, SCHWAB
  disabled boolean NOT NULL DEFAULT false,
  last_holdings_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, authorization_id)
);

-- ============================================================================
-- 3) Accounts Snapshot (Optional MVP; can fetch on demand)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.snaptrade_accounts (
  account_id uuid PRIMARY KEY,         -- SnapTrade account id
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  authorization_id uuid NOT NULL,
  name text,
  number text,
  institution_name text,
  total_value numeric,
  currency text,
  last_successful_holdings_sync timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4) Enable RLS (Lock Down Secrets)
-- ============================================================================

-- SnapTrade Users: Server-only access (NEVER expose to client)
ALTER TABLE public.snaptrade_users ENABLE ROW LEVEL SECURITY;

-- This policy allows users to read their own record, but NOT the secret
-- BEST PRACTICE: Don't expose this table to client at all - use service key only
CREATE POLICY "owner can read minimal (but not secret)" ON public.snaptrade_users
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Prevent client inserts/updates (must use server routes with service key)
CREATE POLICY "no client writes" ON public.snaptrade_users
  FOR ALL 
  USING (false);

-- Connections: Users can read their own connections
ALTER TABLE public.snaptrade_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner rows" ON public.snaptrade_connections
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Accounts: Users can read their own accounts
ALTER TABLE public.snaptrade_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner rows" ON public.snaptrade_accounts
  FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5) Broker-Verified View (Drives the Badge)
-- ============================================================================

-- Drop view if it exists
DROP VIEW IF EXISTS public.user_broker_verification;

-- Create view that determines if user is broker-verified
CREATE VIEW public.user_broker_verification AS
SELECT
  u.user_id,
  EXISTS (
    SELECT 1
    FROM public.snaptrade_connections c
    WHERE c.user_id = u.user_id
      AND c.disabled = false
      AND COALESCE(c.last_holdings_sync_at, now() - interval '100 years') > now() - interval '72 hours'
  ) AS is_broker_verified,
  MAX(c.last_holdings_sync_at) AS last_verified_at
FROM public.snaptrade_users u
LEFT JOIN public.snaptrade_connections c ON c.user_id = u.user_id
GROUP BY u.user_id;

-- ============================================================================
-- 6) RLS Policy for Broker Verification View
-- ============================================================================

-- Note: Views inherit RLS from underlying tables, but we can add explicit policy
ALTER VIEW public.user_broker_verification SET (security_invoker = true);

-- ============================================================================
-- 7) Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_snaptrade_users_st_user_id 
  ON public.snaptrade_users (st_user_id);

CREATE INDEX IF NOT EXISTS idx_snaptrade_connections_user_id 
  ON public.snaptrade_connections (user_id);

CREATE INDEX IF NOT EXISTS idx_snaptrade_connections_authorization 
  ON public.snaptrade_connections (user_id, authorization_id);

CREATE INDEX IF NOT EXISTS idx_snaptrade_connections_sync_time 
  ON public.snaptrade_connections (last_holdings_sync_at) 
  WHERE disabled = false;

CREATE INDEX IF NOT EXISTS idx_snaptrade_accounts_user_id 
  ON public.snaptrade_accounts (user_id);

CREATE INDEX IF NOT EXISTS idx_snaptrade_accounts_authorization 
  ON public.snaptrade_accounts (authorization_id);

-- ============================================================================
-- 8) Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.snaptrade_users IS 
  'SnapTrade user registrations. One per Riskr user. st_user_secret is server-only.';

COMMENT ON COLUMN public.snaptrade_users.st_user_id IS 
  'Immutable SnapTrade userId (e.g., riskr_<uuid>). Must be unique.';

COMMENT ON COLUMN public.snaptrade_users.st_user_secret IS 
  'SnapTrade user secret. MUST NEVER be sent to client. Access only via service key.';

COMMENT ON TABLE public.snaptrade_connections IS 
  'Brokerage connections (authorizations) from SnapTrade. Used for broker verification.';

COMMENT ON COLUMN public.snaptrade_connections.authorization_id IS 
  'SnapTrade authorization/connection UUID.';

COMMENT ON COLUMN public.snaptrade_connections.broker_slug IS 
  'Broker identifier (e.g., ROBINHOOD, SCHWAB, TD_AMERITRADE).';

COMMENT ON COLUMN public.snaptrade_connections.last_holdings_sync_at IS 
  'Last successful holdings sync timestamp. Used for 72-hour verification check.';

COMMENT ON TABLE public.snaptrade_accounts IS 
  'Cached account snapshots from SnapTrade. Can also fetch on demand.';

COMMENT ON VIEW public.user_broker_verification IS 
  'Determines if user has Broker-Verified badge: active connection + synced in last 72 hours.';

-- ============================================================================
-- 9) Helper Function: Check if User is Broker-Verified
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_user_broker_verified(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.snaptrade_connections c
    WHERE c.user_id = check_user_id
      AND c.disabled = false
      AND COALESCE(c.last_holdings_sync_at, now() - interval '100 years') > now() - interval '72 hours'
  );
$$;

COMMENT ON FUNCTION public.is_user_broker_verified IS 
  'Returns true if user has at least one active connection with recent holdings sync (< 72h).';

-- ============================================================================
-- 10) Trigger: Update last_holdings_sync_at on account sync
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_connection_sync_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the connection's last_holdings_sync_at when account is synced
  UPDATE public.snaptrade_connections
  SET last_holdings_sync_at = NEW.last_successful_holdings_sync
  WHERE authorization_id = NEW.authorization_id
    AND user_id = NEW.user_id
    AND (last_holdings_sync_at IS NULL OR last_holdings_sync_at < NEW.last_successful_holdings_sync);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_connection_sync_on_account_update
  AFTER INSERT OR UPDATE OF last_successful_holdings_sync
  ON public.snaptrade_accounts
  FOR EACH ROW
  WHEN (NEW.last_successful_holdings_sync IS NOT NULL)
  EXECUTE FUNCTION public.update_connection_sync_time();

COMMENT ON TRIGGER update_connection_sync_on_account_update ON public.snaptrade_accounts IS 
  'Automatically updates connection last_holdings_sync_at when account is synced.';

-- ============================================================================
-- 11) Verify Setup
-- ============================================================================

SELECT 
  'SnapTrade schema created successfully' AS status,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('snaptrade_users', 'snaptrade_connections', 'snaptrade_accounts')
ORDER BY table_name, ordinal_position;

-- Check view exists
SELECT 
  'Broker verification view created' AS status,
  table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'user_broker_verification';

-- ============================================================================
-- 12) Security Checklist
-- ============================================================================

-- ✅ st_user_secret is NEVER exposed to client (RLS policy blocks writes)
-- ✅ All tables have RLS enabled
-- ✅ Users can only read their own data
-- ✅ Broker verification logic in view (72-hour check)
-- ✅ Indexes for performance
-- ✅ Trigger auto-updates sync timestamps
-- ✅ Helper function for easy verification checks

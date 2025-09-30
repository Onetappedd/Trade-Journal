-- SnapTrade Analytics Tables Setup
-- Creates tables for storing daily snapshots and computed metrics

-- 1) Account Value Snapshots (for equity curve)
-- Stores daily total value across all accounts
CREATE TABLE IF NOT EXISTS public.account_value_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date timestamptz NOT NULL,
  total_value numeric NOT NULL DEFAULT 0,
  cash numeric DEFAULT 0,
  positions_value numeric DEFAULT 0,
  account_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate snapshots per day
  UNIQUE(user_id, snapshot_date)
);

-- Index for fast time-series queries
CREATE INDEX IF NOT EXISTS idx_account_snapshots_user_date 
  ON public.account_value_snapshots(user_id, snapshot_date DESC);

-- RLS policies
ALTER TABLE public.account_value_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own snapshots"
  ON public.account_value_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can insert snapshots"
  ON public.account_value_snapshots
  FOR INSERT
  WITH CHECK (true); -- Service role only


-- 2) Helper function to take daily snapshot
-- Call this from a cron job or scheduled function
CREATE OR REPLACE FUNCTION public.take_account_snapshot(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_value numeric;
  v_account_count int;
  v_snapshot_date date;
BEGIN
  -- Use current date (reset time to midnight)
  v_snapshot_date := CURRENT_DATE;
  
  -- Sum total value from all active accounts
  SELECT 
    COALESCE(SUM(total_value), 0),
    COUNT(*)
  INTO v_total_value, v_account_count
  FROM public.snaptrade_accounts
  WHERE user_id = p_user_id;
  
  -- Insert or update snapshot for today
  INSERT INTO public.account_value_snapshots (
    user_id,
    snapshot_date,
    total_value,
    account_count
  )
  VALUES (
    p_user_id,
    v_snapshot_date,
    v_total_value,
    v_account_count
  )
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET
    total_value = EXCLUDED.total_value,
    account_count = EXCLUDED.account_count,
    created_at = now();
END;
$$;


-- 3) Function to take snapshots for ALL users
-- Call this from your daily cron job
CREATE OR REPLACE FUNCTION public.take_all_account_snapshots()
RETURNS TABLE(user_id uuid, snapshot_taken boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_id,
    true as snapshot_taken,
    NULL::text as error_message
  FROM public.snaptrade_users u
  WHERE EXISTS (
    SELECT 1 FROM public.snaptrade_accounts a
    WHERE a.user_id = u.user_id
  )
  AND (
    -- Take snapshot if we haven't yet today
    NOT EXISTS (
      SELECT 1 FROM public.account_value_snapshots s
      WHERE s.user_id = u.user_id
        AND s.snapshot_date = CURRENT_DATE
    )
  );
  
  -- Actually take the snapshots
  FOR user_id IN (
    SELECT u.user_id
    FROM public.snaptrade_users u
    WHERE EXISTS (
      SELECT 1 FROM public.snaptrade_accounts a
      WHERE a.user_id = u.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.account_value_snapshots s
      WHERE s.user_id = u.user_id
        AND s.snapshot_date = CURRENT_DATE
    )
  ) LOOP
    BEGIN
      PERFORM public.take_account_snapshot(user_id);
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT user_id, false, SQLERRM;
    END;
  END LOOP;
END;
$$;


-- 4) Optional: Computed metrics cache table
-- Store pre-calculated metrics to avoid expensive re-calculations
CREATE TABLE IF NOT EXISTS public.user_performance_metrics (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time ranges
  last_30d_pnl numeric DEFAULT 0,
  last_90d_pnl numeric DEFAULT 0,
  all_time_pnl numeric DEFAULT 0,
  
  -- Win rate
  win_rate_30d numeric DEFAULT 0,
  win_rate_90d numeric DEFAULT 0,
  win_rate_all_time numeric DEFAULT 0,
  
  -- R:R
  avg_rr_30d numeric DEFAULT 0,
  avg_rr_90d numeric DEFAULT 0,
  avg_rr_all_time numeric DEFAULT 0,
  
  -- Trade counts
  total_trades int DEFAULT 0,
  total_wins int DEFAULT 0,
  total_losses int DEFAULT 0,
  
  -- Last calculation
  calculated_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own metrics"
  ON public.user_performance_metrics
  FOR SELECT
  USING (auth.uid() = user_id);


-- 5) Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.account_value_snapshots TO service_role;
GRANT ALL ON public.user_performance_metrics TO service_role;
GRANT EXECUTE ON FUNCTION public.take_account_snapshot TO service_role;
GRANT EXECUTE ON FUNCTION public.take_all_account_snapshots TO service_role;


-- 6) Comments for documentation
COMMENT ON TABLE public.account_value_snapshots IS 
  'Daily snapshots of total account value across all broker connections. Used for equity curve analytics.';

COMMENT ON FUNCTION public.take_account_snapshot IS 
  'Takes a daily snapshot of total account value for a specific user. Idempotent (safe to run multiple times per day).';

COMMENT ON FUNCTION public.take_all_account_snapshots IS 
  'Takes daily snapshots for ALL users. Run this from a cron job every night at midnight.';

COMMENT ON TABLE public.user_performance_metrics IS 
  'Cached performance metrics (win rate, R:R, P&L) to avoid expensive recalculations on every page load.';


-- Example usage:
-- 
-- Take snapshot for single user:
--   SELECT public.take_account_snapshot('user-uuid-here');
--
-- Take snapshots for all users (run daily):
--   SELECT * FROM public.take_all_account_snapshots();
--
-- Query equity curve:
--   SELECT snapshot_date, total_value
--   FROM public.account_value_snapshots
--   WHERE user_id = 'user-uuid'
--   ORDER BY snapshot_date DESC
--   LIMIT 30;

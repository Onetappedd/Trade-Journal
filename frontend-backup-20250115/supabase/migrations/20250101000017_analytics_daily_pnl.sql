-- Daily P&L Analytics
-- Replace client math with a tiny RPC for calendar heatmap

CREATE OR REPLACE FUNCTION public.get_daily_pnl(
  start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '12 months'),
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  day DATE,
  pnl NUMERIC,
  trades BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(COALESCE(tr.closed_at, tr.opened_at)) as day,
    SUM(tr.realized_pnl)::NUMERIC as pnl,
    COUNT(*)::BIGINT as trades
  FROM trades tr
  WHERE tr.user_id = auth.uid()
    AND tr.status = 'closed'
    AND tr.realized_pnl IS NOT NULL
    AND DATE(COALESCE(tr.closed_at, tr.opened_at)) BETWEEN start_date AND end_date
  GROUP BY DATE(COALESCE(tr.closed_at, tr.opened_at))
  ORDER BY day;
$$;

COMMENT ON FUNCTION public.get_daily_pnl IS 'Returns daily P&L and trade counts for the authenticated user within a date range. Used for calendar heatmap visualization.';

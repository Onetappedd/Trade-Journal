-- Drawdown Recovery Analytics
-- Practical risk metric: days from peak → back to peak

CREATE OR REPLACE FUNCTION public.get_drawdown_recovery()
RETURNS TABLE(
  start_date DATE,
  trough_date DATE,
  recovered_on DATE,
  duration_days INTEGER,
  depth NUMERIC,
  peak_value NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH daily_equity AS (
    SELECT 
      DATE(COALESCE(tr.closed_at, tr.opened_at)) as day,
      SUM(tr.realized_pnl)::NUMERIC as daily_pnl
    FROM trades tr
    WHERE tr.user_id = auth.uid()
      AND tr.status = 'closed'
      AND tr.realized_pnl IS NOT NULL
    GROUP BY DATE(COALESCE(tr.closed_at, tr.opened_at))
  ),
  cumulative_equity AS (
    SELECT 
      day,
      SUM(daily_pnl) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as equity,
      SUM(daily_pnl) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total
    FROM daily_equity
  ),
  peaks AS (
    SELECT 
      day,
      equity,
      MAX(equity) OVER (ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as peak_value
    FROM cumulative_equity
  ),
  drawdowns AS (
    SELECT 
      day,
      equity,
      peak_value,
      (peak_value - equity)::NUMERIC as drawdown_depth,
      CASE 
        WHEN equity = peak_value THEN 1 
        ELSE 0 
      END as is_peak
    FROM peaks
    WHERE equity < peak_value  -- Only consider actual drawdown periods
  ),
  drawdown_periods AS (
    SELECT 
      day,
      equity,
      peak_value,
      drawdown_depth,
      -- Find the start of each drawdown (when we hit a new peak)
      CASE 
        WHEN is_peak = 1 THEN day
        ELSE LAG(day) OVER (ORDER BY day)
      END as drawdown_start
    FROM drawdowns
  ),
  recovery_analysis AS (
    SELECT 
      drawdown_start as start_date,
      day as trough_date,
      drawdown_depth,
      peak_value,
      -- Find when we recover to the peak value
      LEAD(day) OVER (PARTITION BY drawdown_start ORDER BY day) as recovery_date
    FROM drawdown_periods
    WHERE drawdown_depth > 0
  )
  SELECT 
    start_date,
    trough_date,
    recovered_on,
    CASE 
      WHEN recovered_on IS NOT NULL THEN 
        (recovered_on - start_date)::INTEGER
      ELSE 
        (CURRENT_DATE - start_date)::INTEGER
    END as duration_days,
    drawdown_depth,
    peak_value
  FROM recovery_analysis
  WHERE drawdown_depth > 0
  ORDER BY drawdown_depth DESC
  LIMIT 10;  -- Top 10 deepest drawdowns
$$;

COMMENT ON FUNCTION public.get_drawdown_recovery IS 'Returns drawdown recovery analysis showing start date, trough date, recovery date, duration, and depth for the top 10 deepest drawdowns.';

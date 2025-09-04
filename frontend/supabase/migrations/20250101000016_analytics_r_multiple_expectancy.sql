-- R-multiple and Expectancy Analytics
-- Risk-aware view that scales across symbols

-- Expectancy by bucket (entry timeframe or tag)
CREATE OR REPLACE FUNCTION public.get_expectancy_by_bucket()
RETURNS TABLE(
  bucket TEXT,
  trades BIGINT,
  avg_r_multiple NUMERIC,
  expectancy NUMERIC,
  win_rate NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bucket_stats AS (
    SELECT 
      -- Use tag as primary bucket, fallback to 'General' if no tags
      COALESCE(t.name, 'General') as bucket,
      COUNT(*) as trades,
      -- Calculate R-multiple: realized_pnl / (abs(qty_opened) * risk_per_share)
      -- If risk_per_share exists, use it; otherwise use average adverse excursion as fallback
      CASE 
        WHEN tr.risk_per_share IS NOT NULL AND tr.risk_per_share > 0 THEN
          tr.realized_pnl / (ABS(tr.qty_opened) * tr.risk_per_share)
        ELSE
          -- Fallback: use average adverse excursion (estimated from realized P&L)
          -- This is a simplified approach - in practice you'd want more sophisticated risk calculation
          tr.realized_pnl / NULLIF(ABS(tr.realized_pnl) * 0.1, 0) -- Assume 10% risk per trade as fallback
      END as r_multiple,
      tr.realized_pnl,
      CASE WHEN tr.realized_pnl > 0 THEN 1 ELSE 0 END as is_win
    FROM trades tr
    LEFT JOIN trade_tags tt ON tr.id = tt.trade_id
    LEFT JOIN tags t ON tt.tag_id = t.id
    WHERE tr.user_id = auth.uid()
      AND tr.status = 'closed'
      AND tr.realized_pnl IS NOT NULL
      AND tr.qty_opened IS NOT NULL
      AND tr.qty_opened != 0
  ),
  aggregated AS (
    SELECT 
      bucket,
      COUNT(*) as trades,
      AVG(r_multiple) as avg_r_multiple,
      AVG(realized_pnl) as expectancy,
      (COUNT(CASE WHEN is_win = 1 THEN 1 END)::NUMERIC / COUNT(*) * 100) as win_rate
    FROM bucket_stats
    WHERE r_multiple IS NOT NULL
      AND r_multiple BETWEEN -10 AND 10  -- Filter out extreme outliers
    GROUP BY bucket
  )
  SELECT 
    bucket,
    trades,
    ROUND(avg_r_multiple::NUMERIC, 3) as avg_r_multiple,
    ROUND(expectancy::NUMERIC, 2) as expectancy,
    ROUND(win_rate::NUMERIC, 1) as win_rate
  FROM aggregated
  ORDER BY expectancy DESC;
$$;

COMMENT ON FUNCTION public.get_expectancy_by_bucket IS 'Returns expectancy metrics by bucket (tag/timeframe) with R-multiple calculations. Uses risk_per_share if available, otherwise falls back to estimated risk calculation.';

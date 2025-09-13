-- Tag-level and Symbol-level Analytics RPCs
-- Provides quick insights by tag/symbol without client-side heavy loops

-- Tag-level P&L aggregates
CREATE OR REPLACE FUNCTION public.get_pnl_by_tag()
RETURNS TABLE(
  tag TEXT,
  trades BIGINT,
  pnl NUMERIC,
  win_rate NUMERIC,
  profit_factor NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH tag_stats AS (
    SELECT 
      t.name as tag,
      COUNT(*) as trades,
      SUM(tr.realized_pnl) as pnl,
      COUNT(CASE WHEN tr.realized_pnl > 0 THEN 1 END) as wins,
      SUM(CASE WHEN tr.realized_pnl > 0 THEN tr.realized_pnl ELSE 0 END) as gross_profit,
      SUM(CASE WHEN tr.realized_pnl < 0 THEN ABS(tr.realized_pnl) ELSE 0 END) as gross_loss
    FROM trades tr
    JOIN trade_tags tt ON tr.id = tt.trade_id
    JOIN tags t ON tt.tag_id = t.id
    WHERE tr.user_id = auth.uid()
      AND tr.status = 'closed'
      AND tr.realized_pnl IS NOT NULL
    GROUP BY t.id, t.name
  )
  SELECT 
    tag,
    trades,
    COALESCE(pnl, 0)::NUMERIC as pnl,
    CASE 
      WHEN trades > 0 THEN (wins::NUMERIC / trades * 100)::NUMERIC
      ELSE 0 
    END as win_rate,
    CASE 
      WHEN gross_loss > 0 THEN (gross_profit / gross_loss)::NUMERIC
      ELSE NULL 
    END as profit_factor
  FROM tag_stats
  ORDER BY ABS(pnl) DESC;
$$;

COMMENT ON FUNCTION public.get_pnl_by_tag IS 'Returns P&L aggregates by tag for the authenticated user, including trades count, P&L, win rate, and profit factor.';

-- Symbol-level P&L aggregates (top symbols by count or P&L)
CREATE OR REPLACE FUNCTION public.get_pnl_by_symbol(limit_count INT DEFAULT 20)
RETURNS TABLE(
  symbol TEXT,
  trades BIGINT,
  pnl NUMERIC,
  win_rate NUMERIC,
  profit_factor NUMERIC,
  avg_trade_size NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH symbol_stats AS (
    SELECT 
      tr.symbol,
      COUNT(*) as trades,
      SUM(tr.realized_pnl) as pnl,
      COUNT(CASE WHEN tr.realized_pnl > 0 THEN 1 END) as wins,
      SUM(CASE WHEN tr.realized_pnl > 0 THEN tr.realized_pnl ELSE 0 END) as gross_profit,
      SUM(CASE WHEN tr.realized_pnl < 0 THEN ABS(tr.realized_pnl) ELSE 0 END) as gross_loss,
      AVG(ABS(tr.realized_pnl)) as avg_trade_size
    FROM trades tr
    WHERE tr.user_id = auth.uid()
      AND tr.status = 'closed'
      AND tr.realized_pnl IS NOT NULL
      AND tr.symbol IS NOT NULL
    GROUP BY tr.symbol
  )
  SELECT 
    symbol,
    trades,
    COALESCE(pnl, 0)::NUMERIC as pnl,
    CASE 
      WHEN trades > 0 THEN (wins::NUMERIC / trades * 100)::NUMERIC
      ELSE 0 
    END as win_rate,
    CASE 
      WHEN gross_loss > 0 THEN (gross_profit / gross_loss)::NUMERIC
      ELSE NULL 
    END as profit_factor,
    COALESCE(avg_trade_size, 0)::NUMERIC as avg_trade_size
  FROM symbol_stats
  ORDER BY ABS(pnl) DESC
  LIMIT limit_count;
$$;

COMMENT ON FUNCTION public.get_pnl_by_symbol IS 'Returns top symbols by P&L for the authenticated user, including trades count, P&L, win rate, profit factor, and average trade size.';

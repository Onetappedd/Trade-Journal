-- supabase/migrations/20250101000012_analytics_get_user_metrics.sql

-- Ensure predictable search path for SECURITY DEFINER functions
create or replace function public.get_user_metrics()
returns table(
  win_rate numeric,
  profit_factor numeric,
  expectancy numeric,
  max_drawdown_abs numeric,
  sharpe numeric
)
language sql
security definer
set search_path = public
as $$
with base as (
  -- Use closed trades only for realized PnL
  select
    t.user_id,
    coalesce(t.closed_at, t.opened_at) as dt,
    t.realized_pnl::numeric as pnl,
    -- proxy "return" per trade; if qty_closed=0 fallback to pnl (avoids /0)
    case
      when t.qty_closed is not null and t.qty_closed <> 0 and t.avg_open_price is not null and t.avg_open_price <> 0
        then (t.realized_pnl / (abs(t.qty_closed) * t.avg_open_price))::numeric
      else null
    end as trade_ret
  from public.trades t
  where t.user_id = auth.uid()
    and t.status = 'closed'
),
agg as (
  select
    count(*)::numeric as n_trades,
    count(*) filter (where pnl > 0)::numeric as n_wins,
    count(*) filter (where pnl <= 0)::numeric as n_losses,
    coalesce(sum(case when pnl > 0 then pnl end), 0)::numeric as sum_wins,
    abs(coalesce(sum(case when pnl < 0 then pnl end), 0))::numeric as sum_losses,
    avg(nullif(trade_ret,0)) as avg_ret,
    stddev_samp(nullif(trade_ret,0)) as sd_ret
  from base
),
mdd as (
  -- equity curve & running peak for max drawdown
  select
    max((running_peak - equity))::numeric as max_dd
  from (
    select
      dt,
      sum(pnl) over (order by dt rows between unbounded preceding and current row) as equity,
      max(sum(pnl) over (order by dt rows between unbounded preceding and current row))
        over (order by dt rows between unbounded preceding and current row) as running_peak
    from base
    order by dt
  ) s
)
select
  case when agg.n_trades = 0 then null
       else round( (agg.n_wins / agg.n_trades) * 100, 2) end as win_rate,
  case when agg.sum_losses = 0 then null
       else round(agg.sum_wins / agg.sum_losses, 4) end as profit_factor,
  -- Expectancy = WinRate*AvgWin - LossRate*AvgLoss
  case when agg.n_trades = 0 then null
       else round(
         ((agg.n_wins/agg.n_trades) * nullif(agg.sum_wins/ nullif(agg.n_wins,0),0))
         - ((agg.n_losses/agg.n_trades) * nullif(agg.sum_losses/ nullif(agg.n_losses,0),0)), 4)
  end as expectancy,
  coalesce(mdd.max_dd, 0)::numeric as max_drawdown_abs,
  -- Sharpe: mean(trade_ret) / stddev(trade_ret); risk-free ~ 0; ignore nulls
  case when coalesce(agg.sd_ret,0) = 0 then null
       else round(agg.avg_ret / agg.sd_ret, 4) end as sharpe
from agg, mdd;
$$;

comment on function public.get_user_metrics is
  'Returns key user metrics (win_rate, profit_factor, expectancy, max_drawdown_abs, sharpe) computed from trades.realized_pnl for the authenticated user.';

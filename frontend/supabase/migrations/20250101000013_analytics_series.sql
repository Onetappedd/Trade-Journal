-- supabase/migrations/20250101000013_analytics_series.sql

-- Monthly PnL for last 12 months (including zero months)
create or replace function public.get_monthly_pnl()
returns table(month date, pnl numeric)
language sql
security definer
set search_path = public
as $$
with months as (
  select date_trunc('month', (now() - (i || ' months')::interval))::date as m
  from generate_series(0, 11) as g(i)
),
p as (
  select
    date_trunc('month', coalesce(t.closed_at, t.opened_at))::date as m,
    sum(t.realized_pnl)::numeric as pnl
  from public.trades t
  where t.user_id = auth.uid()
    and t.status = 'closed'
    and coalesce(t.closed_at, t.opened_at) >= (date_trunc('month', now()) - interval '11 months')
  group by 1
)
select months.m as month, coalesce(p.pnl, 0)::numeric as pnl
from months
left join p on p.m = months.m
order by months.m;
$$;

comment on function public.get_monthly_pnl is
  'Returns last 12 months pnl series (month, pnl) for the authenticated user, based on trades.realized_pnl.';

-- Drawdown series (equity + drawdown per day)
create or replace function public.get_drawdown_series()
returns table(t date, equity numeric, drawdown numeric)
language sql
security definer
set search_path = public
as $$
with daily as (
  select
    date_trunc('day', coalesce(t.closed_at, t.opened_at))::date as d,
    sum(t.realized_pnl)::numeric as day_pnl
  from public.trades t
  where t.user_id = auth.uid()
    and t.status = 'closed'
  group by 1
),
curve as (
  select
    d as t,
    sum(day_pnl) over (order by d rows between unbounded preceding and current row) as equity
  from daily
),
with_peak as (
  select
    t,
    equity,
    max(equity) over (order by t rows between unbounded preceding and current row) as peak
  from curve
)
select
  t,
  equity,
  (peak - equity)::numeric as drawdown
from with_peak
order by t;
$$;

comment on function public.get_drawdown_series is
  'Returns equity and drawdown per day for the authenticated user based on trades.realized_pnl.';

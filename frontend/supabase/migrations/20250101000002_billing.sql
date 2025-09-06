create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.billing_subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  updated_at timestamptz default now()
);
create index if not exists idx_billing_subscriptions_user on public.billing_subscriptions(user_id);

create table if not exists public.billing_events (
  stripe_event_id text primary key,
  type text not null,
  payload jsonb not null,
  received_at timestamptz default now()
);

create or replace view public.user_entitlements as
select
  u.id as user_id,
  coalesce(
    exists (
      select 1
      from billing_subscriptions s
      where s.user_id = u.id
        and (
          s.status in ('trialing','active')
          or now() <= s.current_period_end + interval '3 days'
        )
    ), false
  ) as is_premium
from auth.users u;

-- Performance indexes for analytics
-- Adjust column names if your schema differs

-- Trades filtered by user, account, and close/open dates
CREATE INDEX IF NOT EXISTS idx_trades_user_account_exit_date
  ON public.trades (user_id, account_id, exit_date);

CREATE INDEX IF NOT EXISTS idx_trades_user_account_entry_date
  ON public.trades (user_id, account_id, entry_date);

-- If your schema uses close_time/open_time instead of exit_date/entry_date
-- CREATE INDEX IF NOT EXISTS idx_trades_user_account_close_time
--   ON public.trades (user_id, account_id, close_time);
-- CREATE INDEX IF NOT EXISTS idx_trades_user_account_open_time
--   ON public.trades (user_id, account_id, open_time);

-- Cash flows filtered by user, account, and date
CREATE INDEX IF NOT EXISTS idx_cash_flows_user_account_date
  ON public.cash_flows (user_id, account_id, date);

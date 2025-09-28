-- Add only the essential columns needed for the import
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS symbol TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS side TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS quantity DECIMAL(15,4);
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS entry_price DECIMAL(15,4);
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS exit_price DECIMAL(15,4);
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS entry_date DATE;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS exit_date DATE;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS pnl DECIMAL(15,4) DEFAULT 0;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS broker TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS row_hash TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS import_run_id UUID;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);

-- Enable Row Level Security
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy
CREATE POLICY IF NOT EXISTS "Users can manage their own trades" ON public.trades
    USING (auth.uid() = user_id);

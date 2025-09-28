-- Add missing columns to existing trades table
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

-- Add constraints (will fail if they already exist, which is fine)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.trades ADD CONSTRAINT check_side CHECK (side IN ('buy', 'sell'));
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.trades ADD CONSTRAINT check_status CHECK (status IN ('open', 'closed'));
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON public.trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_row_hash ON public.trades(row_hash);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trades' AND policyname = 'Users can view their own trades') THEN
        CREATE POLICY "Users can view their own trades" ON public.trades
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trades' AND policyname = 'Users can insert their own trades') THEN
        CREATE POLICY "Users can insert their own trades" ON public.trades
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trades' AND policyname = 'Users can update their own trades') THEN
        CREATE POLICY "Users can update their own trades" ON public.trades
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trades' AND policyname = 'Users can delete their own trades') THEN
        CREATE POLICY "Users can delete their own trades" ON public.trades
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

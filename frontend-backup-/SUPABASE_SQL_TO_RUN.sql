-- Add missing watchlist table and verify existing structure
-- Run this in Supabase SQL Editor

-- 1. Create the missing watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate entries
    UNIQUE(user_id, symbol)
);

-- 2. Enable RLS on watchlist
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for watchlist
CREATE POLICY "Users can view own watchlist" ON public.watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist" ON public.watchlist
    FOR ALL USING (auth.uid() = user_id);

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON public.watchlist(symbol);

-- 5. Check if trades table has all required columns (this will show us what's missing)
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check for user_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.user_id column';
        ALTER TABLE public.trades ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ELSE
        RAISE NOTICE 'OK: trades.user_id exists';
    END IF;

    -- Check for other essential columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'symbol'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.symbol column';
        ALTER TABLE public.trades ADD COLUMN symbol TEXT NOT NULL;
    ELSE
        RAISE NOTICE 'OK: trades.symbol exists';
    END IF;

    -- Check for asset_type
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'asset_type'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.asset_type column';
        ALTER TABLE public.trades ADD COLUMN asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'option', 'crypto', 'futures', 'forex'));
    ELSE
        RAISE NOTICE 'OK: trades.asset_type exists';
    END IF;

    -- Check for side
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'side'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.side column';
        ALTER TABLE public.trades ADD COLUMN side TEXT NOT NULL CHECK (side IN ('buy', 'sell'));
    ELSE
        RAISE NOTICE 'OK: trades.side exists';
    END IF;

    -- Check for quantity
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'quantity'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.quantity column';
        ALTER TABLE public.trades ADD COLUMN quantity DECIMAL(15,4) NOT NULL;
    ELSE
        RAISE NOTICE 'OK: trades.quantity exists';
    END IF;

    -- Check for entry_price
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'entry_price'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.entry_price column';
        ALTER TABLE public.trades ADD COLUMN entry_price DECIMAL(15,4) NOT NULL;
    ELSE
        RAISE NOTICE 'OK: trades.entry_price exists';
    END IF;

    -- Check for exit_price
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'exit_price'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.exit_price column';
        ALTER TABLE public.trades ADD COLUMN exit_price DECIMAL(15,4);
    ELSE
        RAISE NOTICE 'OK: trades.exit_price exists';
    END IF;

    -- Check for entry_date
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'entry_date'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.entry_date column';
        ALTER TABLE public.trades ADD COLUMN entry_date DATE NOT NULL;
    ELSE
        RAISE NOTICE 'OK: trades.entry_date exists';
    END IF;

    -- Check for exit_date
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'exit_date'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.exit_date column';
        ALTER TABLE public.trades ADD COLUMN exit_date DATE;
    ELSE
        RAISE NOTICE 'OK: trades.exit_date exists';
    END IF;

    -- Check for status
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.status column';
        ALTER TABLE public.trades ADD COLUMN status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'));
    ELSE
        RAISE NOTICE 'OK: trades.status exists';
    END IF;

    -- Check for notes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.notes column';
        ALTER TABLE public.trades ADD COLUMN notes TEXT;
    ELSE
        RAISE NOTICE 'OK: trades.notes exists';
    END IF;

    -- Check for created_at
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.created_at column';
        ALTER TABLE public.trades ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ELSE
        RAISE NOTICE 'OK: trades.created_at exists';
    END IF;

    -- Check for updated_at
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: trades.updated_at column';
        ALTER TABLE public.trades ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ELSE
        RAISE NOTICE 'OK: trades.updated_at exists';
    END IF;

END $$;

-- 6. Check profiles table structure
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check for user_id column in profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: profiles.user_id column';
        ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ELSE
        RAISE NOTICE 'OK: profiles.user_id exists';
    END IF;

    -- Check for full_name
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'full_name'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: profiles.full_name column';
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    ELSE
        RAISE NOTICE 'OK: profiles.full_name exists';
    END IF;

    -- Check for avatar_url
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'MISSING: profiles.avatar_url column';
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    ELSE
        RAISE NOTICE 'OK: profiles.avatar_url exists';
    END IF;

END $$;

-- 7. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Show final table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('trades', 'profiles', 'watchlist')
ORDER BY table_name, ordinal_position;
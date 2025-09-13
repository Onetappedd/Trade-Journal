-- Complete Database Schema for Trading Journal
-- Run this in your Supabase SQL Editor if tables are missing

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'option', 'crypto', 'futures', 'forex')),
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(15,4) NOT NULL,
    entry_price DECIMAL(15,4) NOT NULL,
    exit_price DECIMAL(15,4),
    entry_date DATE NOT NULL,
    exit_date DATE,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    
    -- Options specific fields
    strike_price DECIMAL(15,4),
    expiry_date DATE,
    option_type TEXT CHECK (option_type IN ('call', 'put')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create watchlist table (optional)
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate entries
    UNIQUE(user_id, symbol)
);

-- Create tags table for trade categorization
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate tag names per user
    UNIQUE(user_id, name)
);

-- Create trade_tags junction table
CREATE TABLE IF NOT EXISTS public.trade_tags (
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (trade_id, tag_id)
);

-- Create price_alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below')),
    target_price DECIMAL(15,4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON public.trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON public.price_alerts(symbol);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trades policies
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- Watchlist policies
CREATE POLICY "Users can view own watchlist" ON public.watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist" ON public.watchlist
    FOR ALL USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view own tags" ON public.tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tags" ON public.tags
    FOR ALL USING (auth.uid() = user_id);

-- Trade tags policies
CREATE POLICY "Users can view own trade tags" ON public.trade_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trades 
            WHERE trades.id = trade_tags.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own trade tags" ON public.trade_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trades 
            WHERE trades.id = trade_tags.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

-- Price alerts policies
CREATE POLICY "Users can view own price alerts" ON public.price_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own price alerts" ON public.price_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Create functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, user_id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_trades
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample data (optional - remove if you don't want sample data)
-- This will only insert if the user exists and no trades exist yet

-- Sample trades (you can remove this section if you don't want sample data)
/*
INSERT INTO public.trades (user_id, symbol, asset_type, side, quantity, entry_price, exit_price, entry_date, exit_date, status, notes)
SELECT 
    auth.uid(),
    'AAPL',
    'stock',
    'buy',
    100,
    150.00,
    155.00,
    '2024-01-15',
    '2024-01-20',
    'closed',
    'Sample profitable trade'
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.trades WHERE user_id = auth.uid())
LIMIT 1;

INSERT INTO public.trades (user_id, symbol, asset_type, side, quantity, entry_price, entry_date, status, notes)
SELECT 
    auth.uid(),
    'TSLA',
    'stock',
    'buy',
    50,
    200.00,
    '2024-01-25',
    'open',
    'Current open position'
WHERE auth.uid() IS NOT NULL
LIMIT 1;
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
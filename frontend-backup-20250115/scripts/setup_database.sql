-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS public.trade_tags CASCADE;
DROP TABLE IF EXISTS public.watchlist_items CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.trades CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    default_broker TEXT DEFAULT 'webull',
    default_asset_type TEXT DEFAULT 'stock',
    risk_tolerance TEXT DEFAULT 'moderate',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    trade_alerts BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(15,4) NOT NULL,
    price DECIMAL(15,4) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0,
    broker TEXT NOT NULL,
    asset_type TEXT NOT NULL DEFAULT 'stock',
    trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    strategy TEXT,
    setup_quality INTEGER CHECK (setup_quality >= 1 AND setup_quality <= 5),
    execution_quality INTEGER CHECK (execution_quality >= 1 AND execution_quality <= 5),
    emotional_state TEXT,
    market_conditions TEXT,
    profit_loss DECIMAL(15,2),
    profit_loss_percentage DECIMAL(8,4),
    holding_period_days INTEGER,
    exit_reason TEXT,
    lessons_learned TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create trade_tags junction table
CREATE TABLE public.trade_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trade_id, tag_id)
);

-- Create watchlist_items table
CREATE TABLE public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    notes TEXT,
    target_price DECIMAL(15,4),
    alert_price DECIMAL(15,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- Create alerts table
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'volume_spike', 'news')),
    target_value DECIMAL(15,4),
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_symbol ON public.trades(symbol);
CREATE INDEX idx_trades_trade_date ON public.trades(trade_date);
CREATE INDEX idx_trades_side ON public.trades(side);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_trade_tags_trade_id ON public.trade_tags(trade_id);
CREATE INDEX idx_trade_tags_tag_id ON public.trade_tags(tag_id);
CREATE INDEX idx_watchlist_user_id ON public.watchlist_items(user_id);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_symbol ON public.alerts(symbol);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for trades
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tags
CREATE POLICY "Users can view own tags" ON public.tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON public.tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON public.tags
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trade_tags
CREATE POLICY "Users can view own trade tags" ON public.trade_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trades 
            WHERE trades.id = trade_tags.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own trade tags" ON public.trade_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trades 
            WHERE trades.id = trade_tags.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own trade tags" ON public.trade_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.trades 
            WHERE trades.id = trade_tags.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

-- Create RLS policies for watchlist_items
CREATE POLICY "Users can view own watchlist" ON public.watchlist_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist items" ON public.watchlist_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist items" ON public.watchlist_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist items" ON public.watchlist_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for alerts
CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlist_items_updated_at BEFORE UPDATE ON public.watchlist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default tags for new users (optional)
-- This would typically be done via a trigger or application logic

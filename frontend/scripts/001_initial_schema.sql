-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE trade_status AS ENUM ('open', 'closed');
CREATE TYPE trade_side AS ENUM ('buy', 'sell');
CREATE TYPE asset_type AS ENUM ('stock', 'option', 'futures', 'crypto');
CREATE TYPE broker_type AS ENUM ('webull', 'robinhood', 'schwab', 'ibkr', 'td', 'other');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    default_broker broker_type DEFAULT 'webull',
    default_asset_type asset_type DEFAULT 'stock',
    risk_tolerance TEXT DEFAULT 'moderate',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    trade_alerts BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE public.tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Watchlists table
CREATE TABLE public.watchlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    sector TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- Trades table
CREATE TABLE public.trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    asset_type asset_type NOT NULL,
    broker broker_type NOT NULL,
    side trade_side NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    entry_price DECIMAL(10,4) NOT NULL CHECK (entry_price > 0),
    exit_price DECIMAL(10,4) CHECK (exit_price > 0),
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_date TIMESTAMP WITH TIME ZONE,
    status trade_status DEFAULT 'open',
    notes TEXT,
    pnl DECIMAL(12,2),
    fees DECIMAL(8,2) DEFAULT 0,
    
    -- Option specific fields
    strike_price DECIMAL(10,4),
    expiration_date DATE,
    option_type TEXT CHECK (option_type IN ('call', 'put')),
    
    -- Calculated fields
    hold_time_hours INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (
        (status = 'open' AND exit_price IS NULL AND exit_date IS NULL) OR
        (status = 'closed' AND exit_price IS NOT NULL AND exit_date IS NOT NULL)
    ),
    CHECK (
        (asset_type != 'option') OR 
        (asset_type = 'option' AND strike_price IS NOT NULL AND expiration_date IS NOT NULL AND option_type IS NOT NULL)
    )
);

-- Trade tags junction table
CREATE TABLE public.trade_tags (
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (trade_id, tag_id)
);

-- Alerts table
CREATE TABLE public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'volume_spike', 'news')),
    target_value DECIMAL(10,4),
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import logs table
CREATE TABLE public.import_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    successful_imports INTEGER NOT NULL,
    failed_imports INTEGER NOT NULL,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_symbol ON public.trades(symbol);
CREATE INDEX idx_trades_entry_date ON public.trades(entry_date);
CREATE INDEX idx_trades_status ON public.trades(status);
CREATE INDEX idx_trades_user_symbol ON public.trades(user_id, symbol);
CREATE INDEX idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_symbol ON public.alerts(symbol);

-- Create functions for automatic timestamp updates
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

-- Function to calculate P&L and hold time
CREATE OR REPLACE FUNCTION calculate_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate P&L if trade is closed
    IF NEW.status = 'closed' AND NEW.exit_price IS NOT NULL THEN
        IF NEW.side = 'buy' THEN
            NEW.pnl = (NEW.exit_price - NEW.entry_price) * NEW.quantity - COALESCE(NEW.fees, 0);
        ELSE
            NEW.pnl = (NEW.entry_price - NEW.exit_price) * NEW.quantity - COALESCE(NEW.fees, 0);
        END IF;
        
        -- Calculate hold time in hours
        IF NEW.exit_date IS NOT NULL THEN
            NEW.hold_time_hours = EXTRACT(EPOCH FROM (NEW.exit_date - NEW.entry_date)) / 3600;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for trade metrics calculation
CREATE TRIGGER calculate_trade_metrics_trigger BEFORE INSERT OR UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION calculate_trade_metrics();

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trades policies
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can manage own tags" ON public.tags
    FOR ALL USING (auth.uid() = user_id);

-- Watchlists policies
CREATE POLICY "Users can manage own watchlists" ON public.watchlists
    FOR ALL USING (auth.uid() = user_id);

-- Trade tags policies
CREATE POLICY "Users can manage own trade tags" ON public.trade_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trades 
            WHERE trades.id = trade_tags.trade_id 
            AND trades.user_id = auth.uid()
        )
    );

-- Alerts policies
CREATE POLICY "Users can manage own alerts" ON public.alerts
    FOR ALL USING (auth.uid() = user_id);

-- Import logs policies
CREATE POLICY "Users can view own import logs" ON public.import_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import logs" ON public.import_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    
    -- Create default tags
    INSERT INTO public.tags (user_id, name, color) VALUES
        (NEW.id, 'Day Trade', '#3b82f6'),
        (NEW.id, 'Swing Trade', '#10b981'),
        (NEW.id, 'Scalp', '#f59e0b'),
        (NEW.id, 'Breakout', '#8b5cf6'),
        (NEW.id, 'Reversal', '#ef4444'),
        (NEW.id, 'Momentum', '#06b6d4'),
        (NEW.id, 'Earnings Play', '#84cc16'),
        (NEW.id, 'Technical Analysis', '#6366f1'),
        (NEW.id, 'News Based', '#ec4899'),
        (NEW.id, 'FOMO', '#f97316');
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create views for common queries
CREATE VIEW public.trade_summary AS
SELECT 
    t.user_id,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE status = 'open') as open_trades,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_trades,
    COUNT(*) FILTER (WHERE status = 'closed' AND pnl > 0) as winning_trades,
    COUNT(*) FILTER (WHERE status = 'closed' AND pnl < 0) as losing_trades,
    COALESCE(SUM(pnl), 0) as total_pnl,
    COALESCE(AVG(pnl) FILTER (WHERE status = 'closed'), 0) as avg_pnl,
    COALESCE(MAX(pnl), 0) as best_trade,
    COALESCE(MIN(pnl), 0) as worst_trade,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status = 'closed') > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE status = 'closed' AND pnl > 0)::DECIMAL / COUNT(*) FILTER (WHERE status = 'closed')) * 100, 2)
        ELSE 0 
    END as win_rate
FROM public.trades t
GROUP BY t.user_id;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.trade_summary TO authenticated;

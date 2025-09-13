-- Create option_scenarios table
CREATE TABLE IF NOT EXISTS option_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT,
  type TEXT NOT NULL CHECK (type IN ('call', 'put')),
  strike DECIMAL(10,2) NOT NULL,
  expiry DATE,
  S DECIMAL(10,2) NOT NULL, -- Current stock price
  iv DECIMAL(5,4) NOT NULL, -- Implied volatility
  r DECIMAL(5,4) NOT NULL, -- Risk-free rate
  q DECIMAL(5,4) NOT NULL, -- Dividend yield
  method TEXT NOT NULL CHECK (method IN ('bs', 'american')),
  multiplier INTEGER NOT NULL DEFAULT 100,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_option_scenarios_user_id ON option_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_option_scenarios_created_at ON option_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_option_scenarios_symbol ON option_scenarios(symbol);

-- Enable RLS
ALTER TABLE option_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own scenarios" ON option_scenarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenarios" ON option_scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" ON option_scenarios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios" ON option_scenarios
  FOR DELETE USING (auth.uid() = user_id);

-- Create user_prefs table for storing user preferences
CREATE TABLE IF NOT EXISTS user_prefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  prefs JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON user_prefs(user_id);

-- Enable RLS
ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own preferences" ON user_prefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_prefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_prefs
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_prefs_updated_at 
  BEFORE UPDATE ON user_prefs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

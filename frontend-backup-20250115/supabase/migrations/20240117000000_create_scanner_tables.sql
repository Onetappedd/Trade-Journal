-- Create saved_scans table
CREATE TABLE IF NOT EXISTS saved_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  params JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create watchlist_items table
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Create symbol_notes table
CREATE TABLE IF NOT EXISTS symbol_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_scans_user_id ON saved_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_scans_slug ON saved_scans(slug);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_user_id ON watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_symbol ON watchlist_items(symbol);
CREATE INDEX IF NOT EXISTS idx_symbol_notes_user_id ON symbol_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_symbol_notes_symbol ON symbol_notes(symbol);

-- Enable RLS
ALTER TABLE saved_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbol_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_scans
CREATE POLICY "Users can view their own saved scans" ON saved_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved scans" ON saved_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved scans" ON saved_scans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved scans" ON saved_scans
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for watchlist_items
CREATE POLICY "Users can view their own watchlist items" ON watchlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" ON watchlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist items" ON watchlist_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" ON watchlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for symbol_notes
CREATE POLICY "Users can view their own symbol notes" ON symbol_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symbol notes" ON symbol_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symbol notes" ON symbol_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symbol notes" ON symbol_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_saved_scans_updated_at
  BEFORE UPDATE ON saved_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symbol_notes_updated_at
  BEFORE UPDATE ON symbol_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

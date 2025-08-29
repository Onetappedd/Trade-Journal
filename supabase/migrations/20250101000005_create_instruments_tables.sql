-- Create instruments table for normalized instrument data
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_symbol TEXT UNIQUE NOT NULL,
    instrument_type TEXT NOT NULL CHECK (instrument_type IN ('equity', 'option', 'future')),
    multiplier DECIMAL(20,8) NOT NULL DEFAULT 1,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create instrument_aliases table for mapping raw symbols to instruments
CREATE TABLE IF NOT EXISTS instrument_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- 'csv', 'api', 'manual', etc.
    alias_symbol TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(instrument_id, source, alias_symbol)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_instruments_unique_symbol ON instruments(unique_symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_type ON instruments(instrument_type);
CREATE INDEX IF NOT EXISTS idx_instruments_meta ON instruments USING GIN(meta);

CREATE INDEX IF NOT EXISTS idx_instrument_aliases_instrument_id ON instrument_aliases(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_aliases_source ON instrument_aliases(source);
CREATE INDEX IF NOT EXISTS idx_instrument_aliases_symbol ON instrument_aliases(alias_symbol);
CREATE INDEX IF NOT EXISTS idx_instrument_aliases_source_symbol ON instrument_aliases(source, alias_symbol);

-- RLS policies
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_aliases ENABLE ROW LEVEL SECURITY;

-- Instruments are shared across all users (read-only for now)
CREATE POLICY "Anyone can view instruments" ON instruments
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage instruments" ON instruments
    FOR ALL USING (auth.role() = 'service_role');

-- Instrument aliases are also shared
CREATE POLICY "Anyone can view instrument aliases" ON instrument_aliases
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage instrument aliases" ON instrument_aliases
    FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instruments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_instruments_updated_at
    BEFORE UPDATE ON instruments
    FOR EACH ROW
    EXECUTE FUNCTION update_instruments_updated_at();

-- Add instrument_id column to executions_normalized if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'executions_normalized' 
        AND column_name = 'instrument_id'
    ) THEN
        ALTER TABLE executions_normalized ADD COLUMN instrument_id UUID REFERENCES instruments(id);
        CREATE INDEX IF NOT EXISTS idx_executions_normalized_instrument_id ON executions_normalized(instrument_id);
    END IF;
END $$;

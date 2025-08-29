-- Create import-related tables

-- Temporary uploads table for tracking file uploads
CREATE TABLE IF NOT EXISTS temp_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw import items table for storing original data
CREATE TABLE IF NOT EXISTS raw_import_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_run_id UUID NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,
    raw_data JSONB NOT NULL,
    mapped_data JSONB,
    line_number INTEGER,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalized executions table for deduplicated trade data
CREATE TABLE IF NOT EXISTS executions_normalized (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    import_run_id UUID REFERENCES import_runs(id) ON DELETE SET NULL,
    dedupe_hash TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell', 'short')),
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    fees DECIMAL(20,8) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    venue TEXT,
    order_id TEXT,
    exec_id TEXT,
    instrument_type TEXT DEFAULT 'stock',
    expiry DATE,
    strike DECIMAL(20,8),
    option_type TEXT CHECK (option_type IN ('call', 'put')),
    multiplier DECIMAL(10,2) DEFAULT 1,
    underlying TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processed', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_temp_uploads_token ON temp_uploads(token);
CREATE INDEX IF NOT EXISTS idx_temp_uploads_user_expires ON temp_uploads(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_raw_import_items_run_id ON raw_import_items(import_run_id);
CREATE INDEX IF NOT EXISTS idx_executions_normalized_user_id ON executions_normalized(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_normalized_dedupe_hash ON executions_normalized(dedupe_hash);
CREATE INDEX IF NOT EXISTS idx_executions_normalized_timestamp ON executions_normalized(timestamp);
CREATE INDEX IF NOT EXISTS idx_executions_normalized_symbol ON executions_normalized(symbol);

-- Create unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_executions_normalized_dedupe_unique 
ON executions_normalized(user_id, dedupe_hash);

-- RLS policies
ALTER TABLE temp_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions_normalized ENABLE ROW LEVEL SECURITY;

-- Temp uploads policies
CREATE POLICY "Users can view their own temp uploads" ON temp_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own temp uploads" ON temp_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own temp uploads" ON temp_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- Raw import items policies
CREATE POLICY "Users can view their own raw import items" ON raw_import_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM import_runs 
            WHERE import_runs.id = raw_import_items.import_run_id 
            AND import_runs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own raw import items" ON raw_import_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM import_runs 
            WHERE import_runs.id = raw_import_items.import_run_id 
            AND import_runs.user_id = auth.uid()
        )
    );

-- Executions normalized policies
CREATE POLICY "Users can view their own executions" ON executions_normalized
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own executions" ON executions_normalized
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executions" ON executions_normalized
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up expired temp uploads
CREATE OR REPLACE FUNCTION cleanup_expired_temp_uploads()
RETURNS void AS $$
BEGIN
    DELETE FROM temp_uploads WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

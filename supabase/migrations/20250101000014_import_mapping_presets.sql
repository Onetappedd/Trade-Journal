-- Create import_mapping_presets table
CREATE TABLE IF NOT EXISTS public.import_mapping_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  broker_hint TEXT,
  file_glob TEXT,
  fields JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_mapping_presets_user_id ON public.import_mapping_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_import_mapping_presets_broker_hint ON public.import_mapping_presets(broker_hint);
CREATE INDEX IF NOT EXISTS idx_import_mapping_presets_file_glob ON public.import_mapping_presets(file_glob);

-- Enable RLS
ALTER TABLE public.import_mapping_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own mapping presets" ON public.import_mapping_presets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mapping presets" ON public.import_mapping_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mapping presets" ON public.import_mapping_presets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mapping presets" ON public.import_mapping_presets
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_import_mapping_presets_updated_at
  BEFORE UPDATE ON public.import_mapping_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some sample presets for common brokers
INSERT INTO public.import_mapping_presets (user_id, name, broker_hint, file_glob, fields) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Robinhood Standard', 'robinhood', '*.csv', '{"timestamp": "Time", "symbol": "Symbol", "side": "Side", "quantity": "Quantity", "price": "Price", "fees": "Fees"}'),
  ('00000000-0000-0000-0000-000000000000', 'Interactive Brokers Flex', 'ibkr', '*.xml', '{"timestamp": "dateTime", "symbol": "symbol", "side": "side", "quantity": "quantity", "price": "price", "fees": "fees", "currency": "currency", "venue": "exchange", "order_id": "orderID", "exec_id": "execID", "instrument_type": "instrumentType", "expiry": "expiry", "strike": "strike", "option_type": "optionType", "multiplier": "multiplier", "underlying": "underlying"}'),
  ('00000000-0000-0000-0000-000000000000', 'Fidelity Standard', 'fidelity', '*.csv', '{"timestamp": "Date/Time", "symbol": "Symbol", "side": "Action", "quantity": "Quantity", "price": "Price", "fees": "Commission"}'),
  ('00000000-0000-0000-0000-000000000000', 'Schwab/TOS Standard', 'schwab', '*.csv', '{"timestamp": "Date/Time", "symbol": "Symbol", "side": "Action", "quantity": "Quantity", "price": "Price", "fees": "Commission"}'),
  ('00000000-0000-0000-0000-000000000000', 'Webull Options', 'webull', '*options*.csv', '{"timestamp": "Filled Time", "symbol": "Symbol", "side": "Side", "quantity": "Filled", "price": "Avg Price", "fees": "Fees", "currency": "USD", "venue": "NASDAQ", "instrument_type": "option", "multiplier": "100", "broker": "webull"}'),
  ('00000000-0000-0000-0000-000000000000', 'E*TRADE Standard', 'etrade', '*.csv', '{"timestamp": "Date/Time", "symbol": "Symbol", "side": "Action", "quantity": "Quantity", "price": "Price", "fees": "Commission"}'),
  ('00000000-0000-0000-0000-000000000000', 'TastyTrade Standard', 'tasty', '*.csv', '{"timestamp": "Date/Time", "symbol": "Symbol", "side": "Action", "quantity": "Quantity", "price": "Price", "fees": "Commission"}');

-- Note: The sample presets above use a dummy user_id (00000000-0000-0000-0000-000000000000)
-- In production, these would be created by actual users or as system defaults

-- Create benchmark_prices table for storing SPY/QQQ daily EOD data
-- Used for benchmark comparisons in analytics

CREATE TABLE IF NOT EXISTS benchmark_prices (
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  close NUMERIC NOT NULL,
  adjusted_close NUMERIC NOT NULL,
  volume BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (symbol, date)
);

-- Enable Row Level Security
ALTER TABLE benchmark_prices ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can SELECT all rows
-- Writes are performed by server using service_role key (no public write policy needed)
CREATE POLICY "authenticated_read_benchmark_prices"
  ON benchmark_prices
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_benchmark_prices_symbol_date ON benchmark_prices(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_benchmark_prices_date ON benchmark_prices(date DESC);

COMMENT ON TABLE benchmark_prices IS 'Daily EOD prices for benchmark symbols (SPY, QQQ) fetched from Yahoo Finance';
COMMENT ON COLUMN benchmark_prices.symbol IS 'Benchmark symbol (e.g., SPY, QQQ)';
COMMENT ON COLUMN benchmark_prices.date IS 'Trading date';
COMMENT ON COLUMN benchmark_prices.close IS 'Regular close price';
COMMENT ON COLUMN benchmark_prices.adjusted_close IS 'Adjusted close price (accounts for splits/dividends)';
COMMENT ON COLUMN benchmark_prices.volume IS 'Trading volume';


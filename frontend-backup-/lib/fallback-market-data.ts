// Fallback market data for static generation and when APIs are unavailable
// This prevents build failures when API keys are not available

export interface FallbackTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  sector: string;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export const fallbackTickers: FallbackTicker[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 203.35,
    change: 2.15,
    changePercent: 1.07,
    volume: 45000000,
    marketCap: '3.1T',
    sector: 'Technology',
    high: 205.5,
    low: 201.2,
    open: 202.0,
    previousClose: 201.2,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.5,
    change: -3.25,
    changePercent: -1.29,
    volume: 52000000,
    marketCap: '792B',
    sector: 'Automotive',
    high: 252.0,
    low: 246.8,
    open: 251.75,
    previousClose: 251.75,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 173.72,
    change: 1.83,
    changePercent: 1.06,
    volume: 204500000,
    marketCap: '4.2T',
    sector: 'Technology',
    high: 176.54,
    low: 170.89,
    open: 172.0,
    previousClose: 171.89,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 445.2,
    change: 5.8,
    changePercent: 1.32,
    volume: 18500000,
    marketCap: '3.3T',
    sector: 'Technology',
    high: 447.5,
    low: 441.0,
    open: 442.3,
    previousClose: 439.4,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 192.85,
    change: -1.15,
    changePercent: -0.59,
    volume: 22000000,
    marketCap: '2.4T',
    sector: 'Technology',
    high: 194.2,
    low: 191.5,
    open: 193.8,
    previousClose: 194.0,
  },
];

export class FallbackMarketDataService {
  async getTrendingStocks(): Promise<FallbackTicker[]> {
    // Return fallback data sorted by absolute change percentage
    return fallbackTickers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }

  async getMarketMovers(): Promise<{
    gainers: FallbackTicker[];
    losers: FallbackTicker[];
    mostActive: FallbackTicker[];
  }> {
    const gainers = fallbackTickers
      .filter((t) => t.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent);

    const losers = fallbackTickers
      .filter((t) => t.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent);

    const mostActive = fallbackTickers.sort((a, b) => b.volume - a.volume);

    return { gainers, losers, mostActive };
  }

  async getTickerSnapshot(symbol: string): Promise<FallbackTicker | null> {
    return fallbackTickers.find((t) => t.symbol === symbol) || null;
  }

  async searchTickers(query: string): Promise<
    Array<{
      symbol: string;
      name: string;
      type: string;
      exchange: string;
      currency: string;
    }>
  > {
    const filtered = fallbackTickers
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(query.toLowerCase()) ||
          t.name.toLowerCase().includes(query.toLowerCase()),
      )
      .map((t) => ({
        symbol: t.symbol,
        name: t.name,
        type: 'CS',
        exchange: 'NASDAQ',
        currency: 'USD',
      }));

    return filtered;
  }
}

export const fallbackMarketDataService = new FallbackMarketDataService();
export default fallbackMarketDataService;

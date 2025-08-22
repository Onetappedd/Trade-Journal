// Market Data Service Layer
import { createClient } from '@/lib/supabase';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: string;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  employees: number;
  website: string;
  logo: string;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  sector: string;
}

export interface MarketNews {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  symbols: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

class MarketDataService {
  private finnhubApiKey: string;
  private alphaVantageApiKey: string;
  private baseUrl: string;

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || '';
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  // Finnhub API calls
  private async finnhubRequest(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`https://finnhub.io/api/v1${endpoint}`);
    url.searchParams.append('token', this.finnhubApiKey);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Alpha Vantage API calls
  private async alphaVantageRequest(func: string, params: Record<string, string> = {}) {
    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.append('function', func);
    url.searchParams.append('apikey', this.alphaVantageApiKey);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get real-time stock quote
  async getStockQuote(symbol: string): Promise<StockQuote> {
    try {
      const data = await this.finnhubRequest('/quote', { symbol });

      return {
        symbol,
        price: data.c || 0,
        change: data.d || 0,
        changePercent: data.dp || 0,
        volume: data.v || 0,
        high: data.h || 0,
        low: data.l || 0,
        open: data.o || 0,
        previousClose: data.pc || 0,
        timestamp: data.t || Date.now() / 1000,
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  // Get multiple stock quotes
  async getBatchQuotes(symbols: string[]): Promise<StockQuote[]> {
    const promises = symbols.map((symbol) => this.getStockQuote(symbol));
    const results = await Promise.allSettled(promises);

    return results
      .filter(
        (result): result is PromiseFulfilledResult<StockQuote> => result.status === 'fulfilled',
      )
      .map((result) => result.value);
  }

  // Get company profile
  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    try {
      const data = await this.finnhubRequest('/stock/profile2', { symbol });

      return {
        symbol,
        name: data.name || '',
        description: data.description || '',
        sector: data.finnhubIndustry || '',
        industry: data.gind || '',
        marketCap: data.marketCapitalization || 0,
        employees: data.employeeTotal || 0,
        website: data.weburl || '',
        logo: data.logo || '',
      };
    } catch (error) {
      console.error(`Error fetching profile for ${symbol}:`, error);
      throw error;
    }
  }

  // Get historical data
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalData[]> {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - days * 24 * 60 * 60;

      const data = await this.finnhubRequest('/stock/candle', {
        symbol,
        resolution: 'D',
        from: from.toString(),
        to: to.toString(),
      });

      if (data.s !== 'ok' || !data.c) {
        return [];
      }

      return data.c.map((close: number, index: number) => ({
        date: new Date(data.t[index] * 1000).toISOString().split('T')[0],
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close,
        volume: data.v[index],
      }));
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  // Get trending stocks
  async getTrendingStocks(): Promise<TrendingStock[]> {
    try {
      // Use a predefined list of popular stocks for trending
      const popularSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY'];
      const quotes = await this.getBatchQuotes(popularSymbols);

      const profiles = await Promise.allSettled(
        popularSymbols.map((symbol) => this.getCompanyProfile(symbol)),
      );

      return quotes
        .map((quote, index) => {
          const profileResult = profiles[index];
          const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;

          return {
            symbol: quote.symbol,
            name: profile?.name || quote.symbol,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            marketCap: profile?.marketCap
              ? `${(profile.marketCap / 1000000000).toFixed(1)}B`
              : 'N/A',
            sector: profile?.sector || 'Unknown',
          };
        })
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    } catch (error) {
      console.error('Error fetching trending stocks:', error);
      return [];
    }
  }

  // Search stocks
  async searchStocks(query: string): Promise<{ symbol: string; name: string; type: string }[]> {
    try {
      const data = await this.finnhubRequest('/search', { q: query });

      return (data.result || [])
        .filter((item: any) => item.type === 'Common Stock')
        .slice(0, 10)
        .map((item: any) => ({
          symbol: item.symbol,
          name: item.description,
          type: item.type,
        }));
    } catch (error) {
      console.error(`Error searching stocks for ${query}:`, error);
      return [];
    }
  }

  // Get market news
  async getMarketNews(symbols?: string[]): Promise<MarketNews[]> {
    try {
      const params: Record<string, string> = { category: 'general' };
      if (symbols && symbols.length > 0) {
        params.symbol = symbols.join(',');
      }

      const data = await this.finnhubRequest('/news', params);

      return (data || []).slice(0, 20).map((item: any) => ({
        id: item.id?.toString() || Math.random().toString(),
        headline: item.headline || '',
        summary: item.summary || '',
        url: item.url || '',
        source: item.source || '',
        publishedAt: new Date(item.datetime * 1000).toISOString(),
        symbols: symbols || [],
        sentiment: item.sentiment || 'neutral',
      }));
    } catch (error) {
      console.error('Error fetching market news:', error);
      return [];
    }
  }

  // Get user's portfolio positions with real prices
  async getPortfolioPositions(userId: string) {
    const supabase = createClient();

    try {
      // Get user's open trades
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (!trades || trades.length === 0) {
        return [];
      }

      // Get unique symbols
      const symbols = [...new Set(trades.map((trade) => trade.symbol))];

      // Get current prices
      const quotes = await this.getBatchQuotes(symbols);
      const priceMap = new Map(quotes.map((quote) => [quote.symbol, quote]));

      // Calculate positions
      const positionMap = new Map();

      trades.forEach((trade) => {
        const key = trade.symbol;
        const existing = positionMap.get(key) || {
          symbol: trade.symbol,
          quantity: 0,
          avgCost: 0,
          totalCost: 0,
          currentPrice: 0,
          marketValue: 0,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
        };

        const tradeValue = trade.quantity * trade.entry_price;
        const newQuantity =
          existing.quantity + (trade.side === 'buy' ? trade.quantity : -trade.quantity);
        const newTotalCost = existing.totalCost + (trade.side === 'buy' ? tradeValue : -tradeValue);

        existing.quantity = newQuantity;
        existing.totalCost = newTotalCost;
        existing.avgCost = newQuantity !== 0 ? newTotalCost / newQuantity : 0;

        positionMap.set(key, existing);
      });

      // Update with current prices and calculate P&L
      const positions = Array.from(positionMap.values())
        .map((position) => {
          const quote = priceMap.get(position.symbol);
          if (quote) {
            position.currentPrice = quote.price;
            position.marketValue = position.quantity * quote.price;
            position.unrealizedPnL = position.marketValue - position.totalCost;
            position.unrealizedPnLPercent =
              position.totalCost !== 0
                ? (position.unrealizedPnL / Math.abs(position.totalCost)) * 100
                : 0;
          }
          return position;
        })
        .filter((position) => position.quantity !== 0);

      return positions;
    } catch (error) {
      console.error('Error fetching portfolio positions:', error);
      return [];
    }
  }
}

export const marketDataService = new MarketDataService();
export default marketDataService;

// Polygon.io API Service Layer
// Primary data source for real-time market data

export interface PolygonTicker {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  last_updated_utc: string;
}

export interface PolygonSnapshot {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  updated: number;
  timeframe: string;
  value: number;
  day: {
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    v: number; // volume
    vw: number; // volume weighted average price
  };
  lastQuote: {
    ask: number;
    ask_size: number;
    bid: number;
    bid_size: number;
    exchange: number;
    last_updated: number;
  };
  lastTrade: {
    conditions: number[];
    exchange: number;
    price: number;
    sip_timestamp: number;
    size: number;
    timeframe: string;
  };
  market_status: string;
  fmv?: number;
}

export interface PolygonMarketMover {
  ticker: string;
  value: number;
  change_amount: number;
  change_percentage: number;
  session: {
    change: number;
    change_percent: number;
    early_trading_change: number;
    early_trading_change_percent: number;
    close: number;
    high: number;
    low: number;
    open: number;
    previous_close: number;
  };
}

export interface PolygonAggregateBar {
  c: number; // close
  h: number; // high
  l: number; // low
  n: number; // number of transactions
  o: number; // open
  t: number; // timestamp
  v: number; // volume
  vw: number; // volume weighted average price
}

export interface PolygonHistoricalData {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: PolygonAggregateBar[];
  status: string;
  request_id: string;
  count: number;
}

export interface PolygonNewsItem {
  id: string;
  publisher: {
    name: string;
    homepage_url: string;
    logo_url: string;
    favicon_url: string;
  };
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  tickers: string[];
  image_url?: string;
  description: string;
  keywords: string[];
}

export interface PolygonTickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik: string;
  composite_figi: string;
  share_class_figi: string;
  market_cap: number;
  phone_number: string;
  address: {
    address1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  description: string;
  sic_code: string;
  sic_description: string;
  ticker_root: string;
  homepage_url: string;
  total_employees: number;
  list_date: string;
  branding: {
    logo_url: string;
    icon_url: string;
  };
  share_class_shares_outstanding: number;
  weighted_shares_outstanding: number;
}

class PolygonService {
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io';

  constructor() {
    this.apiKey = process.env.POLYGON_API_KEY || '';
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('apikey', this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get market movers (gainers/losers)
  async getMarketMovers(
    direction: 'gainers' | 'losers' = 'gainers',
  ): Promise<PolygonMarketMover[]> {
    try {
      const data = await this.request<{ results: PolygonMarketMover[] }>(
        `/v2/snapshot/locale/us/markets/stocks/${direction}`,
      );
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching ${direction}:`, error);
      return [];
    }
  }

  // Get snapshot for specific ticker
  async getTickerSnapshot(ticker: string): Promise<PolygonSnapshot | null> {
    try {
      const data = await this.request<{ results: PolygonSnapshot[] }>(
        `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.toUpperCase()}`,
      );
      return data.results?.[0] || null;
    } catch (error) {
      console.error(`Error fetching snapshot for ${ticker}:`, error);
      return null;
    }
  }

  // Get multiple ticker snapshots
  async getBatchSnapshots(tickers: string[]): Promise<PolygonSnapshot[]> {
    try {
      const tickerList = tickers.map((t) => t.toUpperCase()).join(',');
      const data = await this.request<{ results: PolygonSnapshot[] }>(
        '/v2/snapshot/locale/us/markets/stocks/tickers',
        {
          tickers: tickerList,
        },
      );
      return data.results || [];
    } catch (error) {
      console.error('Error fetching batch snapshots:', error);
      return [];
    }
  }

  // Get historical aggregates (OHLCV data)
  async getHistoricalData(
    ticker: string,
    multiplier: number = 1,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day',
    from: string,
    to: string,
  ): Promise<PolygonAggregateBar[]> {
    try {
      const data = await this.request<PolygonHistoricalData>(
        `/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${timespan}/${from}/${to}`,
        {
          adjusted: 'true',
          sort: 'asc',
          limit: '50000',
        },
      );
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      return [];
    }
  }

  // Get ticker details (company info)
  async getTickerDetails(ticker: string): Promise<PolygonTickerDetails | null> {
    try {
      const data = await this.request<{ results: PolygonTickerDetails }>(
        `/v3/reference/tickers/${ticker.toUpperCase()}`,
      );
      return data.results || null;
    } catch (error) {
      console.error(`Error fetching ticker details for ${ticker}:`, error);
      return null;
    }
  }

  // Get news for ticker
  async getTickerNews(ticker: string, limit: number = 10): Promise<PolygonNewsItem[]> {
    try {
      const data = await this.request<{ results: PolygonNewsItem[] }>('/v2/reference/news', {
        ticker: ticker.toUpperCase(),
        limit: limit.toString(),
        sort: 'published_utc',
        order: 'desc',
      });
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching news for ${ticker}:`, error);
      return [];
    }
  }

  // Search tickers
  async searchTickers(query: string): Promise<PolygonTicker[]> {
    try {
      const data = await this.request<{ results: PolygonTicker[] }>('/v3/reference/tickers', {
        search: query,
        active: 'true',
        limit: '20',
        sort: 'ticker',
      });
      return data.results || [];
    } catch (error) {
      console.error(`Error searching tickers for ${query}:`, error);
      return [];
    }
  }

  // Get all market movers combined
  async getAllMarketMovers(): Promise<{
    gainers: PolygonMarketMover[];
    losers: PolygonMarketMover[];
    mostActive: PolygonSnapshot[];
  }> {
    try {
      const [gainers, losers] = await Promise.all([
        this.getMarketMovers('gainers'),
        this.getMarketMovers('losers'),
      ]);

      // Get most active by volume (using popular tickers)
      const popularTickers = [
        'AAPL',
        'TSLA',
        'NVDA',
        'MSFT',
        'GOOGL',
        'AMZN',
        'META',
        'SPY',
        'QQQ',
        'AMD',
      ];
      const mostActive = await this.getBatchSnapshots(popularTickers);

      return {
        gainers: gainers.slice(0, 10),
        losers: losers.slice(0, 10),
        mostActive: mostActive.sort((a, b) => (b.day?.v || 0) - (a.day?.v || 0)).slice(0, 10),
      };
    } catch (error) {
      console.error('Error fetching all market movers:', error);
      return { gainers: [], losers: [], mostActive: [] };
    }
  }
}

export const polygonService = new PolygonService();
export default polygonService;

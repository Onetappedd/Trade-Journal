// Hybrid Market Data Service
// Uses Polygon.io for historical data and Finnhub for real-time data

import { polygonService } from './polygon-api';
import { marketDataService } from './market-data';
import { fallbackMarketDataService, type FallbackTicker } from './fallback-market-data';

export interface HybridTicker {
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

export interface HybridMarketMovers {
  gainers: HybridTicker[];
  losers: HybridTicker[];
  mostActive: HybridTicker[];
}

class HybridMarketDataService {
  // Get trending stocks using Finnhub (since Polygon requires paid plan)
  async getTrendingStocks(): Promise<HybridTicker[]> {
    try {
      console.log('Fetching trending stocks from Finnhub...');

      // Use popular tickers and get their real-time data from Finnhub
      const popularSymbols = [
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
        'NFLX',
        'CRM',
        'ORCL',
        'INTC',
        'CSCO',
      ];

      const quotes = await marketDataService.getBatchQuotes(popularSymbols);
      const profiles = await Promise.allSettled(
        popularSymbols.map((symbol) => marketDataService.getCompanyProfile(symbol)),
      );

      const tickers: HybridTicker[] = quotes.map((quote, index) => {
        const profileResult = profiles[index];
        const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;

        return {
          symbol: quote.symbol,
          name: profile?.name || quote.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          marketCap: profile?.marketCap ? `${(profile.marketCap / 1000000000).toFixed(1)}B` : 'N/A',
          sector: profile?.sector || 'Technology',
          high: quote.high,
          low: quote.low,
          open: quote.open,
          previousClose: quote.previousClose,
        };
      });

      // Sort by absolute change percentage to get the most volatile (trending)
      return tickers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    } catch (error) {
      console.error('Error fetching trending stocks:', error);
      return [];
    }
  }

  // Get market movers (gainers/losers) using Finnhub data with fallback
  async getMarketMovers(): Promise<HybridMarketMovers> {
    try {
      const tickers = await this.getTrendingStocks();

      // If no tickers from API, use fallback data
      if (tickers.length === 0) {
        console.log('Using fallback market data...');
        return await fallbackMarketDataService.getMarketMovers();
      }

      const gainers = tickers
        .filter((t) => t.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 10);

      const losers = tickers
        .filter((t) => t.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 10);

      const mostActive = tickers.sort((a, b) => b.volume - a.volume).slice(0, 10);

      return { gainers, losers, mostActive };
    } catch (error) {
      console.error('Error fetching market movers, using fallback:', error);
      return await fallbackMarketDataService.getMarketMovers();
    }
  }

  // Get single ticker snapshot using Finnhub
  async getTickerSnapshot(symbol: string): Promise<HybridTicker | null> {
    try {
      const [quote, profile] = await Promise.all([
        marketDataService.getStockQuote(symbol),
        marketDataService.getCompanyProfile(symbol),
      ]);

      return {
        symbol: quote.symbol,
        name: profile?.name || quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        marketCap: profile?.marketCap ? `${(profile.marketCap / 1000000000).toFixed(1)}B` : 'N/A',
        sector: profile?.sector || 'Unknown',
        high: quote.high,
        low: quote.low,
        open: quote.open,
        previousClose: quote.previousClose,
      };
    } catch (error) {
      console.error(`Error fetching snapshot for ${symbol}:`, error);
      return null;
    }
  }

  // Use Polygon.io for historical data (this works with free tier)
  async getHistoricalData(
    ticker: string,
    multiplier: number = 1,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day',
    from: string,
    to: string,
  ) {
    try {
      return await polygonService.getHistoricalData(ticker, multiplier, timespan, from, to);
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      // Fallback to Finnhub historical data if needed
      return await marketDataService.getHistoricalData(ticker, 30);
    }
  }

  // Use Polygon.io for search (this works with free tier)
  async searchTickers(query: string) {
    try {
      const results = await polygonService.searchTickers(query);
      return results.map((ticker) => ({
        symbol: ticker.ticker,
        name: ticker.name,
        type: ticker.type,
        exchange: ticker.primary_exchange,
        currency: ticker.currency_name,
      }));
    } catch (error) {
      console.error(`Error searching for ${query}:`, error);
      // Fallback to Finnhub search
      return await marketDataService.searchStocks(query);
    }
  }
}

export const hybridMarketDataService = new HybridMarketDataService();
export default hybridMarketDataService;

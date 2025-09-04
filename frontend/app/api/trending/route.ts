import { NextResponse } from 'next/server';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PolygonTicker {
  ticker: string;
  name?: string;
  market_cap?: number;
  day?: {
    c: number; // close price
    pc: number; // previous close
    v: number; // volume
  };
}

interface TrendingTicker {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  marketCap: number;
}

const mockData: TrendingTicker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 195.89, changePct: 2.34, volume: 54234567, marketCap: 3045000000000 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 430.32, changePct: -0.56, volume: 23456789, marketCap: 3198000000000 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.45, changePct: 1.23, volume: 18234567, marketCap: 2234000000000 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.67, changePct: 3.45, volume: 45678901, marketCap: 1923000000000 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.43, changePct: -1.89, volume: 38901234, marketCap: 2156000000000 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 523.78, changePct: 0.78, volume: 12345678, marketCap: 1345000000000 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.67, changePct: 4.56, volume: 98765432, marketCap: 778000000000 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 423.89, changePct: -0.23, volume: 3456789, marketCap: 897000000000 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 215.34, changePct: 1.67, volume: 8901234, marketCap: 612000000000 },
  { symbol: 'V', name: 'Visa Inc.', price: 289.45, changePct: 0.45, volume: 5678901, marketCap: 534000000000 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 189.23, changePct: -0.89, volume: 6789012, marketCap: 512000000000 },
  { symbol: 'UNH', name: 'UnitedHealth Group', price: 567.89, changePct: 2.12, volume: 2345678, marketCap: 523000000000 },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 112.34, changePct: 1.45, volume: 12345678, marketCap: 456000000000 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 156.78, changePct: -0.34, volume: 5678901, marketCap: 398000000000 },
  { symbol: 'PG', name: 'Procter & Gamble', price: 167.89, changePct: 0.67, volume: 4567890, marketCap: 387000000000 },
];

export async function GET() {
  try {
    const apiKey = process.env.POLYGON_API_KEY;
    
    if (apiKey) {
      try {
        const response = await fetch(
          `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?limit=50&apiKey=${apiKey}`,
          { next: { revalidate: 300 } }
        );

        if (response.ok) {
          const data = await response.json();
          
          const tickers: TrendingTicker[] = data.tickers
            ?.filter((t: PolygonTicker) => t.day && t.day.c > 0)
            .map((t: PolygonTicker) => ({
              symbol: t.ticker,
              name: t.name || t.ticker,
              price: t.day?.c || 0,
              changePct: t.day && t.day.pc ? ((t.day.c - t.day.pc) / t.day.pc) * 100 : 0,
              volume: t.day?.v || 0,
              marketCap: t.market_cap || 0,
            })) || [];

          if (tickers.length > 0) {
            return NextResponse.json(tickers, {
              headers: {
                'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
              },
            });
          }
        }
      } catch (error) {
        console.error('Polygon API error:', error);
      }
    }

    // Return mock data if no API key or fetch fails
    return NextResponse.json(mockData, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json(mockData, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
  }
}
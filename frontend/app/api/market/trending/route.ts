import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/market-data'

// Force this API route to use Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    let trending
    let usingFallback = false
    try {
      trending = await marketDataService.getTrendingStocks()
      if (!trending || trending.usingFallback) throw new Error("Provider or key error")
      usingFallback = false
    } catch (err) {
      usingFallback = true
      trending = marketDataService.getFallbackTrendingStocks
        ? await marketDataService.getFallbackTrendingStocks()
        : [
            { symbol: 'AAPL', name: 'Apple', price: 170.2, change: 1.2, changePercent: 0.7, volume: 50000000, marketCap: '2T', sector: 'Tech' },
            { symbol: 'MSFT', name: 'Microsoft', price: 290.4, change: -1.0, changePercent: -0.3, volume: 30000000, marketCap: '2T', sector: 'Tech' },
            { symbol: 'GOOG', name: 'Alphabet', price: 2700, change: 10, changePercent: 0.4, volume: 18000000, marketCap: '1.5T', sector: 'Tech' },
          ]
    }
    return NextResponse.json({ trending, usingFallback }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  }
}
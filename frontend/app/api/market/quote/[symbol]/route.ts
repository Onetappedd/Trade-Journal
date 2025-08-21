import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/market-data'

// Force this API route to use Node.js runtime
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase()
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    let quote
    let usingFallback = false
    try {
      quote = await marketDataService.getStockQuote(symbol)
      if (!quote || quote.usingFallback) throw new Error("Provider or key error")
      usingFallback = false
    } catch (err) {
      // fallback (static/mock data)
      usingFallback = true
      quote = marketDataService.getFallbackQuote
        ? await marketDataService.getFallbackQuote(symbol)
        : {
            symbol,
            price: 100 + Math.random() * 100,
            change: 0,
            changePercent: 0,
            volume: 100000,
            marketCap: "100B",
            high: 0,
            low: 0,
            open: 0,
            previousClose: 0,
            timestamp: Date.now(),
          }
    }
    return NextResponse.json({ ...quote, usingFallback }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  }
}
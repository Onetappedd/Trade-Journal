import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/market-data'

// Force this API route to use Node.js runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols } = body
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      )
    }

    if (symbols.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 symbols allowed per request' },
        { status: 400 }
      )
    }

    let quotes
    let usingFallback = false
    try {
      quotes = await marketDataService.getBatchQuotes(symbols)
      if (!quotes || (Array.isArray(quotes) && quotes.length === 0) || quotes.usingFallback) throw new Error("Provider or key error")
      usingFallback = false
    } catch (err) {
      usingFallback = true
      quotes = marketDataService.getFallbackBatchQuotes
        ? await marketDataService.getFallbackBatchQuotes(symbols)
        : symbols.map(symbol => ({
            symbol,
            price: 100 + Math.random() * 100,
            change: 0,
            changePercent: 0,
            volume: 50000,
            marketCap: "50B",
            high: 0,
            low: 0,
            open: 0,
            previousClose: 0,
            timestamp: Date.now(),
          }))
    }
    return NextResponse.json({ quotes, usingFallback }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  }
}
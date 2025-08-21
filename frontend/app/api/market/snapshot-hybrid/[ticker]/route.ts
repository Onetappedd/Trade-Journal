import { NextRequest, NextResponse } from 'next/server'
import { hybridMarketDataService } from '@/lib/hybrid-market-data'

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker.toUpperCase()
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      )
    }

    let snapshot
    let usingFallback = false
    try {
      snapshot = await hybridMarketDataService.getTickerSnapshot(ticker)
      if (!snapshot || snapshot.usingFallback) throw new Error("Provider or key error")
      usingFallback = false
    } catch (err) {
      usingFallback = true
      snapshot = hybridMarketDataService.getFallbackTickerSnapshot
        ? await hybridMarketDataService.getFallbackTickerSnapshot(ticker)
        : {
            symbol: ticker,
            last: 100 + Math.random() * 100,
            change: 0,
            percent: 0,
            volume: 100000,
            open: 100,
            close: 100,
            dayHigh: 110,
            dayLow: 90,
            updated: Date.now(),
          }
    }
    return NextResponse.json({ ...snapshot, usingFallback }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  }
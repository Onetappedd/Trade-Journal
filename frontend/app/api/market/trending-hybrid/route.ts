import { NextRequest, NextResponse } from 'next/server'
import { hybridMarketDataService } from '@/lib/hybrid-market-data'

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    let movers
    let usingFallback = false
    try {
      movers = await hybridMarketDataService.getMarketMovers()
      if (!movers || movers.usingFallback) throw new Error("Provider or key error")
      usingFallback = false
    } catch (err) {
      usingFallback = true
      movers = hybridMarketDataService.getFallbackMarketMovers
        ? await hybridMarketDataService.getFallbackMarketMovers()
        : [
            { symbol: 'AAPL', name: 'Apple', price: 174.2, change: 2.1, changePercent: 1.2, volume: 51000000, marketCap: '2T', sector: 'Tech' },
            { symbol: 'MSFT', name: 'Microsoft', price: 295.4, change: -0.9, changePercent: -0.24, volume: 32000000, marketCap: '2T', sector: 'Tech' },
          ]
    }
    return NextResponse.json({ movers, usingFallback }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  }
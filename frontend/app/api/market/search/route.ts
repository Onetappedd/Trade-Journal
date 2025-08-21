import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/market-data'

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const query = searchParams.get('q')
    
    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    let results
    let usingFallback = false
    try {
      results = await marketDataService.searchStocks(query)
      if (!results || results.usingFallback) throw new Error("Provider or key error")
      usingFallback = false
    } catch (err) {
      usingFallback = true
      results = marketDataService.getFallbackSearchStocks
        ? await marketDataService.getFallbackSearchStocks(query)
        : [
            { symbol: 'AAPL', name: 'Apple', type: 'stock' },
            { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
            { symbol: 'GOOG', name: 'Alphabet', type: 'stock' },
          ]
    }
    return NextResponse.json({ results, usingFallback }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  }
}
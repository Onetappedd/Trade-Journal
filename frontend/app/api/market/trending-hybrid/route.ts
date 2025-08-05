import { NextRequest, NextResponse } from 'next/server'
import { hybridMarketDataService } from '@/lib/hybrid-market-data'

// Force this API route to use Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const movers = await hybridMarketDataService.getMarketMovers()
    
    return NextResponse.json(movers, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Error fetching hybrid market data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}
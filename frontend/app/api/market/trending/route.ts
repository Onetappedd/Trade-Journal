import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/market-data'

// Force this API route to use Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const trending = await marketDataService.getTrendingStocks()
    
    return NextResponse.json(trending, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })
  } catch (error) {
    console.error('Error fetching trending stocks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending stocks' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { polygonService } from '@/lib/polygon-api'

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker.toUpperCase()
    const { searchParams } = request.nextUrl
    
    const multiplier = parseInt(searchParams.get('multiplier') || '1')
    const timespan = searchParams.get('timespan') as 'minute' | 'hour' | 'day' | 'week' | 'month' || 'day'
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0]
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      )
    }

    const historicalData = await polygonService.getHistoricalData(ticker, multiplier, timespan, from, to)
    
    return NextResponse.json({
      ticker,
      timespan,
      multiplier,
      from,
      to,
      results: historicalData
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}
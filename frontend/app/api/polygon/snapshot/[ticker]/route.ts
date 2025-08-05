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
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      )
    }

    const snapshot = await polygonService.getTickerSnapshot(ticker)
    
    if (!snapshot) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('Error fetching ticker snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticker snapshot' },
      { status: 500 }
    )
  }
}
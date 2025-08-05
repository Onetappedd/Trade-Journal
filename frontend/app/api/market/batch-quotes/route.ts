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

    const quotes = await marketDataService.getBatchQuotes(symbols)
    
    return NextResponse.json(quotes, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('Error fetching batch quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch quotes' },
      { status: 500 }
    )
  }
}
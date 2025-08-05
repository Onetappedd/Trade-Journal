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

    const quote = await marketDataService.getStockQuote(symbol)
    
    return NextResponse.json(quote, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('Error fetching stock quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock quote' },
      { status: 500 }
    )
  }
}
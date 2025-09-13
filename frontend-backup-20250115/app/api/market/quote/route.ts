import { NextRequest, NextResponse } from 'next/server'
import { defaultProvider } from '@/lib/marketdata/provider'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const quote = await defaultProvider.getQuote(symbol.toUpperCase())

    return NextResponse.json({
      success: true,
      data: quote,
      provider: defaultProvider.name
    })

  } catch (error) {
    console.error('Quote API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch quote',
        provider: defaultProvider.name
      },
      { status: 500 }
    )
  }
}

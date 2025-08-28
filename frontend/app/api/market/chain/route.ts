import { NextRequest, NextResponse } from 'next/server'
import { defaultProvider } from '@/lib/marketdata/provider'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const expiry = searchParams.get('expiry')

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      )
    }

    const chain = await defaultProvider.getOptionsChain(symbol.toUpperCase(), expiry || undefined)

    return NextResponse.json({
      success: true,
      data: chain,
      provider: defaultProvider.name
    })

  } catch (error) {
    console.error('Chain API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch options chain',
        provider: defaultProvider.name
      },
      { status: 500 }
    )
  }
}

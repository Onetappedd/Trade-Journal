import { NextRequest, NextResponse } from 'next/server'
import { DemoPolygonProvider } from '@/lib/marketdata/polygon'

const provider = new DemoPolygonProvider()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const strike = searchParams.get('strike')
    const expiry = searchParams.get('expiry')
    const type = searchParams.get('type')

    if (!symbol || !strike || !expiry || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: symbol, strike, expiry, type' },
        { status: 400 }
      )
    }

    const contract = await provider.getContractDetails(
      symbol,
      parseFloat(strike),
      expiry,
      type as 'call' | 'put'
    )

    return NextResponse.json({
      success: true,
      data: contract
    })

  } catch (error) {
    console.error('Contract API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract details' },
      { status: 500 }
    )
  }
}

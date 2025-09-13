import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/market-data'

export async function GET(request: NextRequest) {
  try {
    // Test with a few popular symbols
    const testSymbols = ['AAPL', 'TSLA', 'NVDA']
    
    console.log('Testing scanner API with symbols:', testSymbols)
    
    // Fetch real market data
    const quotes = await marketDataService.getBatchQuotes(testSymbols)
    const profiles = await Promise.allSettled(
      testSymbols.map(symbol => marketDataService.getCompanyProfile(symbol))
    )

    // Process results
    const results = quotes.map((quote, index) => {
      const profileResult = profiles[index]
      const profile = profileResult.status === 'fulfilled' ? profileResult.value : null

      return {
        symbol: quote.symbol,
        name: profile?.name || quote.symbol,
        sector: profile?.sector || 'Unknown',
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        usingRealData: true
      }
    })

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Scanner API test successful',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Scanner test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Scanner API test failed'
      },
      { status: 500 }
    )
  }
}

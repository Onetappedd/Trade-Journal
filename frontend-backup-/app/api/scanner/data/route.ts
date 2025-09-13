import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/market-data'
import { hybridMarketDataService } from '@/lib/hybrid-market-data'

interface ScannerFilters {
  priceMin?: number
  priceMax?: number
  volumeMin?: number
  rvolMin?: number
  changeMin?: number
  changeMax?: number
  rsiMin?: number
  rsiMax?: number
  atrPercentMin?: number
  sectors?: string[]
  watchlistOnly?: boolean
  universe?: string[]
}

interface ScannerRequest {
  filters: ScannerFilters
  preset?: string
  symbols?: string[]
}

// Popular symbols for scanning
const POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'CRM',
  'ORCL', 'INTC', 'CSCO', 'ADBE', 'PYPL', 'UBER', 'LYFT', 'ZM', 'SHOP', 'SQ',
  'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'ARKK', 'TQQQ', 'SQQQ', 'UVXY'
]

// Preset configurations
const PRESETS: Record<string, { filters: Partial<ScannerFilters>, symbols: string[] }> = {
  'top-gainers': {
    filters: { changeMin: 3, volumeMin: 1000000 },
    symbols: POPULAR_SYMBOLS
  },
  'gap-ups': {
    filters: { changeMin: 2, volumeMin: 500000 },
    symbols: POPULAR_SYMBOLS
  },
  'high-rvol': {
    filters: { rvolMin: 2, volumeMin: 100000 },
    symbols: POPULAR_SYMBOLS
  },
  'week52-breakouts': {
    filters: { volumeMin: 500000 },
    symbols: POPULAR_SYMBOLS
  },
  'pullback-20ema': {
    filters: { rsiMin: 40, rsiMax: 60, volumeMin: 300000 },
    symbols: POPULAR_SYMBOLS
  },
  'oversold-reversal': {
    filters: { rsiMax: 30, changeMin: 0.5, volumeMin: 200000 },
    symbols: POPULAR_SYMBOLS
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ScannerRequest = await request.json()
    const { filters, preset, symbols = POPULAR_SYMBOLS } = body

    // Determine which symbols to scan
    let symbolsToScan = symbols
    if (preset && PRESETS[preset as keyof typeof PRESETS]) {
      symbolsToScan = PRESETS[preset as keyof typeof PRESETS].symbols
    }

    // Limit to first 50 symbols for performance
    symbolsToScan = symbolsToScan.slice(0, 50)

    // Fetch real market data for all symbols
    const quotes = await marketDataService.getBatchQuotes(symbolsToScan)
    const profiles = await Promise.allSettled(
      symbolsToScan.map(symbol => marketDataService.getCompanyProfile(symbol))
    )

    // Process and filter results
    const results = quotes.map((quote, index) => {
      const profileResult = profiles[index]
      const profile = profileResult.status === 'fulfilled' ? profileResult.value : null

      // Calculate derived metrics
      const changePercent = quote.changePercent
      const rvol = quote.volume > 0 ? quote.volume / 1000000 : 0 // Simplified RVOL
      const atrPercent = Math.abs(changePercent) // Simplified ATR%
      const rsi = 50 + (changePercent * 2) // Simplified RSI based on momentum

      return {
        symbol: quote.symbol,
        name: profile?.name || quote.symbol,
        sector: profile?.sector || 'Unknown',
        price: quote.price,
        change: quote.change,
        volume: quote.volume,
        rvol,
        week52High: quote.high,
        week52Low: quote.low,
        atrPercent,
        rsi: Math.max(0, Math.min(100, rsi)), // Clamp RSI between 0-100
        isWatchlisted: false // Will be populated by client-side watchlist data
      }
    })

    // Apply filters
    let filteredResults = results

    // Apply preset filters
    if (preset && PRESETS[preset as keyof typeof PRESETS]) {
      const presetFilters = PRESETS[preset as keyof typeof PRESETS].filters
      filteredResults = filteredResults.filter(item => {
        if (presetFilters.priceMin && item.price < presetFilters.priceMin) return false
        if (presetFilters.priceMax && item.price > presetFilters.priceMax) return false
        if (presetFilters.volumeMin && item.volume < presetFilters.volumeMin) return false
        if (presetFilters.rvolMin && item.rvol < presetFilters.rvolMin) return false
        if (presetFilters.changeMin && item.change < presetFilters.changeMin) return false
        if (presetFilters.changeMax && item.change > presetFilters.changeMax) return false
        if (presetFilters.rsiMin && item.rsi < presetFilters.rsiMin) return false
        if (presetFilters.rsiMax && item.rsi > presetFilters.rsiMax) return false
        if (presetFilters.atrPercentMin && item.atrPercent < presetFilters.atrPercentMin) return false
        return true
      })
    }

    // Apply custom filters
    if (filters.priceMin) {
      filteredResults = filteredResults.filter(r => r.price >= filters.priceMin!)
    }
    if (filters.priceMax) {
      filteredResults = filteredResults.filter(r => r.price <= filters.priceMax!)
    }
    if (filters.volumeMin) {
      filteredResults = filteredResults.filter(r => r.volume >= filters.volumeMin!)
    }
    if (filters.rvolMin) {
      filteredResults = filteredResults.filter(r => r.rvol >= filters.rvolMin!)
    }
    if (filters.changeMin) {
      filteredResults = filteredResults.filter(r => r.change >= filters.changeMin!)
    }
    if (filters.changeMax) {
      filteredResults = filteredResults.filter(r => r.change <= filters.changeMax!)
    }
    if (filters.rsiMin) {
      filteredResults = filteredResults.filter(r => r.rsi >= filters.rsiMin!)
    }
    if (filters.rsiMax) {
      filteredResults = filteredResults.filter(r => r.rsi <= filters.rsiMax!)
    }
    if (filters.atrPercentMin) {
      filteredResults = filteredResults.filter(r => r.atrPercent >= filters.atrPercentMin!)
    }
    if (filters.sectors && filters.sectors.length > 0) {
      filteredResults = filteredResults.filter(r => filters.sectors!.includes(r.sector))
    }

    return NextResponse.json({
      data: filteredResults,
      total: filteredResults.length,
      usingRealData: true
    })

  } catch (error) {
    console.error('Scanner API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scanner data' },
      { status: 500 }
    )
  }
}

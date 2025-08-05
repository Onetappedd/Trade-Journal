import { NextRequest, NextResponse } from 'next/server'
import { polygonService } from '@/lib/polygon-api'

// Force this API route to use Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const allMovers = await polygonService.getAllMarketMovers()
    
    // Combine and format the data for trending display
    const trending = [
      ...allMovers.gainers.slice(0, 5).map(mover => ({
        ticker: mover.ticker,
        value: mover.value,
        change_amount: mover.change_amount,
        change_percentage: mover.change_percentage,
        type: 'gainer' as const,
        session: mover.session
      })),
      ...allMovers.losers.slice(0, 5).map(mover => ({
        ticker: mover.ticker,
        value: mover.value,
        change_amount: mover.change_amount,
        change_percentage: mover.change_percentage,
        type: 'loser' as const,
        session: mover.session
      })),
      ...allMovers.mostActive.slice(0, 5).map(snapshot => ({
        ticker: snapshot.ticker,
        value: snapshot.value,
        change_amount: snapshot.todaysChange,
        change_percentage: snapshot.todaysChangePerc,
        type: 'active' as const,
        session: {
          change: snapshot.todaysChange,
          change_percent: snapshot.todaysChangePerc,
          close: snapshot.day?.c || 0,
          high: snapshot.day?.h || 0,
          low: snapshot.day?.l || 0,
          open: snapshot.day?.o || 0,
          previous_close: (snapshot.day?.c || 0) - (snapshot.todaysChange || 0),
          early_trading_change: 0,
          early_trading_change_percent: 0
        }
      }))
    ]

    return NextResponse.json({
      gainers: allMovers.gainers,
      losers: allMovers.losers,
      mostActive: allMovers.mostActive,
      trending
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })
  } catch (error) {
    console.error('Error fetching trending data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 }
    )
  }
}
export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { calculatePositions } from "@/lib/position-tracker-server"
import { getUserTradesGroupedByDay } from "@/lib/calendar-metrics-server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    // Fetch all trades
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Use position tracker to get matched trades
    const { positions, closedTrades, stats } = calculatePositions(trades || [])
    
    // Get calendar data
    const calendarData = await getUserTradesGroupedByDay(user.id)
    
    // Sample some daily data
    const sampleDays = Object.entries(calendarData.dailyData)
      .slice(0, 10)
      .map(([date, data]) => ({
        date,
        realizedPnL: data.realizedPnL,
        tradeCount: data.tradeCount,
        trades: data.trades.map(t => ({
          symbol: t.symbol,
          side: t.side,
          pnl: t.pnl
        }))
      }))
    
    return NextResponse.json({
      debug: {
        totalTrades: trades?.length || 0,
        closedTradesCount: closedTrades.length,
        openPositions: positions.filter(p => p.openQuantity > 0).length,
        totalPnL: stats.totalPnL,
        winRate: stats.winRate
      },
      calendar: {
        totalDays: Object.keys(calendarData.dailyData).length,
        tradingDays: calendarData.tradingDays,
        winningDays: calendarData.winningDays,
        losingDays: calendarData.losingDays,
        totalRealizedPnL: calendarData.totalRealizedPnL,
        bestDay: calendarData.bestDay,
        worstDay: calendarData.worstDay
      },
      sampleDays,
      sampleClosedTrades: closedTrades.slice(0, 5).map(t => ({
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        exit_date: t.exit_date,
        pnl: t.pnl
      }))
    })
  } catch (error) {
    console.error("Debug calendar error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
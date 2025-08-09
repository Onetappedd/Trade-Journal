export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { calculatePositions } from "@/lib/position-tracker-server"

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
      .limit(10)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Use position tracker to get matched trades
    const allTradesQuery = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: true })
    
    const { positions, closedTrades, stats } = calculatePositions(allTradesQuery.data || [])
    
    // Group closed trades by exit date for calendar
    const calendarData: Record<string, any> = {}
    
    for (const trade of closedTrades) {
      if (trade.exit_date) {
        const dateKey = trade.exit_date.split('T')[0]
        if (!calendarData[dateKey]) {
          calendarData[dateKey] = {
            date: dateKey,
            trades: [],
            totalPnL: 0
          }
        }
        calendarData[dateKey].trades.push({
          symbol: trade.symbol,
          pnl: trade.pnl,
          side: trade.side
        })
        calendarData[dateKey].totalPnL += trade.pnl
      }
    }
    
    return NextResponse.json({
      sampleTrades: trades?.slice(0, 5).map(t => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        entry_date: t.entry_date,
        exit_date: t.exit_date,
        status: t.status,
        asset_type: t.asset_type
      })),
      totalTrades: trades?.length,
      closedTradesCount: closedTrades.length,
      totalPnL: stats.totalPnL,
      calendarDays: Object.keys(calendarData).length,
      sampleCalendarData: Object.values(calendarData).slice(0, 5)
    })
  } catch (error) {
    console.error("Debug trades error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
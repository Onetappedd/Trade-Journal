// Server-side calendar metrics using position tracker for matched trades
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { calculatePositions } from "@/lib/position-tracker-server"

export interface DailyPnL {
  date: string
  realizedPnL: number
  unrealizedPnL: number
  totalPnL: number
  tradeCount: number
  trades: TradeDetail[]
}

export interface TradeDetail {
  id: string
  symbol: string
  side: string
  quantity: number
  entryPrice: number
  exitPrice?: number
  pnl: number
  status: string
  assetType: string
}

export interface CalendarData {
  dailyData: Record<string, DailyPnL>
  minDate: string
  maxDate: string
  totalRealizedPnL: number
  totalUnrealizedPnL: number
  bestDay: { date: string; pnl: number }
  worstDay: { date: string; pnl: number }
  tradingDays: number
  winningDays: number
  losingDays: number
}

/**
 * Get trades grouped by day using position matching (buy/sell pairing)
 * Server-side version that can use cookies
 */
export async function getUserTradesGroupedByDay(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarData> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  
  // Fetch ALL trades for the user
  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true })
  
  console.log(`[Calendar Server] Fetching trades for user ${userId}:`, trades?.length || 0, 'trades found')
  
  if (error || !trades || trades.length === 0) {
    console.error("[Calendar Server] Error fetching trades:", error)
    return {
      dailyData: {},
      minDate: new Date().toISOString().split('T')[0],
      maxDate: new Date().toISOString().split('T')[0],
      totalRealizedPnL: 0,
      totalUnrealizedPnL: 0,
      bestDay: { date: "", pnl: 0 },
      worstDay: { date: "", pnl: 0 },
      tradingDays: 0,
      winningDays: 0,
      losingDays: 0,
    }
  }
  
  // Use position tracker to match buy/sell orders
  const { positions, closedTrades, stats } = calculatePositions(trades)
  
  console.log(`[Calendar Server] Position tracker results:`)
  console.log(`[Calendar Server] - Total trades: ${trades.length}`)
  console.log(`[Calendar Server] - Closed trades (matched): ${closedTrades.length}`)
  console.log(`[Calendar Server] - Total P&L: $${stats.totalPnL.toFixed(2)}`)
  console.log(`[Calendar Server] - Open positions: ${positions.filter(p => p.openQuantity > 0).length}`)
  
  // Track daily P&L
  const dailyData: Record<string, DailyPnL> = {}
  let totalRealizedPnL = 0
  
  // Process closed trades (these have calculated P&L from position matching)
  for (const trade of closedTrades) {
    // Use exit_date if available, otherwise use entry_date
    // For sell trades, entry_date is actually the closing date
    const dateKey = (trade.exit_date || trade.entry_date).split('T')[0]
    
    // Initialize daily data if not exists
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        realizedPnL: 0,
        unrealizedPnL: 0,
        totalPnL: 0,
        tradeCount: 0,
        trades: []
      }
    }
    
    // Add the P&L (already calculated by position tracker)
    dailyData[dateKey].realizedPnL += trade.pnl
    dailyData[dateKey].totalPnL += trade.pnl
    totalRealizedPnL += trade.pnl
    
    // Add trade detail
    dailyData[dateKey].trades.push({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      entryPrice: trade.entry_price,
      exitPrice: trade.exit_price || trade.entry_price, // For sells, entry_price is the exit
      pnl: trade.pnl,
      status: 'closed',
      assetType: trade.asset_type || 'option'
    })
    
    dailyData[dateKey].tradeCount++
    
    console.log(`[Calendar Server] ${dateKey}: ${trade.symbol} ${trade.side} - P&L: $${trade.pnl.toFixed(2)}`)
  }
  
  // Also add open positions to show on calendar (but with 0 P&L)
  for (const position of positions) {
    if (position.openQuantity > 0 && position.trades.length > 0) {
      // Find the most recent trade date for this position
      const lastTrade = position.trades[position.trades.length - 1]
      const dateKey = lastTrade.entry_date.split('T')[0]
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          realizedPnL: 0,
          unrealizedPnL: 0,
          totalPnL: 0,
          tradeCount: 0,
          trades: []
        }
      }
      
      // Add as open position (no P&L yet)
      dailyData[dateKey].trades.push({
        id: lastTrade.id,
        symbol: position.symbol,
        side: 'open',
        quantity: position.openQuantity,
        entryPrice: position.avgEntryPrice,
        exitPrice: undefined,
        pnl: 0,
        status: 'open',
        assetType: lastTrade.asset_type || 'option'
      })
      
      dailyData[dateKey].tradeCount++
    }
  }
  
  console.log(`[Calendar Server] Total Realized P&L: $${totalRealizedPnL.toFixed(2)}`)
  console.log(`[Calendar Server] Daily data entries: ${Object.keys(dailyData).length}`)
  console.log(`[Calendar Server] Sample daily data:`, Object.keys(dailyData).slice(0, 5))
  
  // Calculate statistics
  const dates = Object.keys(dailyData).sort()
  let bestDay = { date: "", pnl: -Infinity }
  let worstDay = { date: "", pnl: Infinity }
  let winningDays = 0
  let losingDays = 0
  
  for (const date of dates) {
    const dayPnL = dailyData[date].realizedPnL
    
    // Only count days with actual P&L (not just open positions)
    if (dayPnL !== 0) {
      if (dayPnL > bestDay.pnl) {
        bestDay = { date, pnl: dayPnL }
      }
      if (dayPnL < worstDay.pnl) {
        worstDay = { date, pnl: dayPnL }
      }
      
      if (dayPnL > 0) winningDays++
      else if (dayPnL < 0) losingDays++
    }
  }
  
  // If no days with P&L, set defaults
  if (bestDay.pnl === -Infinity) {
    bestDay = { date: "", pnl: 0 }
  }
  if (worstDay.pnl === Infinity) {
    worstDay = { date: "", pnl: 0 }
  }
  
  // Filter dates if provided
  let filteredDailyData = dailyData
  if (startDate || endDate) {
    filteredDailyData = {}
    for (const [date, data] of Object.entries(dailyData)) {
      const dateObj = new Date(date)
      if ((!startDate || dateObj >= startDate) && (!endDate || dateObj <= endDate)) {
        filteredDailyData[date] = data
      }
    }
  }
  
  const tradingDays = winningDays + losingDays // Only count days with P&L
  
  console.log(`[Calendar Server] Stats:`)
  console.log(`[Calendar Server] - Trading days (with P&L): ${tradingDays}`)
  console.log(`[Calendar Server] - Winning days: ${winningDays}`)
  console.log(`[Calendar Server] - Losing days: ${losingDays}`)
  console.log(`[Calendar Server] - Best day: ${bestDay.date} ($${bestDay.pnl.toFixed(2)})`)
  console.log(`[Calendar Server] - Worst day: ${worstDay.date} ($${worstDay.pnl.toFixed(2)})`)
  
  return {
    dailyData: filteredDailyData,
    minDate: dates[0] || new Date().toISOString().split('T')[0],
    maxDate: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
    totalRealizedPnL,
    totalUnrealizedPnL: 0, // Would need real-time prices
    bestDay,
    worstDay,
    tradingDays,
    winningDays,
    losingDays,
  }
}
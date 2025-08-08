// Simplified calendar metrics for P&L heatmap
import { createClient } from "@/lib/supabase"

/**
 * Simple and direct approach to get trades grouped by exit date with P&L
 */
export async function getSimplifiedCalendarData(userId: string) {
  const supabase = createClient()
  
  // Fetch ALL trades for the user
  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
  
  console.log(`[Calendar] Fetching trades for user ${userId}`)
  console.log(`[Calendar] Found ${trades?.length || 0} total trades`)
  
  if (error) {
    console.error("[Calendar] Error fetching trades:", error)
    return null
  }
  
  if (!trades || trades.length === 0) {
    console.log("[Calendar] No trades found for user")
    return {
      dailyPnL: {},
      totalPnL: 0,
      tradingDays: 0
    }
  }
  
  // Group trades by exit date and calculate P&L
  const dailyPnL: Record<string, number> = {}
  let totalPnL = 0
  let closedTradesCount = 0
  
  for (const trade of trades) {
    // Only process closed trades with exit data
    if (trade.status === 'closed' && trade.exit_date && trade.exit_price !== null) {
      closedTradesCount++
      
      // Use exit date as the key
      const dateKey = trade.exit_date.split('T')[0]
      
      // Calculate P&L
      const multiplier = trade.asset_type === 'option' ? 100 : 1
      let pnl = 0
      
      if (trade.side === 'buy') {
        // Long position: profit when price goes up
        pnl = (trade.exit_price - trade.entry_price) * trade.quantity * multiplier
      } else if (trade.side === 'sell') {
        // Short position: profit when price goes down
        pnl = (trade.entry_price - trade.exit_price) * trade.quantity * multiplier
      }
      
      // Add to daily total
      dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + pnl
      totalPnL += pnl
      
      console.log(`[Calendar] Trade ${trade.symbol} on ${dateKey}: P&L = $${pnl.toFixed(2)}`)
    }
  }
  
  console.log(`[Calendar] Processed ${closedTradesCount} closed trades`)
  console.log(`[Calendar] Total P&L: $${totalPnL.toFixed(2)}`)
  console.log(`[Calendar] Trading days: ${Object.keys(dailyPnL).length}`)
  
  return {
    dailyPnL,
    totalPnL,
    tradingDays: Object.keys(dailyPnL).length,
    closedTradesCount
  }
}
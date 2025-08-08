// Calendar metrics for P&L heatmap
import { createClient } from "@/lib/supabase"

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
 * Get trades grouped by day with P&L calculations
 */
export async function getUserTradesGroupedByDay(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarData> {
  const supabase = createClient()
  
  // Build query
  let query = supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true })
  
  // Add date filters if provided
  if (startDate) {
    query = query.gte("entry_date", startDate.toISOString())
  }
  if (endDate) {
    query = query.lte("entry_date", endDate.toISOString())
  }
  
  const { data: trades, error } = await query
  
  if (error || !trades) {
    console.error("Error fetching trades:", error)
    return {
      dailyData: {},
      minDate: new Date().toISOString(),
      maxDate: new Date().toISOString(),
      totalRealizedPnL: 0,
      totalUnrealizedPnL: 0,
      bestDay: { date: "", pnl: 0 },
      worstDay: { date: "", pnl: 0 },
      tradingDays: 0,
      winningDays: 0,
      losingDays: 0,
    }
  }
  
  // Group trades by symbol for position tracking
  const positions = new Map<string, {
    openQuantity: number
    totalCost: number
    trades: any[]
  }>()
  
  // Track daily P&L
  const dailyData: Record<string, DailyPnL> = {}
  let totalRealizedPnL = 0
  let totalUnrealizedPnL = 0
  
  // Process trades chronologically
  for (const trade of trades) {
    const dateKey = trade.entry_date.split('T')[0] // YYYY-MM-DD format
    
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
    
    // Create position key (symbol + option details if applicable)
    const positionKey = trade.asset_type === 'option' 
      ? `${trade.symbol}_${trade.option_type}_${trade.strike_price}_${trade.expiration_date}`
      : trade.symbol
    
    let position = positions.get(positionKey)
    if (!position) {
      position = {
        openQuantity: 0,
        totalCost: 0,
        trades: []
      }
      positions.set(positionKey, position)
    }
    
    // Calculate P&L based on trade side
    let tradePnL = 0
    const multiplier = trade.asset_type === 'option' ? 100 : 1
    
    if (trade.side === 'buy') {
      // Opening or adding to position
      position.openQuantity += trade.quantity
      position.totalCost += trade.quantity * trade.entry_price * multiplier
      position.trades.push(trade)
      
      // If trade has exit price, it's closed
      if (trade.exit_price && trade.exit_date) {
        const exitDateKey = trade.exit_date.split('T')[0]
        tradePnL = (trade.exit_price - trade.entry_price) * trade.quantity * multiplier
        
        if (!dailyData[exitDateKey]) {
          dailyData[exitDateKey] = {
            date: exitDateKey,
            realizedPnL: 0,
            unrealizedPnL: 0,
            totalPnL: 0,
            tradeCount: 0,
            trades: []
          }
        }
        
        dailyData[exitDateKey].realizedPnL += tradePnL
        dailyData[exitDateKey].totalPnL += tradePnL
        totalRealizedPnL += tradePnL
      }
    } else if (trade.side === 'sell') {
      // Closing or reducing position
      const closedQuantity = Math.min(trade.quantity, position.openQuantity)
      
      if (closedQuantity > 0 && position.openQuantity > 0) {
        const avgCost = position.totalCost / position.openQuantity
        tradePnL = (trade.entry_price * multiplier - avgCost) * closedQuantity
        
        position.openQuantity -= closedQuantity
        position.totalCost = position.openQuantity * avgCost
        
        dailyData[dateKey].realizedPnL += tradePnL
        dailyData[dateKey].totalPnL += tradePnL
        totalRealizedPnL += tradePnL
      }
    }
    
    // Add trade detail
    dailyData[dateKey].trades.push({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      entryPrice: trade.entry_price,
      exitPrice: trade.exit_price,
      pnl: tradePnL,
      status: trade.status || 'open',
      assetType: trade.asset_type
    })
    
    dailyData[dateKey].tradeCount++
  }
  
  // Calculate unrealized P&L for open positions
  // (This would need real-time prices in production)
  for (const [key, position] of positions) {
    if (position.openQuantity > 0) {
      // For now, we'll just track that there are open positions
      // In production, fetch current prices and calculate unrealized P&L
      totalUnrealizedPnL += 0 // Placeholder
    }
  }
  
  // Calculate statistics
  const dates = Object.keys(dailyData).sort()
  let bestDay = { date: "", pnl: -Infinity }
  let worstDay = { date: "", pnl: Infinity }
  let winningDays = 0
  let losingDays = 0
  
  for (const date of dates) {
    const dayPnL = dailyData[date].realizedPnL
    
    if (dayPnL > bestDay.pnl) {
      bestDay = { date, pnl: dayPnL }
    }
    if (dayPnL < worstDay.pnl) {
      worstDay = { date, pnl: dayPnL }
    }
    
    if (dayPnL > 0) winningDays++
    else if (dayPnL < 0) losingDays++
  }
  
  return {
    dailyData,
    minDate: dates[0] || new Date().toISOString().split('T')[0],
    maxDate: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
    totalRealizedPnL,
    totalUnrealizedPnL,
    bestDay: bestDay.pnl === -Infinity ? { date: "", pnl: 0 } : bestDay,
    worstDay: worstDay.pnl === Infinity ? { date: "", pnl: 0 } : worstDay,
    tradingDays: dates.length,
    winningDays,
    losingDays,
  }
}
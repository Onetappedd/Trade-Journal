import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface DashboardMetrics {
  totalPortfolioValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  totalPnL: number
  totalPnLPercent: number
  todayPnL: number
  todayPnLPercent: number
  weekPnL: number
  weekPnLPercent: number
  monthPnL: number
  monthPnLPercent: number
  winRate: number
  activePositions: number
  totalTrades: number
  openPositionValue: number
}

/**
 * Calculate comprehensive dashboard metrics from user trades
 */
export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  // Fetch all trades for the user
  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)

  if (error || !trades) {
    console.error("Error fetching trades for metrics:", error)
    return getDefaultMetrics()
  }

  console.log(`[Dashboard Metrics] Found ${trades.length} trades for user ${userId}`)

  // Separate open and closed trades
  const openTrades = trades.filter(t => t.status !== "closed" && t.status !== "expired")
  const closedTrades = trades.filter(t => t.status === "closed")
  
  // Initial capital (configurable)
  const INITIAL_CAPITAL = 10000

  // Calculate realized P&L from closed trades
  let totalRealizedPnL = 0
  let winningTrades = 0
  
  for (const trade of closedTrades) {
    if (trade.exit_price !== null && trade.exit_price !== undefined) {
      const pnl = calculateTradePnL(trade)
      totalRealizedPnL += pnl
      if (pnl > 0) winningTrades++
    }
  }

  // Calculate open position values
  let openPositionValue = 0
  let unrealizedPnL = 0
  
  for (const trade of openTrades) {
    const positionValue = calculatePositionValue(trade)
    openPositionValue += positionValue
    
    // For unrealized P&L, we'd need current market prices
    // For now, we'll estimate based on entry price
    // In production, integrate with a real-time price API
    const estimatedUnrealizedPnL = estimateUnrealizedPnL(trade)
    unrealizedPnL += estimatedUnrealizedPnL
  }

  // Total portfolio value = initial capital + realized P&L + open position value
  const totalPortfolioValue = INITIAL_CAPITAL + totalRealizedPnL + openPositionValue

  // Calculate period P&L
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  const todayPnL = calculatePeriodPnL(closedTrades, todayStart)
  const weekPnL = calculatePeriodPnL(closedTrades, weekAgo)
  const monthPnL = calculatePeriodPnL(closedTrades, monthAgo)

  // Calculate percentages
  const totalPnLPercent = (totalRealizedPnL / INITIAL_CAPITAL) * 100
  const unrealizedPnLPercent = openPositionValue > 0 ? (unrealizedPnL / openPositionValue) * 100 : 0
  const todayPnLPercent = totalPortfolioValue > 0 ? (todayPnL / totalPortfolioValue) * 100 : 0
  const weekPnLPercent = totalPortfolioValue > 0 ? (weekPnL / totalPortfolioValue) * 100 : 0
  const monthPnLPercent = totalPortfolioValue > 0 ? (monthPnL / totalPortfolioValue) * 100 : 0

  // Calculate win rate
  const winRate = closedTrades.length > 0 
    ? (winningTrades / closedTrades.length) * 100 
    : 0

  return {
    totalPortfolioValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    totalPnL: totalRealizedPnL,
    totalPnLPercent,
    todayPnL,
    todayPnLPercent,
    weekPnL,
    weekPnLPercent,
    monthPnL,
    monthPnLPercent,
    winRate,
    activePositions: openTrades.length,
    totalTrades: trades.length,
    openPositionValue,
  }
}

/**
 * Calculate P&L for a single trade
 */
function calculateTradePnL(trade: any): number {
  if (!trade.exit_price || trade.status !== "closed") return 0
  
  const multiplier = trade.asset_type === 'option' ? 100 : 1
  
  if (trade.side === 'buy') {
    return (trade.exit_price - trade.entry_price) * trade.quantity * multiplier
  } else {
    // Short position
    return (trade.entry_price - trade.exit_price) * trade.quantity * multiplier
  }
}

/**
 * Calculate the value of an open position
 */
function calculatePositionValue(trade: any): number {
  const multiplier = trade.asset_type === 'option' ? 100 : 1
  return trade.entry_price * trade.quantity * multiplier
}

/**
 * Estimate unrealized P&L (without real-time prices)
 * In production, this should fetch current market prices
 */
function estimateUnrealizedPnL(trade: any): number {
  // For now, return a small random variation to simulate market movement
  // In production, replace with actual current price fetching
  const multiplier = trade.asset_type === 'option' ? 100 : 1
  const randomVariation = (Math.random() - 0.5) * 0.1 // ±5% variation
  const estimatedCurrentPrice = trade.entry_price * (1 + randomVariation)
  
  if (trade.side === 'buy') {
    return (estimatedCurrentPrice - trade.entry_price) * trade.quantity * multiplier
  } else {
    return (trade.entry_price - estimatedCurrentPrice) * trade.quantity * multiplier
  }
}

/**
 * Calculate P&L for a specific period
 */
function calculatePeriodPnL(trades: any[], startDate: Date): number {
  return trades
    .filter(t => {
      if (!t.exit_date) return false
      const exitDate = new Date(t.exit_date)
      return exitDate >= startDate
    })
    .reduce((sum, t) => sum + calculateTradePnL(t), 0)
}

/**
 * Get default metrics when no data is available
 */
function getDefaultMetrics(): DashboardMetrics {
  return {
    totalPortfolioValue: 10000,
    unrealizedPnL: 0,
    unrealizedPnLPercent: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    todayPnL: 0,
    todayPnLPercent: 0,
    weekPnL: 0,
    weekPnLPercent: 0,
    monthPnL: 0,
    monthPnLPercent: 0,
    winRate: 0,
    activePositions: 0,
    totalTrades: 0,
    openPositionValue: 0,
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  const prefix = value >= 0 ? "+" : ""
  return `${prefix}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  const prefix = value >= 0 ? "+" : ""
  return `${prefix}${Math.abs(value).toFixed(2)}%`
}
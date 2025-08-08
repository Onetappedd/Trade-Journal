import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { calculatePositions } from "@/lib/position-tracker-server"

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

  // Use position tracker to calculate P&L (same as Trade History page)
  const { positions, closedTrades, stats } = calculatePositions(trades)
  
  console.log(`[Dashboard Metrics] Using position tracker:`)
  console.log(`[Dashboard Metrics] Total P&L: ${stats.totalPnL}`)
  console.log(`[Dashboard Metrics] Win Rate: ${stats.winRate}%`)
  console.log(`[Dashboard Metrics] Open Positions: ${stats.openPositions}`)
  
  // Get user's initial capital from settings
  const { data: settings } = await supabase
    .from("user_settings")
    .select("initial_capital")
    .eq("user_id", userId)
    .single()
  
  const INITIAL_CAPITAL = settings?.initial_capital || 10000
  console.log(`[Dashboard Metrics] Initial capital: ${INITIAL_CAPITAL}`)

  // Use stats from position tracker
  const totalRealizedPnL = stats.totalPnL
  const winningTrades = stats.winningTrades
  const losingTrades = stats.losingTrades
  const openPositionCount = stats.openPositions

  // Portfolio value = initial capital + realized P&L
  const totalPortfolioValue = INITIAL_CAPITAL + totalRealizedPnL
  
  // Unrealized P&L would need real-time prices
  const unrealizedPnL = 0 // Set to 0 until we have real-time prices
  const openPositionValue = 0 // Set to 0 until we have real-time prices

  // Calculate period P&L from closed trades
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  // Calculate period P&L using the closed trades with their P&L already calculated
  const todayPnL = closedTrades
    .filter(t => t.exit_date && new Date(t.exit_date) >= todayStart)
    .reduce((sum, t) => sum + t.pnl, 0)
    
  const weekPnL = closedTrades
    .filter(t => t.exit_date && new Date(t.exit_date) >= weekAgo)
    .reduce((sum, t) => sum + t.pnl, 0)
    
  const monthPnL = closedTrades
    .filter(t => t.exit_date && new Date(t.exit_date) >= monthAgo)
    .reduce((sum, t) => sum + t.pnl, 0)

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
    activePositions: openPositionCount,
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
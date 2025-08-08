import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { calculatePositions } from "@/lib/position-tracker-server"

// Get analytics data using position tracker for accurate P&L
export async function getAnalyticsData(userId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  // Fetch all trades
  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true })

  if (error || !trades) {
    console.error("Error fetching trades for analytics:", error)
    return getDefaultAnalytics()
  }

  // Get user's initial capital
  const { data: settings } = await supabase
    .from("user_settings")
    .select("initial_capital")
    .eq("user_id", userId)
    .single()
  
  const INITIAL_CAPITAL = settings?.initial_capital || 10000

  // Use position tracker to match buy/sell orders and calculate P&L
  const { positions, closedTrades, stats } = calculatePositions(trades)
  
  console.log(`[Analytics] Position tracker results:`)
  console.log(`[Analytics] Total trades: ${trades.length}`)
  console.log(`[Analytics] Closed trades: ${closedTrades.length}`)
  console.log(`[Analytics] Total P&L: $${stats.totalPnL.toFixed(2)}`)
  console.log(`[Analytics] Win rate: ${stats.winRate.toFixed(1)}%`)

  // Calculate P&L by month
  const pnlByMonth = calculatePnLByMonth(closedTrades)
  
  // Calculate equity curve (daily)
  const equityCurve = calculateEquityCurve(closedTrades, INITIAL_CAPITAL)
  
  // Trade distribution by asset type
  const tradeDistribution = calculateTradeDistribution(trades)
  
  // Strategy metrics
  const strategyMetrics = calculateStrategyMetrics(closedTrades, INITIAL_CAPITAL)
  
  // Best and worst trades
  const sortedClosedTrades = [...closedTrades].sort((a, b) => b.pnl - a.pnl)
  const bestTrades = sortedClosedTrades.slice(0, 3).map(formatTrade)
  const worstTrades = sortedClosedTrades.slice(-3).reverse().map(formatTrade)
  
  // Calculate wins and losses for the win rate chart
  const wins = closedTrades.filter(t => t.pnl > 0).length
  const losses = closedTrades.filter(t => t.pnl < 0).length
  
  return {
    pnlByMonth,
    equityCurve,
    tradeDistribution,
    strategyMetrics,
    bestTrades,
    worstTrades,
    winRate: stats.winRate,
    totalTrades: trades.length,
    totalPnL: stats.totalPnL,
    wins,
    losses,
    closedTrades,
    initialCapital: INITIAL_CAPITAL,
  }
}

// Calculate P&L by month for bar chart
function calculatePnLByMonth(closedTrades: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const currentYear = new Date().getFullYear()
  
  return months.map((month, index) => {
    const monthTrades = closedTrades.filter(t => {
      if (!t.exit_date) return false
      const date = new Date(t.exit_date)
      return date.getMonth() === index && date.getFullYear() === currentYear
    })
    
    const pnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0)
    
    return { month, pnl }
  })
}

// Calculate daily equity curve
function calculateEquityCurve(closedTrades: any[], initialCapital: number) {
  if (closedTrades.length === 0) {
    // Return flat line at initial capital if no trades
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const curve = []
    const current = new Date(thirtyDaysAgo)
    while (current <= today) {
      curve.push({
        date: current.toISOString().split('T')[0],
        value: initialCapital,
      })
      current.setDate(current.getDate() + 1)
    }
    return curve
  }
  
  // Sort trades by exit date
  const sortedTrades = [...closedTrades]
    .filter(t => t.exit_date)
    .sort((a, b) => new Date(a.exit_date).getTime() - new Date(b.exit_date).getTime())
  
  if (sortedTrades.length === 0) {
    return [{
      date: new Date().toISOString().split('T')[0],
      value: initialCapital,
    }]
  }
  
  // Generate daily equity points
  const startDate = new Date(sortedTrades[0].exit_date)
  startDate.setDate(startDate.getDate() - 30) // Start 30 days before first trade
  const endDate = new Date()
  
  const equityCurve = []
  let currentDate = new Date(startDate)
  let cumulativePnL = 0
  
  while (currentDate <= endDate) {
    // Calculate P&L up to this date
    const tradesUpToDate = sortedTrades.filter(t => 
      new Date(t.exit_date) <= currentDate
    )
    
    cumulativePnL = tradesUpToDate.reduce((sum, t) => sum + t.pnl, 0)
    
    equityCurve.push({
      date: currentDate.toISOString().split('T')[0],
      value: initialCapital + cumulativePnL,
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return equityCurve
}

// Calculate trade distribution
function calculateTradeDistribution(trades: any[]) {
  const distribution = trades.reduce((acc, trade) => {
    const type = trade.asset_type || "unknown"
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))
}

// Calculate strategy metrics
function calculateStrategyMetrics(closedTrades: any[], initialCapital: number) {
  if (closedTrades.length === 0) {
    return {
      expectancy: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgHoldTime: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
    }
  }
  
  const wins = closedTrades.filter(t => t.pnl > 0)
  const losses = closedTrades.filter(t => t.pnl < 0)
  
  // Expectancy
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0
  const winRate = closedTrades.length > 0 ? wins.length / closedTrades.length : 0
  const lossRate = 1 - winRate
  const expectancy = (avgWin * winRate) - (avgLoss * lossRate)
  
  // Sharpe Ratio (simplified)
  const returns = closedTrades.map(t => t.pnl / initialCapital) // Returns as percentage of capital
  const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0
  const variance = returns.length > 1 
    ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
    : 0
  const stdDev = Math.sqrt(variance)
  const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0 // Annualized
  
  // Max Drawdown
  let peak = initialCapital
  let maxDrawdown = 0
  let runningCapital = initialCapital
  
  // Sort trades by exit date for drawdown calculation
  const sortedTrades = [...closedTrades].sort((a, b) => 
    new Date(a.exit_date || a.entry_date).getTime() - new Date(b.exit_date || b.entry_date).getTime()
  )
  
  for (const trade of sortedTrades) {
    runningCapital += trade.pnl
    if (runningCapital > peak) {
      peak = runningCapital
    }
    const drawdown = peak - runningCapital
    const drawdownPercent = peak !== 0 ? (drawdown / peak) * 100 : 0
    if (drawdownPercent > maxDrawdown) {
      maxDrawdown = drawdownPercent
    }
  }
  
  // Average hold time (for closed trades, use the original trade data)
  // Since we're matching trades, we need to estimate hold time
  const avgHoldTime = 5 // Default to 5 days for now (can be calculated from original trades)
  
  // Profit Factor
  const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0)
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0))
  const profitFactor = totalLosses !== 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0
  
  // Largest win/loss
  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0
  
  return {
    expectancy,
    sharpeRatio,
    maxDrawdown,
    avgHoldTime,
    profitFactor: isFinite(profitFactor) ? profitFactor : 0,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
  }
}

// Format trade for display
function formatTrade(trade: any) {
  return {
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity,
    entry_price: trade.entry_price,
    exit_price: trade.exit_price || trade.entry_price,
    entry_date: trade.entry_date,
    exit_date: trade.exit_date || trade.entry_date,
    status: trade.status || 'closed',
    pnl: trade.pnl,
    asset_type: trade.asset_type,
  }
}

// Default analytics data
function getDefaultAnalytics() {
  return {
    pnlByMonth: [],
    equityCurve: [],
    tradeDistribution: [],
    strategyMetrics: {
      expectancy: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgHoldTime: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
    },
    bestTrades: [],
    worstTrades: [],
    winRate: 0,
    totalTrades: 0,
    totalPnL: 0,
    wins: 0,
    losses: 0,
    closedTrades: [],
    initialCapital: 10000,
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { marketDataService } from '@/lib/market-data'

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TradeAnalytics {
  totalTrades: number
  totalPnL: number
  realizedPnL: number
  unrealizedPnL: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
  monthlyReturns: Array<{
    month: string
    pnl: number
    trades: number
  }>
  performanceBySymbol: Array<{
    symbol: string
    trades: number
    pnl: number
    winRate: number
  }>
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all user trades
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: true })

    if (error) {
      throw error
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        totalTrades: 0,
        totalPnL: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        monthlyReturns: [],
        performanceBySymbol: []
      })
    }

    // Get current positions for unrealized P&L
    const positions = await marketDataService.getPortfolioPositions(user.id)
    const unrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)

    // Calculate realized P&L for closed trades
    const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.exit_price)
    const realizedTrades = closedTrades.map(trade => {
      const quantity = Number(trade.quantity) || 0
      const entryPrice = Number(trade.entry_price) || 0
      const exitPrice = Number(trade.exit_price) || 0
      const side = String(trade.side || 'buy').toLowerCase()
      const assetType = String(trade.asset_type || 'stock').toLowerCase()
      // Use stored multiplier if present; otherwise sensible defaults
      const storedMultiplier = (trade as any).multiplier
      const multiplier = storedMultiplier != null
        ? Number(storedMultiplier)
        : assetType === 'option'
          ? 100
          : assetType === 'futures'
            ? 1
            : 1

      let pnl = 0
      if (side === 'buy') {
        pnl = (exitPrice - entryPrice) * quantity * multiplier
      } else {
        pnl = (entryPrice - exitPrice) * quantity * multiplier
      }
      
      return {
        ...trade,
        pnl,
        isWin: pnl > 0
      }
    })

    const realizedPnL = realizedTrades.reduce((sum, trade) => sum + trade.pnl, 0)
    const totalPnL = realizedPnL + unrealizedPnL

    // Calculate win rate
    const winningTrades = realizedTrades.filter(trade => trade.isWin)
    const losingTrades = realizedTrades.filter(trade => !trade.isWin)
    const winRate = realizedTrades.length > 0 ? (winningTrades.length / realizedTrades.length) * 100 : 0

    // Calculate average win/loss
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length 
      : 0
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length)
      : 0

    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0)
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0

    // Calculate monthly returns
    const monthlyMap = new Map()
    realizedTrades.forEach(trade => {
      const month = trade.exit_date ? trade.exit_date.substring(0, 7) : trade.entry_date.substring(0, 7)
      const existing = monthlyMap.get(month) || { month, pnl: 0, trades: 0 }
      existing.pnl += trade.pnl
      existing.trades += 1
      monthlyMap.set(month, existing)
    })
    const monthlyReturns = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))

    // Calculate performance by symbol
    const symbolMap = new Map()
    realizedTrades.forEach(trade => {
      const existing = symbolMap.get(trade.symbol) || { 
        symbol: trade.symbol, 
        trades: 0, 
        pnl: 0, 
        wins: 0 
      }
      existing.trades += 1
      existing.pnl += trade.pnl
      if (trade.isWin) existing.wins += 1
      symbolMap.set(trade.symbol, existing)
    })
    const performanceBySymbol = Array.from(symbolMap.values()).map(item => ({
      ...item,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0
    })).sort((a, b) => b.pnl - a.pnl)

    // Calculate Sharpe ratio (simplified)
    const returns = monthlyReturns.map(m => m.pnl)
    const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0
    const variance = returns.length > 1 
      ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
      : 0
    const stdDev = Math.sqrt(variance)
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0

    // Calculate max drawdown (simplified)
    let peak = 0
    let maxDrawdown = 0
    let runningPnL = 0
    
    realizedTrades.forEach(trade => {
      runningPnL += trade.pnl
      if (runningPnL > peak) {
        peak = runningPnL
      }
      const drawdown = peak - runningPnL
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    })

    const analytics: TradeAnalytics = {
      totalTrades: trades.length,
      totalPnL,
      realizedPnL,
      unrealizedPnL,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      monthlyReturns,
      performanceBySymbol
    }

    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })
  } catch (error) {
    console.error('Error calculating portfolio analytics:', error)
    return NextResponse.json(
      { error: 'Failed to calculate portfolio analytics' },
      { status: 500 }
    )
  }
}
// Portfolio value calculation with real-time prices
import { createClient } from "@/lib/supabase"
import { getRealTimePrices } from "@/lib/prices"

export interface PortfolioPosition {
  symbol: string
  quantity: number
  entryPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  assetType: string
}

export interface PortfolioSummary {
  totalMarketValue: number
  totalCostBasis: number
  totalUnrealizedPnL: number
  totalUnrealizedPnLPercent: number
  positions: PortfolioPosition[]
  lastUpdated: string
  usingFallbackPrices: boolean
}

/**
 * Calculate real portfolio value using live market prices
 */
export async function calculateRealPortfolioValue(userId: string): Promise<PortfolioSummary> {
  const supabase = createClient()
  
  // Fetch all open positions for the user
  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .order("entry_date", { ascending: false })
  
  if (error || !trades || trades.length === 0) {
    return {
      totalMarketValue: 0,
      totalCostBasis: 0,
      totalUnrealizedPnL: 0,
      totalUnrealizedPnLPercent: 0,
      positions: [],
      lastUpdated: new Date().toISOString(),
      usingFallbackPrices: false
    }
  }
  
  // Group trades by symbol to calculate net positions
  const positionMap = new Map<string, {
    symbol: string
    totalQuantity: number
    totalCost: number
    trades: any[]
    assetType: string
  }>()
  
  for (const trade of trades) {
    const symbol = trade.symbol
    const existing = positionMap.get(symbol) || {
      symbol,
      totalQuantity: 0,
      totalCost: 0,
      trades: [],
      assetType: trade.asset_type || 'stock'
    }
    
    if (trade.side === 'buy') {
      existing.totalQuantity += trade.quantity
      existing.totalCost += trade.quantity * trade.entry_price
    } else if (trade.side === 'sell') {
      // For open sell positions (short positions)
      existing.totalQuantity -= trade.quantity
      existing.totalCost -= trade.quantity * trade.entry_price
    }
    
    existing.trades.push(trade)
    positionMap.set(symbol, existing)
  }
  
  // Filter out positions with zero quantity
  const activePositions = Array.from(positionMap.values()).filter(p => p.totalQuantity !== 0)
  
  // Get unique symbols for price fetching
  const symbols = activePositions.map(p => p.symbol)
  
  // Fetch real-time prices
  let realTimePrices: Record<string, number> = {}
  let usingFallbackPrices = false
  
  try {
    realTimePrices = await getRealTimePrices(symbols)
  } catch (error) {
    console.error("Failed to fetch real-time prices:", error)
    usingFallbackPrices = true
  }
  
  // Calculate portfolio positions
  const positions: PortfolioPosition[] = []
  let totalMarketValue = 0
  let totalCostBasis = 0
  
  for (const position of activePositions) {
    // Use real-time price if available, otherwise use average entry price as fallback
    const currentPrice = realTimePrices[position.symbol] || 
                        (position.totalCost / Math.abs(position.totalQuantity))
    
    // For options, multiply by 100 (contract multiplier)
    const multiplier = position.assetType === 'option' ? 100 : 1
    const adjustedQuantity = position.totalQuantity * multiplier
    const adjustedCost = position.totalCost * multiplier
    
    const marketValue = Math.abs(adjustedQuantity) * currentPrice
    const avgEntryPrice = adjustedCost / adjustedQuantity
    
    // Calculate unrealized P&L
    let unrealizedPnL: number
    let unrealizedPnLPercent: number
    
    if (position.totalQuantity > 0) {
      // Long position
      unrealizedPnL = marketValue - adjustedCost
      unrealizedPnLPercent = (unrealizedPnL / adjustedCost) * 100
    } else {
      // Short position
      unrealizedPnL = adjustedCost - marketValue
      unrealizedPnLPercent = (unrealizedPnL / Math.abs(adjustedCost)) * 100
    }
    
    positions.push({
      symbol: position.symbol,
      quantity: adjustedQuantity,
      entryPrice: avgEntryPrice,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      assetType: position.assetType
    })
    
    totalMarketValue += marketValue
    totalCostBasis += Math.abs(adjustedCost)
  }
  
  // Calculate total unrealized P&L
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0)
  const totalUnrealizedPnLPercent = totalCostBasis > 0 
    ? (totalUnrealizedPnL / totalCostBasis) * 100 
    : 0
  
  return {
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    positions,
    lastUpdated: new Date().toISOString(),
    usingFallbackPrices: usingFallbackPrices || 
                         symbols.some(s => !realTimePrices[s])
  }
}

/**
 * Get portfolio value with caching (for dashboard display)
 */
let portfolioCache: { data: PortfolioSummary; timestamp: number } | null = null
const PORTFOLIO_CACHE_DURATION = 30 * 1000 // 30 seconds

export async function getCachedPortfolioValue(userId: string): Promise<PortfolioSummary> {
  const now = Date.now()
  
  // Return cached value if still fresh
  if (portfolioCache && now - portfolioCache.timestamp < PORTFOLIO_CACHE_DURATION) {
    return portfolioCache.data
  }
  
  // Fetch fresh data
  const portfolioData = await calculateRealPortfolioValue(userId)
  
  // Update cache
  portfolioCache = {
    data: portfolioData,
    timestamp: now
  }
  
  return portfolioData
}
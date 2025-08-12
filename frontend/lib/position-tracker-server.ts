// Server-side position tracking logic (handles long and short, with multipliers)

export interface Trade {
  id: string
  symbol: string
  underlying?: string
  side: string // 'buy' | 'sell'
  quantity: number
  entry_price: number
  entry_date: string
  exit_price?: number | null
  exit_date?: string | null
  status?: string
  asset_type: string // 'stock' | 'option' | 'futures' | 'crypto' | 'forex'
  option_type?: string
  strike_price?: number
  expiration_date?: string
  multiplier?: number | null
}

export interface Position {
  symbol: string
  underlying?: string
  quantity: number // signed: >0 long, <0 short
  avgEntryPrice: number
  totalCost: number // abs(quantity) * avgEntryPrice
  trades: Trade[]
  closedPnL: number
  openQuantity: number // signed: >0 long, <0 short
  option_type?: string
  strike_price?: number
  expiration_date?: string
}

// Match trades to calculate positions and P&L
export function calculatePositions(trades: Trade[]): {
  positions: Position[]
  closedTrades: Array<Trade & { pnl: number }>
  stats: {
    totalPnL: number
    winRate: number
    totalTrades: number
    winningTrades: number
    losingTrades: number
    avgWin: number
    avgLoss: number
    bestTrade: number
    worstTrade: number
    openPositions: number
  }
} {
  // Group by unique key (include option details to separate chains)
  const positionMap = new Map<string, Position>()
  const closedTrades: Array<Trade & { pnl: number }> = []

  // Sort chronologically
  const sortedTrades = [...trades].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())

  for (const trade of sortedTrades) {
    const key = trade.asset_type === 'option'
      ? `${trade.underlying || trade.symbol}_${trade.option_type}_${trade.strike_price}_${trade.expiration_date}`
      : trade.symbol

    let position = positionMap.get(key)

    if (!position) {
      position = {
        symbol: trade.symbol,
        underlying: trade.underlying,
        quantity: 0,
        avgEntryPrice: 0,
        totalCost: 0,
        trades: [],
        closedPnL: 0,
        openQuantity: 0,
        option_type: trade.option_type,
        strike_price: trade.strike_price,
        expiration_date: trade.expiration_date,
      }
      positionMap.set(key, position)
    }

    position.trades.push(trade)

    const side = String(trade.side || '').toLowerCase()
    const qty = Number(trade.quantity) || 0
    const price = Number(trade.entry_price) || 0

    const multiplier = trade.multiplier != null
      ? Number(trade.multiplier)
      : trade.asset_type === 'option'
        ? 100
        : trade.asset_type === 'futures'
          ? 1
          : 1

    // Helper to record a closed portion
    const recordClose = (closeQty: number, pnl: number, exitPrice: number, exitDate: string) => {
      if (closeQty <= 0) return
      position!.closedPnL += pnl
      closedTrades.push({
        ...trade,
        pnl,
        exit_price: exitPrice,
        exit_date: exitDate,
        status: 'closed',
      })
    }

    // Update average entry given existing signed quantity and an additional leg
    const updateAverage = (currentQty: number, currentAvg: number, addQty: number, addPrice: number) => {
      // currentQty and addQty have the same sign when adding to existing position direction
      const totalQty = Math.abs(currentQty) + Math.abs(addQty)
      if (totalQty === 0) return 0
      const weighted = (Math.abs(currentQty) * currentAvg) + (Math.abs(addQty) * addPrice)
      return weighted / totalQty
    }

    // Long/short handling
    if (side === 'buy') {
      if (position.openQuantity < 0) {
        // Closing short position (buy to cover)
        const closeQty = Math.min(qty, Math.abs(position.openQuantity))
        const pnl = (position.avgEntryPrice - price) * closeQty * multiplier // short profit if exit lower
        recordClose(closeQty, pnl, price, trade.entry_date)
        position.openQuantity += closeQty // less negative towards zero
        position.quantity = position.openQuantity
        // Adjust totalCost for remaining short
        if (position.openQuantity < 0) {
          position.totalCost = Math.abs(position.openQuantity) * position.avgEntryPrice
        } else {
          position.totalCost = 0
          position.avgEntryPrice = 0
        }
        // If buy exceeds short size, leftover becomes new long
        const leftover = qty - closeQty
        if (leftover > 0) {
          position.openQuantity += leftover // from 0 to +leftover
          position.quantity = position.openQuantity
          position.avgEntryPrice = price
          position.totalCost = position.avgEntryPrice * Math.abs(position.openQuantity)
        }
      } else {
        // Adding to/starting long
        const newOpen = position.openQuantity + qty
        position.avgEntryPrice = updateAverage(position.openQuantity, position.avgEntryPrice, qty, price)
        position.openQuantity = newOpen
        position.quantity = newOpen
        position.totalCost = position.avgEntryPrice * Math.abs(position.openQuantity)
      }
    } else if (side === 'sell') {
      if (position.openQuantity > 0) {
        // Closing long position (sell to close)
        const closeQty = Math.min(qty, position.openQuantity)
        const pnl = (price - position.avgEntryPrice) * closeQty * multiplier // long profit if exit higher
        recordClose(closeQty, pnl, price, trade.entry_date)
        position.openQuantity -= closeQty
        position.quantity = position.openQuantity
        if (position.openQuantity > 0) {
          position.totalCost = position.avgEntryPrice * Math.abs(position.openQuantity)
        } else {
          position.totalCost = 0
          position.avgEntryPrice = 0
        }
        // If sell exceeds long size, leftover becomes new short
        const leftover = qty - closeQty
        if (leftover > 0) {
          position.openQuantity -= leftover // from 0 to -leftover
          position.quantity = position.openQuantity
          position.avgEntryPrice = price
          position.totalCost = position.avgEntryPrice * Math.abs(position.openQuantity)
        }
      } else {
        // Adding to/starting short
        const newOpen = position.openQuantity - qty // more negative
        // For shorts, avg entry computed with absolute quantities
        position.avgEntryPrice = updateAverage(position.openQuantity, position.avgEntryPrice, -qty, price)
        position.openQuantity = newOpen
        position.quantity = newOpen
        position.totalCost = position.avgEntryPrice * Math.abs(position.openQuantity)
      }
    }
  }

  const openPositions = Array.from(positionMap.values()).filter(p => p.openQuantity !== 0).length

  const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0)
  const winningTrades = closedTrades.filter(t => t.pnl > 0)
  const losingTrades = closedTrades.filter(t => t.pnl < 0)

  const stats = {
    totalPnL,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgWin: winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + t.pnl, 0) / winningTrades.length : 0,
    avgLoss: losingTrades.length > 0 ? Math.abs(losingTrades.reduce((s, t) => s + t.pnl, 0) / losingTrades.length) : 0,
    bestTrade: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
    worstTrade: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0,
    openPositions,
  }

  return {
    positions: Array.from(positionMap.values()),
    closedTrades,
    stats,
  }
}

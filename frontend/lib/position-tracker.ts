// Position tracking logic for matching buy and sell orders

export interface Trade {
  id: string
  symbol: string
  underlying?: string
  side: string
  quantity: number
  entry_price: number
  entry_date: string
  exit_price?: number | null
  exit_date?: string | null
  status?: string
  asset_type: string
  option_type?: string
  strike_price?: number
  expiration_date?: string
}

export interface Position {
  symbol: string
  underlying?: string
  quantity: number
  avgEntryPrice: number
  totalCost: number
  trades: Trade[]
  closedPnL: number
  openQuantity: number
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
  }
} {
  // Group trades by symbol and option details
  const positionMap = new Map<string, Position>()
  const closedTrades: Array<Trade & { pnl: number }> = []
  
  // Sort trades by date to process in chronological order
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  )

  for (const trade of sortedTrades) {
    // Create a unique key for the position (symbol + option details if applicable)
    const positionKey = trade.asset_type === 'option' 
      ? `${trade.underlying || trade.symbol}_${trade.option_type}_${trade.strike_price}_${trade.expiration_date}`
      : trade.symbol

    let position = positionMap.get(positionKey)
    
    if (!position) {
      // Create new position
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
      positionMap.set(positionKey, position)
    }

    position.trades.push(trade)

    if (trade.side === 'buy') {
      // Opening or adding to position
      const newTotalCost = position.totalCost + (trade.quantity * trade.entry_price)
      const newQuantity = position.openQuantity + trade.quantity
      
      position.avgEntryPrice = newQuantity > 0 ? newTotalCost / newQuantity : 0
      position.totalCost = newTotalCost
      position.openQuantity = newQuantity
      position.quantity = newQuantity
    } else if (trade.side === 'sell') {
      // Closing or reducing position
      const closedQuantity = Math.min(trade.quantity, position.openQuantity)
      
      if (closedQuantity > 0) {
        // Calculate P&L for the closed portion
        // For options, multiply by 100 (contract multiplier)
        const multiplier = trade.asset_type === 'option' ? 100 : 1
        const pnl = (trade.entry_price - position.avgEntryPrice) * closedQuantity * multiplier
        
        position.closedPnL += pnl
        position.openQuantity -= closedQuantity
        
        // Adjust total cost for remaining position
        if (position.openQuantity > 0) {
          position.totalCost = position.avgEntryPrice * position.openQuantity
        } else {
          position.totalCost = 0
        }
        
        // Record this as a closed trade with P&L
        closedTrades.push({
          ...trade,
          pnl,
          exit_price: trade.entry_price, // For sells, entry_price is actually the exit price
          exit_date: trade.entry_date,
          status: 'closed'
        })
      }
    }
  }

  // Calculate statistics
  const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0)
  const winningTrades = closedTrades.filter(t => t.pnl > 0)
  const losingTrades = closedTrades.filter(t => t.pnl < 0)
  
  const stats = {
    totalPnL,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgWin: winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
      : 0,
    avgLoss: losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0,
    bestTrade: winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.pnl))
      : 0,
    worstTrade: losingTrades.length > 0 
      ? Math.min(...losingTrades.map(t => t.pnl))
      : 0,
  }

  return {
    positions: Array.from(positionMap.values()),
    closedTrades,
    stats
  }
}
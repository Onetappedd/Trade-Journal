// Position tracking logic for matching buy and sell orders

export interface Trade {
  id: string;
  symbol: string;
  underlying?: string;
  instrument_type: string;
  qty_opened: number;
  qty_closed: number | null;
  avg_open_price: number;
  avg_close_price: number | null;
  opened_at: string;
  closed_at: string | null;
  status: string;
  fees: number | null;
  realized_pnl: number | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  group_key: string;
  ingestion_run_id: string | null;
  row_hash: string | null;
  legs: any | null;
  option_type?: string;
  strike_price?: number;
  expiration_date?: string;
}

export interface Position {
  symbol: string;
  underlying?: string;
  quantity: number;
  avgEntryPrice: number;
  totalCost: number;
  trades: Trade[];
  closedPnL: number;
  openQuantity: number;
  option_type?: string;
  strike_price?: number;
  expiration_date?: string;
}

// Match trades to calculate positions and P&L
export function calculatePositions(trades: Trade[]): {
  positions: Position[];
  closedTrades: Array<Trade & { pnl: number }>;
  stats: {
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgWin: number;
    avgLoss: number;
    bestTrade: number;
    worstTrade: number;
  };
} {
  // Group trades by symbol and option details
  const positionMap = new Map<string, Position>();
  const closedTrades: Array<Trade & { pnl: number }> = [];

  // Sort trades by date to process in chronological order
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime(),
  );

  for (const trade of sortedTrades) {
    // Create a unique key for the position (symbol + option details if applicable)
    const positionKey =
      trade.instrument_type === 'option'
        ? `${trade.underlying || trade.symbol}_${trade.option_type}_${trade.strike_price}_${trade.expiration_date}`
        : trade.symbol;

    let position = positionMap.get(positionKey);

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
      };
      positionMap.set(positionKey, position);
    }

    position.trades.push(trade);

    if (trade.qty_opened > 0) {
      // Opening or adding to position
      const newTotalCost = position.totalCost + trade.qty_opened * trade.avg_open_price;
      const newQuantity = position.openQuantity + trade.qty_opened;

      position.avgEntryPrice = newQuantity > 0 ? newTotalCost / newQuantity : 0;
      position.totalCost = newTotalCost;
      position.openQuantity = newQuantity;
      position.quantity = newQuantity;
    }
    
    if (trade.qty_closed && trade.qty_closed > 0) {
      // Closing or reducing position
      const closedQuantity = Math.min(trade.qty_closed, position.openQuantity);

      if (closedQuantity > 0) {
        // Calculate P&L for the closed portion
        // For options, multiply by 100 (contract multiplier)
        const multiplier = trade.instrument_type === 'option' ? 100 : 1;
        const pnl = (trade.avg_close_price! - position.avgEntryPrice) * closedQuantity * multiplier;

        position.closedPnL += pnl;
        position.openQuantity -= closedQuantity;

        // Adjust total cost for remaining position
        if (position.openQuantity > 0) {
          position.totalCost = position.avgEntryPrice * position.openQuantity;
        } else {
          position.totalCost = 0;
        }

        // Record this as a closed trade with P&L
        closedTrades.push({
          ...trade,
          pnl,
        });
      }
    }
  }

  // Calculate statistics
  const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winningTrades = closedTrades.filter((t) => t.pnl > 0);
  const losingTrades = closedTrades.filter((t) => t.pnl < 0);

  const stats = {
    totalPnL,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgWin:
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
        : 0,
    avgLoss:
      losingTrades.length > 0
        ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
        : 0,
    bestTrade: winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.pnl)) : 0,
    worstTrade: losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.pnl)) : 0,
  };

  return {
    positions: Array.from(positionMap.values()),
    closedTrades,
    stats,
  };
}

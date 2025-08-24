import { TradeRow } from '@/types/trade';

export interface TradeGroup {
  symbol: string;
  asset_type: string;
  strike_price?: number | null;
  expiration_date?: string | null;
  option_type?: string | null;
  underlying?: string | null;
  trades: TradeRow[];
  totalQuantity: number;
  remainingQuantity: number;
  averageEntryPrice: number;
  averageExitPrice: number | null;
  totalFees: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  status: 'Open' | 'Closed' | 'Partial';
}

// Futures point values for common contracts
const FUTURES_POINT_VALUES: Record<string, number> = {
  ES: 50, MES: 5,
  NQ: 20, MNQ: 2,
  YM: 5, MYM: 0.5,
  RTY: 50, M2K: 5,
  CL: 1000, MCL: 100,
  GC: 100, MGC: 10,
  SI: 5000, SIL: 1000,
};

function getFuturesPointValue(symbol: string): number {
  const key = Object.keys(FUTURES_POINT_VALUES).find(k => 
    symbol.toUpperCase().startsWith(k)
  );
  return key ? FUTURES_POINT_VALUES[key] : 1;
}

function calculatePnLForTrade(trade: TradeRow): number {
  if (!trade.entry_price || !trade.exit_price) return 0;
  
  const quantity = trade.quantity;
  const entryPrice = trade.entry_price;
  const exitPrice = trade.exit_price;
  const fees = trade.fees || 0;
  
  let pnl = 0;
  
  switch (trade.asset_type) {
    case 'option':
      const multiplier = trade.multiplier || 100;
      if (trade.side === 'buy') {
        pnl = (exitPrice - entryPrice) * quantity * multiplier - fees;
      } else {
        pnl = (entryPrice - exitPrice) * quantity * multiplier - fees;
      }
      break;
      
    case 'futures':
      const pointValue = getFuturesPointValue(trade.symbol);
      if (trade.side === 'buy') {
        pnl = (exitPrice - entryPrice) * quantity * pointValue - fees;
      } else {
        pnl = (entryPrice - exitPrice) * quantity * pointValue - fees;
      }
      break;
      
    case 'stock':
    case 'crypto':
    default:
      if (trade.side === 'buy') {
        pnl = (exitPrice - entryPrice) * quantity - fees;
      } else {
        pnl = (entryPrice - exitPrice) * quantity - fees;
      }
      break;
  }
  
  return pnl;
}

function groupTradesByPosition(trades: TradeRow[]): TradeGroup[] {
  const groups = new Map<string, TradeRow[]>();
  
  // Group trades by position key
  trades.forEach(trade => {
    let key = trade.symbol;
    
    // For options, include strike, expiration, and option type in the key
    if (trade.asset_type === 'option') {
      key = `${trade.underlying || trade.symbol}_${trade.strike_price}_${trade.expiration_date}_${trade.option_type}`;
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(trade);
  });
  
  // Calculate position metrics for each group
  return Array.from(groups.entries()).map(([key, groupTrades]) => {
    const sortedTrades = groupTrades.sort((a, b) => 
      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    );
    
    let totalQuantity = 0;
    let totalEntryValue = 0;
    let totalExitValue = 0;
    let totalFees = 0;
    let realizedPnL = 0;
    
    // Calculate position metrics using FIFO logic
    sortedTrades.forEach(trade => {
      const quantity = trade.quantity;
      const fees = trade.fees || 0;
      totalFees += fees;
      
      if (trade.side === 'buy') {
        totalQuantity += quantity;
        totalEntryValue += (trade.entry_price || 0) * quantity;
      } else {
        // Sell trade - reduce position using FIFO
        const sellQuantity = Math.min(quantity, totalQuantity);
        if (sellQuantity > 0) {
          const avgEntryPrice = totalEntryValue / totalQuantity;
          const exitPrice = trade.exit_price || 0;
          totalExitValue += exitPrice * sellQuantity;
          
          // Calculate P&L based on asset type
          let tradePnL = 0;
          const assetType = sortedTrades[0].asset_type;
          
          if (assetType === 'option') {
            const multiplier = sortedTrades[0].multiplier || 100;
            tradePnL = (exitPrice - avgEntryPrice) * sellQuantity * multiplier - fees;
          } else if (assetType === 'futures') {
            const pointValue = getFuturesPointValue(sortedTrades[0].symbol);
            tradePnL = (exitPrice - avgEntryPrice) * sellQuantity * pointValue - fees;
          } else {
            tradePnL = (exitPrice - avgEntryPrice) * sellQuantity - fees;
          }
          
          realizedPnL += tradePnL;
          totalQuantity -= sellQuantity;
          totalEntryValue -= avgEntryPrice * sellQuantity;
        }
      }
    });
    
    const averageEntryPrice = totalQuantity > 0 ? totalEntryValue / totalQuantity : 0;
    
    // Calculate average exit price for closed positions
    let averageExitPrice: number | null = null;
    if (totalQuantity === 0 && totalExitValue > 0) {
      // For closed positions, calculate the total quantity sold
      const totalSoldQuantity = sortedTrades
        .filter(t => t.side === 'sell')
        .reduce((sum, t) => sum + t.quantity, 0);
      averageExitPrice = totalSoldQuantity > 0 ? totalExitValue / totalSoldQuantity : null;
    }
    
    // Determine status
    let status: 'Open' | 'Closed' | 'Partial' = 'Open';
    if (totalQuantity === 0) {
      status = 'Closed';
    } else if (totalQuantity < sortedTrades.reduce((sum, t) => sum + (t.side === 'buy' ? t.quantity : 0), 0)) {
      status = 'Partial';
    }
    
    // For unrealized P&L, we'd need current market prices
    // For now, we'll use the last known price or 0
    const unrealizedPnL = 0; // TODO: Implement with real-time prices
    
    return {
      symbol: sortedTrades[0].symbol,
      asset_type: sortedTrades[0].asset_type,
      strike_price: sortedTrades[0].strike_price,
      expiration_date: sortedTrades[0].expiration_date,
      option_type: sortedTrades[0].option_type,
      underlying: sortedTrades[0].underlying,
      trades: sortedTrades,
      totalQuantity,
      remainingQuantity: totalQuantity,
      averageEntryPrice,
      averageExitPrice,
      totalFees,
      realizedPnL,
      unrealizedPnL,
      totalPnL: realizedPnL + unrealizedPnL,
      status,
    };
  });
}

export function calculateTradeMetrics(trades: TradeRow[]): {
  individualTrades: TradeRow[];
  positions: TradeGroup[];
  summary: {
    totalTrades: number;
    openPositions: number;
    closedPositions: number;
    totalRealizedPnL: number;
    totalUnrealizedPnL: number;
    totalPnL: number;
  };
} {
  // Calculate P&L for individual trades
  const individualTrades = trades.map(trade => ({
    ...trade,
    pnl: trade.exit_price ? calculatePnLForTrade(trade) : null,
  }));
  
  // Group into positions
  const positions = groupTradesByPosition(individualTrades);
  
  // Calculate summary
  const summary = {
    totalTrades: individualTrades.length,
    openPositions: positions.filter(p => p.status === 'Open').length,
    closedPositions: positions.filter(p => p.status === 'Closed').length,
    totalRealizedPnL: positions.reduce((sum, p) => sum + p.realizedPnL, 0),
    totalUnrealizedPnL: positions.reduce((sum, p) => sum + p.unrealizedPnL, 0),
    totalPnL: positions.reduce((sum, p) => sum + p.totalPnL, 0),
  };
  
  return {
    individualTrades,
    positions,
    summary,
  };
}

export function getTradeStatus(trade: TradeRow): 'Open' | 'Closed' | 'Partial' {
  if (trade.exit_price && trade.exit_date) {
    return 'Closed';
  }
  return 'Open';
}

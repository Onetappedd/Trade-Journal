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
  if (!trade.avg_open_price || !trade.avg_close_price) return 0;
  
  const quantity = trade.qty_opened;
  const entryPrice = trade.avg_open_price;
  const exitPrice = trade.avg_close_price;
  const fees = trade.fees || 0;
  
  let pnl = 0;
  
  switch (trade.instrument_type) {
    case 'option':
      const multiplier = 100; // Default option multiplier
      // For options, assume positive quantity is buy, negative is sell
      if (quantity > 0) {
        pnl = (exitPrice - entryPrice) * quantity * multiplier - fees;
      } else {
        pnl = (entryPrice - exitPrice) * Math.abs(quantity) * multiplier - fees;
      }
      break;
      
    case 'futures':
      const pointValue = getFuturesPointValue(trade.symbol);
      if (quantity > 0) {
        pnl = (exitPrice - entryPrice) * quantity * pointValue - fees;
      } else {
        pnl = (entryPrice - exitPrice) * Math.abs(quantity) * pointValue - fees;
      }
      break;
      
    case 'stock':
    case 'crypto':
    default:
      if (quantity > 0) {
        pnl = (exitPrice - entryPrice) * quantity - fees;
      } else {
        pnl = (entryPrice - exitPrice) * Math.abs(quantity) - fees;
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
    
    // For options, use symbol as key (strike/expiration info not available in current schema)
    if (trade.instrument_type === 'option') {
      key = `${trade.symbol}_option`;
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(trade);
  });
  
  // Calculate position metrics for each group
  return Array.from(groups.entries()).map(([key, groupTrades]) => {
    const sortedTrades = groupTrades.sort((a, b) => 
      new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime()
    );
    
    let totalQuantity = 0;
    let totalEntryValue = 0;
    let totalExitValue = 0;
    let totalFees = 0;
    let realizedPnL = 0;
    
    // Calculate position metrics using FIFO logic
    sortedTrades.forEach(trade => {
      const quantity = trade.qty_opened;
      const fees = trade.fees || 0;
      totalFees += fees;
      
      if (quantity > 0) {
        totalQuantity += quantity;
        totalEntryValue += (trade.avg_open_price || 0) * quantity;
      } else {
        // Sell trade - reduce position using FIFO
        const sellQuantity = Math.min(Math.abs(quantity), totalQuantity);
        if (sellQuantity > 0) {
          const avgEntryPrice = totalEntryValue / totalQuantity;
          const exitPrice = trade.avg_close_price || 0;
          totalExitValue += exitPrice * sellQuantity;
          
          // Calculate P&L based on asset type
          let tradePnL = 0;
          const assetType = sortedTrades[0].instrument_type;
          
          if (assetType === 'option') {
            const multiplier = 100; // Default option multiplier
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
        .filter(t => t.qty_opened < 0)
        .reduce((sum, t) => sum + Math.abs(t.qty_opened), 0);
      averageExitPrice = totalSoldQuantity > 0 ? totalExitValue / totalSoldQuantity : null;
    }
    
    // Determine status
    let status: 'Open' | 'Closed' | 'Partial' = 'Open';
    if (totalQuantity === 0) {
      status = 'Closed';
    } else if (totalQuantity < sortedTrades.reduce((sum, t) => sum + (t.qty_opened > 0 ? t.qty_opened : 0), 0)) {
      status = 'Partial';
    }
    
    // For unrealized P&L, we'd need current market prices
    // For now, we'll use the last known price or 0
    const unrealizedPnL = 0; // TODO: Implement with real-time prices
    
    return {
      symbol: sortedTrades[0].symbol,
      asset_type: sortedTrades[0].instrument_type,
      strike_price: null, // Not available in current schema
      expiration_date: null, // Not available in current schema
      option_type: null, // Not available in current schema
      underlying: sortedTrades[0].symbol, // Use symbol as underlying for now
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
    pnl: trade.avg_close_price ? calculatePnLForTrade(trade) : null,
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
  if (trade.avg_close_price && trade.closed_at) {
    return 'Closed';
  }
  return 'Open';
}

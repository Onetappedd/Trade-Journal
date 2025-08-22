// Calendar metrics for P&L heatmap
import { createClient } from '@/lib/supabase';
import { calculatePositions } from '@/lib/position-tracker';

export interface DailyPnL {
  date: string;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  tradeCount: number;
  trades: TradeDetail[];
}

export interface TradeDetail {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl: number;
  status: string;
  assetType: string;
}

export interface CalendarData {
  dailyData: Record<string, DailyPnL>;
  minDate: string;
  maxDate: string;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  tradingDays: number;
  winningDays: number;
  losingDays: number;
}

/**
 * Get trades grouped by day with P&L calculations
 */
export async function getUserTradesGroupedByDay(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<CalendarData> {
  const supabase = createClient();

  // Build query
  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true });

  // Add date filters if provided
  if (startDate) {
    query = query.gte('entry_date', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('entry_date', endDate.toISOString());
  }

  const { data: trades, error } = await query;

  console.log(`Fetching trades for user ${userId}:`, trades?.length || 0, 'trades found');

  if (error || !trades) {
    console.error('Error fetching trades:', error);
    return {
      dailyData: {},
      minDate: new Date().toISOString(),
      maxDate: new Date().toISOString(),
      totalRealizedPnL: 0,
      totalUnrealizedPnL: 0,
      bestDay: { date: '', pnl: 0 },
      worstDay: { date: '', pnl: 0 },
      tradingDays: 0,
      winningDays: 0,
      losingDays: 0,
    };
  }

  // Group trades by symbol for position tracking
  const positions = new Map<
    string,
    {
      openQuantity: number;
      totalCost: number;
      trades: any[];
    }
  >();

  // Track daily P&L
  const dailyData: Record<string, DailyPnL> = {};
  let totalRealizedPnL = 0;
  let totalUnrealizedPnL = 0;

  // Process trades - group by EXIT date for closed trades
  console.log(`[Calendar] Processing ${trades.length} trades for P&L calculation`);

  for (const trade of trades) {
    // For closed trades, use exit date; for open trades, use entry date
    const dateKey =
      trade.status === 'closed' && trade.exit_date
        ? trade.exit_date.split('T')[0]
        : trade.entry_date.split('T')[0];

    // Initialize daily data if not exists
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        realizedPnL: 0,
        unrealizedPnL: 0,
        totalPnL: 0,
        tradeCount: 0,
        trades: [],
      };
    }

    // Calculate P&L for closed trades
    let tradePnL = 0;

    // For options, the multiplier is 100 (each contract represents 100 shares)
    // IMPORTANT: Check if prices are already per contract or per share
    const isOption = trade.asset_type === 'option' || trade.asset_type === 'Option';
    const multiplier = isOption ? 100 : 1;

    if (trade.status === 'closed' && trade.exit_price !== null && trade.exit_price !== undefined) {
      // Log the trade details for debugging
      console.log(`[Calendar] Processing closed ${trade.asset_type} trade:`, {
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entry: trade.entry_price,
        exit: trade.exit_price,
        multiplier: multiplier,
      });

      // Calculate realized P&L
      // For options, prices are typically quoted per share, so we multiply by 100
      if (trade.side === 'buy' || trade.side === 'Buy' || trade.side === 'BUY') {
        // Long position: profit when exit > entry
        tradePnL = (trade.exit_price - trade.entry_price) * trade.quantity * multiplier;
      } else if (trade.side === 'sell' || trade.side === 'Sell' || trade.side === 'SELL') {
        // Short position: profit when exit < entry
        tradePnL = (trade.entry_price - trade.exit_price) * trade.quantity * multiplier;
      }

      console.log(`[Calendar] Calculated P&L for ${trade.symbol}: ${tradePnL.toFixed(2)}`);

      dailyData[dateKey].realizedPnL += tradePnL;
      dailyData[dateKey].totalPnL += tradePnL;
      totalRealizedPnL += tradePnL;

      // Add trade detail
      dailyData[dateKey].trades.push({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        pnl: tradePnL,
        status: trade.status || 'closed',
        assetType: trade.asset_type,
      });

      dailyData[dateKey].tradeCount++;
    } else if (
      trade.status === 'open' ||
      trade.status === null ||
      trade.status === undefined ||
      trade.status === ''
    ) {
      // Track open trades (no P&L yet)
      console.log(`[Calendar] Skipping open trade: ${trade.symbol} (no exit price)`);

      dailyData[dateKey].trades.push({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        pnl: 0,
        status: 'open',
        assetType: trade.asset_type,
      });

      dailyData[dateKey].tradeCount++;
    }
  }

  console.log(`[Calendar] Total Realized P&L calculated: ${totalRealizedPnL.toFixed(2)}`);
  console.log(`[Calendar] Daily data entries: ${Object.keys(dailyData).length}`);

  // Calculate unrealized P&L for open positions
  // (This would need real-time prices in production)
  for (const [key, position] of positions) {
    if (position.openQuantity > 0) {
      // For now, we'll just track that there are open positions
      // In production, fetch current prices and calculate unrealized P&L
      totalUnrealizedPnL += 0; // Placeholder
    }
  }

  // Calculate statistics
  const dates = Object.keys(dailyData).sort();
  let bestDay = { date: '', pnl: -Infinity };
  let worstDay = { date: '', pnl: Infinity };
  let winningDays = 0;
  let losingDays = 0;

  for (const date of dates) {
    const dayPnL = dailyData[date].realizedPnL;

    if (dayPnL > bestDay.pnl) {
      bestDay = { date, pnl: dayPnL };
    }
    if (dayPnL < worstDay.pnl) {
      worstDay = { date, pnl: dayPnL };
    }

    if (dayPnL > 0) winningDays++;
    else if (dayPnL < 0) losingDays++;
  }

  return {
    dailyData,
    minDate: dates[0] || new Date().toISOString().split('T')[0],
    maxDate: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
    totalRealizedPnL,
    totalUnrealizedPnL,
    bestDay: bestDay.pnl === -Infinity ? { date: '', pnl: 0 } : bestDay,
    worstDay: worstDay.pnl === Infinity ? { date: '', pnl: 0 } : worstDay,
    tradingDays: dates.length,
    winningDays,
    losingDays,
  };
}

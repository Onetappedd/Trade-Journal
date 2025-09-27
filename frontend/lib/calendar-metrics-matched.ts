// Calendar metrics using position tracker for matched trades
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
 * Get trades grouped by day using position matching (buy/sell pairing)
 */
export async function getUserTradesGroupedByDay(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<CalendarData> {
  const supabase = createSupabaseClient();

  // Fetch ALL trades for the user
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true });

  console.log(
    `[Calendar Matched] Fetching trades for user ${userId}:`,
    trades?.length || 0,
    'trades found',
  );

  if (error || !trades) {
    console.error('[Calendar Matched] Error fetching trades:', error);
    return {
      dailyData: {},
      minDate: new Date().toISOString().split('T')[0],
      maxDate: new Date().toISOString().split('T')[0],
      totalRealizedPnL: 0,
      totalUnrealizedPnL: 0,
      bestDay: { date: '', pnl: 0 },
      worstDay: { date: '', pnl: 0 },
      tradingDays: 0,
      winningDays: 0,
      losingDays: 0,
    };
  }

  // Use position tracker to match buy/sell orders
  const { positions, closedTrades, stats } = calculatePositions(trades);

  console.log(`[Calendar Matched] Position tracker results:`);
  console.log(`[Calendar Matched] - Closed trades: ${closedTrades.length}`);
  console.log(`[Calendar Matched] - Total P&L: $${stats.totalPnL.toFixed(2)}`);
  console.log(
    `[Calendar Matched] - Open positions: ${positions.filter((p) => p.openQuantity > 0).length}`,
  );

  // Track daily P&L
  const dailyData: Record<string, DailyPnL> = {};
  let totalRealizedPnL = 0;

  // Process closed trades (these have calculated P&L from position matching)
  for (const trade of closedTrades) {
    // Use closed_at if available, otherwise use opened_at
    const dateKey = (trade.closed_at || trade.opened_at).split('T')[0];

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

    // Add the P&L (already calculated by position tracker)
    dailyData[dateKey].realizedPnL += trade.pnl;
    dailyData[dateKey].totalPnL += trade.pnl;
    totalRealizedPnL += trade.pnl;

    // Add trade detail
    dailyData[dateKey].trades.push({
      id: trade.id,
      symbol: trade.symbol,
      side: 'closed', // Simplified since we don't have side field
      quantity: trade.qty_closed || trade.qty_opened,
      entryPrice: trade.avg_open_price,
      exitPrice: trade.avg_close_price || trade.avg_open_price,
      pnl: trade.pnl,
      status: 'closed',
      assetType: trade.instrument_type,
    });

    dailyData[dateKey].tradeCount++;

    console.log(
      `[Calendar Matched] ${dateKey}: ${trade.symbol} closed - P&L: $${trade.pnl.toFixed(2)}`,
    );
  }

  // Add open positions (no P&L yet)
  for (const position of positions) {
    if (position.openQuantity > 0) {
      // Find the most recent trade date for this position
      const lastTrade = position.trades[position.trades.length - 1];
      const dateKey = lastTrade.opened_at.split('T')[0];

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

      // Add as open position (no P&L)
      dailyData[dateKey].trades.push({
        id: lastTrade.id,
        symbol: position.symbol,
        side: 'open',
        quantity: position.openQuantity,
        entryPrice: position.avgEntryPrice,
        exitPrice: undefined,
        pnl: 0,
        status: 'open',
        assetType: lastTrade.instrument_type,
      });
    }
  }

  console.log(`[Calendar Matched] Total Realized P&L: $${totalRealizedPnL.toFixed(2)}`);
  console.log(`[Calendar Matched] Daily data entries: ${Object.keys(dailyData).length}`);

  // Calculate statistics
  const dates = Object.keys(dailyData).sort();
  let bestDay = { date: '', pnl: -Infinity };
  let worstDay = { date: '', pnl: Infinity };
  let winningDays = 0;
  let losingDays = 0;

  for (const date of dates) {
    const dayPnL = dailyData[date].realizedPnL;

    // Only count days with actual P&L (not just open positions)
    if (dayPnL !== 0) {
      if (dayPnL > bestDay.pnl) {
        bestDay = { date, pnl: dayPnL };
      }
      if (dayPnL < worstDay.pnl) {
        worstDay = { date, pnl: dayPnL };
      }

      if (dayPnL > 0) winningDays++;
      else if (dayPnL < 0) losingDays++;
    }
  }

  // Filter dates if provided
  let filteredDailyData = dailyData;
  if (startDate || endDate) {
    filteredDailyData = {};
    for (const [date, data] of Object.entries(dailyData)) {
      const dateObj = new Date(date);
      if ((!startDate || dateObj >= startDate) && (!endDate || dateObj <= endDate)) {
        filteredDailyData[date] = data;
      }
    }
  }

  return {
    dailyData: filteredDailyData,
    minDate: dates[0] || new Date().toISOString().split('T')[0],
    maxDate: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
    totalRealizedPnL,
    totalUnrealizedPnL: 0, // Would need real-time prices
    bestDay: bestDay.pnl === -Infinity ? { date: '', pnl: 0 } : bestDay,
    worstDay: worstDay.pnl === Infinity ? { date: '', pnl: 0 } : worstDay,
    tradingDays: winningDays + losingDays, // Only count days with P&L
    winningDays,
    losingDays,
  };
}

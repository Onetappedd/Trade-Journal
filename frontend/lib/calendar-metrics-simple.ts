// Simplified calendar metrics for P&L heatmap
import { createClient } from '@/lib/supabase';

/**
 * Simple and direct approach to get trades grouped by exit date with P&L
 */
export async function getSimplifiedCalendarData(userId: string) {
  const supabase = createSupabaseClient();

  // Fetch ALL trades for the user
  const { data: trades, error } = await supabase.from('trades').select('*').eq('user_id', userId);

  console.log(`[Calendar] Fetching trades for user ${userId}`);
  console.log(`[Calendar] Found ${trades?.length || 0} total trades`);

  if (error) {
    console.error('[Calendar] Error fetching trades:', error);
    return null;
  }

  if (!trades || trades.length === 0) {
    console.log('[Calendar] No trades found for user');
    return {
      dailyPnL: {},
      totalPnL: 0,
      tradingDays: 0,
    };
  }

  // Group trades by exit date and calculate P&L
  const dailyPnL: Record<string, number> = {};
  let totalPnL = 0;
  let closedTradesCount = 0;

  for (const trade of trades) {
    // Only process closed trades with exit data
    if (
      (trade as any).status === 'closed' &&
      (trade as any).exit_date &&
      (trade as any).exit_price !== null &&
      (trade as any).exit_price !== undefined
    ) {
      closedTradesCount++;

      // Use exit date as the key
      const dateKey = (trade as any).exit_date.split('T')[0];

      // Check if it's an option
      const isOption = (trade as any).asset_type === 'option' || (trade as any).asset_type === 'Option';

      // For options: 1 contract = 100 shares
      // Prices are typically per share, so multiply by 100
      const multiplier = isOption ? 100 : 1;

      let pnl = 0;

      // Handle different case variations of side
      const side = (trade as any).side?.toLowerCase();

      if (side === 'buy') {
        // Long position: profit when price goes up
        pnl = ((trade as any).exit_price - (trade as any).entry_price) * (trade as any).quantity * multiplier;
      } else if (side === 'sell') {
        // Short position: profit when price goes down
        pnl = ((trade as any).entry_price - (trade as any).exit_price) * (trade as any).quantity * multiplier;
      }

      // Add to daily total
      dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + pnl;
      totalPnL += pnl;

      console.log(`[Calendar] ${isOption ? 'Option' : 'Stock'} Trade:`, {
        symbol: (trade as any).symbol,
        date: dateKey,
        side: (trade as any).side,
        quantity: (trade as any).quantity,
        entry: (trade as any).entry_price,
        exit: (trade as any).exit_price,
        multiplier: multiplier,
        pnl: pnl.toFixed(2),
      });
    } else {
      // Log why trade was skipped
      if ((trade as any).status !== 'closed') {
        console.log(
          `[Calendar] Skipping ${(trade as any).symbol}: status is '${(trade as any).status}' (not closed)`,
        );
      } else if (!(trade as any).exit_date) {
        console.log(`[Calendar] Skipping ${(trade as any).symbol}: no exit date`);
      } else if ((trade as any).exit_price === null || (trade as any).exit_price === undefined) {
        console.log(`[Calendar] Skipping ${(trade as any).symbol}: no exit price`);
      }
    }
  }

  console.log(`[Calendar] Processed ${closedTradesCount} closed trades`);
  console.log(`[Calendar] Total P&L: $${totalPnL.toFixed(2)}`);
  console.log(`[Calendar] Trading days: ${Object.keys(dailyPnL).length}`);

  return {
    dailyPnL,
    totalPnL,
    tradingDays: Object.keys(dailyPnL).length,
    closedTradesCount,
  };
}

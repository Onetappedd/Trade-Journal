/**
 * Trade Statistics and R-Multiple Calculation
 * 
 * Computes per-trade R-multiples and summary statistics for Monte Carlo simulation.
 * 
 * R-Multiple Definition:
 * Since we don't have an explicit risk_amount field, we approximate R as:
 *   R = realized_pnl / avg_abs_loss
 * 
 * Where avg_abs_loss is the average absolute value of losing trades.
 * This ensures:
 * - Winners have positive R (e.g., +0.8R, +2.3R)
 * - Losers have negative R (e.g., -1.0R, -1.8R)
 * - R represents how many "risk units" the trade made/lost
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type TradeR = {
  tradeId: string;
  date: string;
  r: number;
  pnl: number;
};

export interface TradeStats {
  sampleSize: number;
  winRate: number;          // 0–1
  avgWinR: number;          // mean R for R > 0
  avgLossR: number;         // mean R for R < 0 (negative)
  rValues: TradeR[];        // full list for bootstrapping (ordered oldest → newest)
  sampleSizeTooSmall: boolean; // true if < 20 trades
  avgAbsLoss: number;       // average absolute loss (used as risk unit)
}

const MIN_TRADES_FOR_SIMULATION = 20;

/**
 * Calculate R-multiple for a single trade
 * R = realized_pnl / risk_unit
 * 
 * If risk_unit is not provided, we'll calculate it from avg_abs_loss
 */
function calculateR(pnl: number, riskUnit: number): number {
  if (riskUnit === 0) return 0;
  return pnl / riskUnit;
}

/**
 * Get user's trade statistics and R-multiples for Monte Carlo simulation
 * 
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID
 * @param maxTrades - Maximum number of trades to analyze (default: 100)
 * @returns TradeStats object with R-multiples and summary statistics
 */
export async function getUserTradeStats(
  supabase: SupabaseClient,
  userId: string,
  maxTrades: number = 100
): Promise<TradeStats> {
  // Fetch the user's most recent closed trades
  const { data: trades, error } = await supabase
    .from('trades')
    .select('id, realized_pnl, closed_at, opened_at')
    .eq('user_id', userId)
    .eq('status', 'closed')
    .not('realized_pnl', 'is', null)
    .order('closed_at', { ascending: false, nullsFirst: false })
    .limit(maxTrades);

  if (error) {
    console.error('Error fetching trades for stats:', error);
    throw error;
  }

  if (!trades || trades.length === 0) {
    return {
      sampleSize: 0,
      winRate: 0,
      avgWinR: 0,
      avgLossR: 0,
      rValues: [],
      sampleSizeTooSmall: true,
      avgAbsLoss: 0,
    };
  }

  // Parse P&L values (PostgreSQL NUMERIC can return as string)
  const tradesWithPnL = trades.map(t => ({
    id: t.id,
    pnl: typeof t.realized_pnl === 'string' 
      ? parseFloat(t.realized_pnl) 
      : (t.realized_pnl ?? 0),
    date: t.closed_at || t.opened_at || new Date().toISOString(),
  })).filter(t => !isNaN(t.pnl));

  if (tradesWithPnL.length === 0) {
    return {
      sampleSize: 0,
      winRate: 0,
      avgWinR: 0,
      avgLossR: 0,
      rValues: [],
      sampleSizeTooSmall: true,
      avgAbsLoss: 0,
    };
  }

  // Separate winners and losers
  const winners = tradesWithPnL.filter(t => t.pnl > 0);
  const losers = tradesWithPnL.filter(t => t.pnl < 0);

  // Calculate average absolute loss (this becomes our risk unit)
  const avgAbsLoss = losers.length > 0
    ? Math.abs(losers.reduce((sum, t) => sum + t.pnl, 0) / losers.length)
    : Math.abs(tradesWithPnL.reduce((sum, t) => sum + Math.min(0, t.pnl), 0) / tradesWithPnL.length) || 1;

  // If we still don't have a risk unit, use a fallback based on average trade size
  const fallbackRiskUnit = Math.abs(
    tradesWithPnL.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / tradesWithPnL.length
  ) * 0.1; // Assume 10% of average trade size as risk

  const riskUnit = avgAbsLoss > 0 ? avgAbsLoss : fallbackRiskUnit;

  // Calculate R-multiples for all trades
  const rValues: TradeR[] = tradesWithPnL
    .map(t => ({
      tradeId: t.id,
      date: t.date,
      r: calculateR(t.pnl, riskUnit),
      pnl: t.pnl,
    }))
    // Sort oldest → newest for clarity (bootstrapping can sample in any order)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate win rate
  const winRate = tradesWithPnL.length > 0 ? winners.length / tradesWithPnL.length : 0;

  // Calculate average R for winners and losers
  const avgWinR = winners.length > 0
    ? winners.reduce((sum, t) => sum + calculateR(t.pnl, riskUnit), 0) / winners.length
    : 0;

  const avgLossR = losers.length > 0
    ? losers.reduce((sum, t) => sum + calculateR(t.pnl, riskUnit), 0) / losers.length
    : 0;

  return {
    sampleSize: tradesWithPnL.length,
    winRate,
    avgWinR,
    avgLossR,
    rValues,
    sampleSizeTooSmall: tradesWithPnL.length < MIN_TRADES_FOR_SIMULATION,
    avgAbsLoss: riskUnit,
  };
}


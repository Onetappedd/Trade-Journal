import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculatePositions } from '@/lib/position-tracker-server';

export interface PortfolioDataPoint {
  date: string;
  value: number;
  percentChange: number;
  dollarChange: number;
}

/**
 * Calculate portfolio value history from user trades using position tracker
 * This creates a time series of portfolio values based on matched trades
 */
export async function calculatePortfolioHistory(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<PortfolioDataPoint[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  // Fetch all user trades
  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true });

  if (startDate) {
    query = query.gte('entry_date', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('entry_date', endDate.toISOString());
  }

  const { data: trades, error } = await query;

  if (error || !trades || trades.length === 0) {
    console.error('Error fetching trades for portfolio history:', error);
    return generateDefaultData();
  }

  // Get user's initial capital from settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('initial_capital')
    .eq('user_id', userId)
    .single();

  const INITIAL_CAPITAL = settings?.initial_capital || 10000;

  // Use position tracker to calculate P&L
  const { closedTrades, stats } = calculatePositions(trades);

  console.log(`[Portfolio History] Initial capital: ${INITIAL_CAPITAL}`);
  console.log(`[Portfolio History] Total P&L from position tracker: ${stats.totalPnL.toFixed(2)}`);
  console.log(`[Portfolio History] Closed trades: ${closedTrades.length}`);
  console.log(
    `[Portfolio History] Current portfolio value: ${(INITIAL_CAPITAL + stats.totalPnL).toFixed(2)}`,
  );

  // Group closed trades by exit date
  const dailyPnL = new Map<string, number>();

  for (const trade of closedTrades) {
    if (trade.exit_date) {
      const exitDate = trade.exit_date.split('T')[0];
      const currentPnL = dailyPnL.get(exitDate) || 0;
      dailyPnL.set(exitDate, currentPnL + trade.pnl);
    }
  }

  // Generate continuous time series
  const dataPoints: PortfolioDataPoint[] = [];
  const dates = Array.from(dailyPnL.keys()).sort();

  if (dates.length === 0) {
    // No closed trades yet, show flat line at initial capital
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const currentDate = new Date(thirtyDaysAgo);
    while (currentDate <= today) {
      dataPoints.push({
        date: currentDate.toISOString().split('T')[0],
        value: INITIAL_CAPITAL,
        dollarChange: 0,
        percentChange: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dataPoints;
  }

  // Determine date range
  const firstDate = new Date(dates[0]);
  firstDate.setDate(firstDate.getDate() - 30); // Start 30 days before first trade
  const lastDate = endDate || new Date();
  const currentDate = new Date(firstDate);

  let cumulativeValue = INITIAL_CAPITAL;
  let cumulativePnL = 0;

  // Generate daily data points
  while (currentDate <= lastDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayPnL = dailyPnL.get(dateStr) || 0;

    cumulativePnL += dayPnL;
    cumulativeValue = INITIAL_CAPITAL + cumulativePnL;

    dataPoints.push({
      date: dateStr,
      value: cumulativeValue,
      dollarChange: cumulativePnL,
      percentChange: (cumulativePnL / INITIAL_CAPITAL) * 100,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Make sure we have at least 30 data points for better visualization
  if (dataPoints.length < 30) {
    const additionalDays = 30 - dataPoints.length;
    const earliestDate = new Date(dataPoints[0].date);

    for (let i = additionalDays; i > 0; i--) {
      const date = new Date(earliestDate);
      date.setDate(date.getDate() - i);

      dataPoints.unshift({
        date: date.toISOString().split('T')[0],
        value: INITIAL_CAPITAL,
        dollarChange: 0,
        percentChange: 0,
      });
    }
  }

  console.log(`[Portfolio History] Generated ${dataPoints.length} data points`);
  console.log(`[Portfolio History] Final value: ${dataPoints[dataPoints.length - 1]?.value}`);

  return dataPoints;
}

/**
 * Generate default data when no trades exist
 */
function generateDefaultData(): PortfolioDataPoint[] {
  const INITIAL_CAPITAL = 10000;
  const dataPoints: PortfolioDataPoint[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1); // Last 30 days

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dataPoints.push({
      date: currentDate.toISOString().split('T')[0],
      value: INITIAL_CAPITAL,
      dollarChange: 0,
      percentChange: 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dataPoints;
}

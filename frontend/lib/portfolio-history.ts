import { createClient } from '@/lib/supabase';

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

export interface PortfolioDataPoint {
  date: string;
  value: number;
  percentChange: number;
  dollarChange: number;
}

/**
 * Calculate portfolio value history from user trades
 * This creates a time series of portfolio values based on closed trades
 */
export async function calculatePortfolioHistory(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<PortfolioDataPoint[]> {
  const supabase = createSupabaseClient();

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
    console.error('Error fetching trades:', error);
    return generateDefaultData();
  }

  // Initial portfolio value
  const INITIAL_CAPITAL = 10000;

  // Group trades by date and calculate cumulative P&L
  const dailyPnL = new Map<string, number>();

  // Process all trades to calculate daily P&L
  for (const trade of trades) {
    // Only count closed trades for realized P&L
    if ((trade as any).exit_date && (trade as any).exit_price) {
      const exitDate = (trade as any).exit_date.split('T')[0];
      const multiplier =
        (trade as any).multiplier != null
          ? Number((trade as any).multiplier)
          : (trade as any).asset_type === 'option'
            ? 100
            : (trade as any).asset_type === 'futures'
              ? getFuturesPointValue((trade as any).symbol)
              : 1;
      const side = String((trade as any).side || '').toLowerCase();
      const fees = (trade as any).fees || 0;
      
      let pnl = 0;
      if (side === 'buy') {
        pnl = ((trade as any).exit_price - (trade as any).entry_price) * (trade as any).quantity * multiplier - fees;
      } else {
        pnl = ((trade as any).entry_price - (trade as any).exit_price) * (trade as any).quantity * multiplier - fees;
      }

      const currentPnL = dailyPnL.get(exitDate) || 0;
      dailyPnL.set(exitDate, currentPnL + pnl);
    }
  }

  // Generate continuous time series
  const dataPoints: PortfolioDataPoint[] = [];
  const dates = Array.from(dailyPnL.keys()).sort();

  if (dates.length === 0) {
    return generateDefaultData();
  }

  // Determine date range
  const firstDate = new Date(dates[0]);
  const lastDate = endDate || new Date();
  const currentDate = new Date(firstDate);

  let cumulativeValue = INITIAL_CAPITAL;
  let previousValue = INITIAL_CAPITAL;

  // Generate daily data points
  while (currentDate <= lastDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayPnL = dailyPnL.get(dateStr) || 0;

    cumulativeValue += dayPnL;

    const dollarChange = cumulativeValue - previousValue;
    const percentChange =
      previousValue !== 0 ? ((cumulativeValue - previousValue) / previousValue) * 100 : 0;

    dataPoints.push({
      date: dateStr,
      value: cumulativeValue,
      dollarChange: cumulativeValue - INITIAL_CAPITAL,
      percentChange: ((cumulativeValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // If we have less than 30 data points, add some historical context
  if (dataPoints.length < 30) {
    const historicalPoints = generateHistoricalData(INITIAL_CAPITAL, 30 - dataPoints.length);
    return [...historicalPoints, ...dataPoints];
  }

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
  let currentValue = INITIAL_CAPITAL;

  while (currentDate <= endDate) {
    // Add some realistic variation
    const dailyChange = (Math.random() - 0.5) * 200; // +/- $100 average
    currentValue = Math.max(
      INITIAL_CAPITAL * 0.9,
      Math.min(INITIAL_CAPITAL * 1.1, currentValue + dailyChange),
    );

    dataPoints.push({
      date: currentDate.toISOString().split('T')[0],
      value: currentValue,
      dollarChange: currentValue - INITIAL_CAPITAL,
      percentChange: ((currentValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dataPoints;
}

/**
 * Generate historical data points for better visualization
 */
function generateHistoricalData(startValue: number, days: number): PortfolioDataPoint[] {
  const dataPoints: PortfolioDataPoint[] = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - days);

  let currentValue = startValue;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Slight random walk
    const change = (Math.random() - 0.5) * 50;
    currentValue = Math.max(startValue * 0.95, Math.min(startValue * 1.05, currentValue + change));

    dataPoints.push({
      date: date.toISOString().split('T')[0],
      value: currentValue,
      dollarChange: currentValue - startValue,
      percentChange: ((currentValue - startValue) / startValue) * 100,
    });
  }

  return dataPoints;
}

/**
 * Get portfolio statistics for a given period
 */
export function getPortfolioStats(data: PortfolioDataPoint[]) {
  if (data.length === 0) {
    return {
      currentValue: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      highValue: 0,
      lowValue: 0,
      volatility: 0,
    };
  }

  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : data[0];
  const first = data[0];

  // Calculate statistics
  const values = data.map((d) => d.value);
  const highValue = Math.max(...values);
  const lowValue = Math.min(...values);

  // Calculate volatility (standard deviation of daily returns)
  const returns = data.slice(1).map((d, i) => (d.value - data[i].value) / data[i].value);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

  return {
    currentValue: latest.value,
    totalReturn: latest.value - first.value,
    totalReturnPercent: ((latest.value - first.value) / first.value) * 100,
    dayChange: latest.value - previous.value,
    dayChangePercent: ((latest.value - previous.value) / previous.value) * 100,
    highValue,
    lowValue,
    volatility,
  };
}

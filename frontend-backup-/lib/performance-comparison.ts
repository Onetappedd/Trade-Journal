// Performance comparison utilities
import { createClient } from '@/lib/supabase';

export interface PerformanceData {
  date: string;
  value: number;
  percentChange: number;
}

export interface PeriodPerformance {
  period: string;
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  absoluteReturn: number;
  percentReturn: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  averageTrade: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio?: number;
  maxDrawdown: number;
}

export interface BenchmarkComparison {
  userPerformance: number;
  benchmarkPerformance: number;
  alpha: number; // Excess return over benchmark
  correlation?: number;
  beta?: number; // Volatility relative to benchmark
}

export interface StrategyPerformance {
  strategy: string;
  totalPnL: number;
  winRate: number;
  tradeCount: number;
  averagePnL: number;
  bestTrade: number;
  worstTrade: number;
}

// Fetch SPY/QQQ benchmark data (using Yahoo Finance API)
async function fetchBenchmarkData(
  symbol: string,
  startDate: Date,
  endDate: Date,
): Promise<PerformanceData[]> {
  try {
    // Convert dates to Unix timestamps
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);

    // Yahoo Finance API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${symbol} data`);
      return [];
    }

    const data = await response.json();
    const quotes = data.chart?.result?.[0];

    if (!quotes) return [];

    const timestamps = quotes.timestamp || [];
    const closes = quotes.indicators?.quote?.[0]?.close || [];

    const performanceData: PerformanceData[] = [];
    let previousClose = closes[0];

    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null) {
        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
        const percentChange = previousClose
          ? ((closes[i] - previousClose) / previousClose) * 100
          : 0;

        performanceData.push({
          date,
          value: closes[i],
          percentChange,
        });

        previousClose = closes[i];
      }
    }

    return performanceData;
  } catch (error) {
    console.error(`Error fetching benchmark data for ${symbol}:`, error);
    return [];
  }
}

// Calculate user's performance over time
export async function calculateUserPerformance(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<PerformanceData[]> {
  const supabase = createClient();

  // Fetch trades within date range
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate.toISOString())
    .lte('entry_date', endDate.toISOString())
    .order('entry_date', { ascending: true });

  if (error || !trades) return [];

  // Calculate cumulative P&L by date
  const dailyPnL: Record<string, number> = {};
  let cumulativePnL = 0;
  const performanceData: PerformanceData[] = [];

  // Group trades by date and calculate daily P&L
  for (const trade of trades) {
    const dateKey = (trade as any).entry_date.split('T')[0];

    // Calculate P&L for closed trades
    if ((trade as any).exit_price && (trade as any).exit_date) {
      const exitDateKey = (trade as any).exit_date.split('T')[0];
      const multiplier = (trade as any).asset_type === 'option' ? 100 : 1;
      const pnl =
        ((trade as any).exit_price - (trade as any).entry_price) *
        (trade as any).quantity *
        multiplier *
        ((trade as any).side === 'buy' ? 1 : -1);

      dailyPnL[exitDateKey] = (dailyPnL[exitDateKey] || 0) + pnl;
    }
  }

  // Generate performance data
  const dates = Object.keys(dailyPnL).sort();
  let previousValue = 10000; // Starting capital assumption

  for (const date of dates) {
    cumulativePnL += dailyPnL[date];
    const currentValue = previousValue + dailyPnL[date];
    const percentChange = (dailyPnL[date] / previousValue) * 100;

    performanceData.push({
      date,
      value: currentValue,
      percentChange,
    });

    previousValue = currentValue;
  }

  return performanceData;
}

// Calculate performance for different time periods
export async function calculatePeriodPerformance(
  userId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  date: Date = new Date(),
): Promise<PeriodPerformance> {
  const supabase = createClient();

  // Calculate date range based on period
  const endDate = new Date(date);
  const startDate = new Date(date);

  switch (period) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarterly':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  // Fetch trades for the period
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate.toISOString())
    .lte('entry_date', endDate.toISOString());

  if (error || !trades) {
    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startValue: 0,
      endValue: 0,
      absoluteReturn: 0,
      percentReturn: 0,
      winRate: 0,
      totalTrades: 0,
      profitableTrades: 0,
      averageTrade: 0,
      bestTrade: 0,
      worstTrade: 0,
      maxDrawdown: 0,
    };
  }

  // Calculate metrics
  let totalPnL = 0;
  let winningTrades = 0;
  let bestTrade = -Infinity;
  let worstTrade = Infinity;
  const tradePnLs: number[] = [];

  for (const trade of trades) {
    if ((trade as any).exit_price && (trade as any).exit_date) {
      const multiplier = (trade as any).asset_type === 'option' ? 100 : 1;
      const pnl =
        ((trade as any).exit_price - (trade as any).entry_price) *
        (trade as any).quantity *
        multiplier *
        ((trade as any).side === 'buy' ? 1 : -1);

      totalPnL += pnl;
      tradePnLs.push(pnl);

      if (pnl > 0) winningTrades++;
      if (pnl > bestTrade) bestTrade = pnl;
      if (pnl < worstTrade) worstTrade = pnl;
    }
  }

  // Calculate max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningTotal = 0;

  for (const pnl of tradePnLs) {
    runningTotal += pnl;
    if (runningTotal > peak) peak = runningTotal;
    const drawdown = peak - runningTotal;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const startValue = 10000; // Assumed starting capital
  const endValue = startValue + totalPnL;

  return {
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startValue,
    endValue,
    absoluteReturn: totalPnL,
    percentReturn: (totalPnL / startValue) * 100,
    winRate: trades.length > 0 ? (winningTrades / trades.length) * 100 : 0,
    totalTrades: trades.length,
    profitableTrades: winningTrades,
    averageTrade: trades.length > 0 ? totalPnL / trades.length : 0,
    bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
    worstTrade: worstTrade === Infinity ? 0 : worstTrade,
    maxDrawdown,
  };
}

// Compare user performance against benchmark
export async function compareToBenchmark(
  userId: string,
  benchmark: 'SPY' | 'QQQ',
  startDate: Date,
  endDate: Date,
): Promise<BenchmarkComparison> {
  // Fetch user performance
  const userPerf = await calculateUserPerformance(userId, startDate, endDate);

  // Fetch benchmark performance
  const benchmarkPerf = await fetchBenchmarkData(benchmark, startDate, endDate);

  if (userPerf.length === 0 || benchmarkPerf.length === 0) {
    return {
      userPerformance: 0,
      benchmarkPerformance: 0,
      alpha: 0,
    };
  }

  // Calculate returns
  const userReturn =
    userPerf.length > 0
      ? ((userPerf[userPerf.length - 1].value - userPerf[0].value) / userPerf[0].value) * 100
      : 0;

  const benchmarkReturn =
    benchmarkPerf.length > 0
      ? ((benchmarkPerf[benchmarkPerf.length - 1].value - benchmarkPerf[0].value) /
          benchmarkPerf[0].value) *
        100
      : 0;

  return {
    userPerformance: userReturn,
    benchmarkPerformance: benchmarkReturn,
    alpha: userReturn - benchmarkReturn,
  };
}

// Compare performance by strategy
export async function compareStrategies(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<StrategyPerformance[]> {
  const supabase = createClient();

  let query = supabase.from('trades').select('*').eq('user_id', userId);

  if (startDate) {
    query = query.gte('entry_date', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('entry_date', endDate.toISOString());
  }

  const { data: trades, error } = await query;

  if (error || !trades) return [];

  // Group trades by strategy (using notes field or asset type as proxy)
  const strategyMap = new Map<
    string,
    {
      totalPnL: number;
      trades: number;
      wins: number;
      bestTrade: number;
      worstTrade: number;
    }
  >();

  for (const trade of trades) {
    // Use asset_type as strategy proxy (can be enhanced with actual strategy field)
    const strategy = (trade as any).asset_type || 'unknown';

    if (!strategyMap.has(strategy)) {
      strategyMap.set(strategy, {
        totalPnL: 0,
        trades: 0,
        wins: 0,
        bestTrade: -Infinity,
        worstTrade: Infinity,
      });
    }

    const stats = strategyMap.get(strategy)!;

    if ((trade as any).exit_price && (trade as any).exit_date) {
      const multiplier = (trade as any).asset_type === 'option' ? 100 : 1;
      const pnl =
        ((trade as any).exit_price - (trade as any).entry_price) *
        (trade as any).quantity *
        multiplier *
        ((trade as any).side === 'buy' ? 1 : -1);

      stats.totalPnL += pnl;
      stats.trades++;
      if (pnl > 0) stats.wins++;
      if (pnl > stats.bestTrade) stats.bestTrade = pnl;
      if (pnl < stats.worstTrade) stats.worstTrade = pnl;
    }
  }

  // Convert to array
  const strategies: StrategyPerformance[] = [];

  for (const [strategy, stats] of strategyMap) {
    strategies.push({
      strategy,
      totalPnL: stats.totalPnL,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
      tradeCount: stats.trades,
      averagePnL: stats.trades > 0 ? stats.totalPnL / stats.trades : 0,
      bestTrade: stats.bestTrade === -Infinity ? 0 : stats.bestTrade,
      worstTrade: stats.worstTrade === Infinity ? 0 : stats.worstTrade,
    });
  }

  return strategies.sort((a, b) => b.totalPnL - a.totalPnL);
}

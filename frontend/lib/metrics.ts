import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Trade schema for validation
const TradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  quantity: z.number(),
  entry_price: z.number(),
  entry_date: z.string(),
  exit_price: z.number().nullable().optional(),
  exit_date: z.string().nullable().optional(),
  status: z.string().optional(),
  asset_type: z.string(),
  broker: z.string(),
  underlying: z.string().nullable().optional(),
  option_type: z.string().nullable().optional(),
  strike_price: z.number().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
});

type Trade = z.infer<typeof TradeSchema>;

// Calculate P&L for a trade
function calculatePnL(trade: Trade): number {
  if (!trade.exit_price || trade.status !== 'closed') return 0;

  const multiplier = trade.asset_type === 'option' ? 100 : 1;

  if (trade.side === 'buy') {
    return (trade.exit_price - trade.entry_price) * trade.quantity * multiplier;
  } else {
    // For sell/short positions
    return (trade.entry_price - trade.exit_price) * trade.quantity * multiplier;
  }
}

// Calculate unrealized P&L for open positions
function calculateUnrealizedPnL(trade: Trade, currentPrice: number = 0): number {
  if (trade.status === 'closed' || currentPrice === 0) return 0;

  const multiplier = trade.asset_type === 'option' ? 100 : 1;

  if (trade.side === 'buy') {
    return (currentPrice - trade.entry_price) * trade.quantity * multiplier;
  } else {
    // For sell/short positions
    return (trade.entry_price - currentPrice) * trade.quantity * multiplier;
  }
}

// Calculate value of open position
function calculatePositionValue(trade: Trade): number {
  if (trade.status === 'closed') return 0;

  const multiplier = trade.asset_type === 'option' ? 100 : 1;
  return trade.entry_price * trade.quantity * multiplier;
}

// Get portfolio statistics for dashboard
export async function getPortfolioStats(userId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  // Fetch all trades for the user
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true });

  if (error || !trades) {
    console.error('Error fetching trades:', error);
    return {
      totalValue: 0,
      totalPnL: 0,
      winRate: 0,
      activePositions: 0,
      monthlyEquity: [],
      recentTrades: [],
      todayPnL: 0,
      weekPnL: 0,
      monthPnL: 0,
    };
  }

  // Parse and validate trades
  const validTrades = trades
    .map((t) => {
      try {
        return TradeSchema.parse(t);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Trade[];

  // Calculate metrics
  const openTrades = validTrades.filter((t) => t.status !== 'closed');
  const closedTrades = validTrades.filter((t) => t.status === 'closed');

  // Total P&L from closed trades
  const totalPnL = closedTrades.reduce((sum, trade) => sum + calculatePnL(trade), 0);

  // Win rate
  const winningTrades = closedTrades.filter((t) => calculatePnL(t) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  // Active positions count
  const activePositions = openTrades.length;

  // Calculate initial capital (you can make this configurable)
  const initialCapital = 10000; // Start with $10,000 as a realistic starting amount

  // Total portfolio value = initial capital + realized P&L from closed trades
  // For open positions, we'd need current prices which we don't have here
  const totalValue = initialCapital + totalPnL;

  // Calculate monthly equity curve
  const monthlyEquity = calculateMonthlyEquity(validTrades);

  // Get recent trades (last 5)
  const recentTrades = validTrades
    .sort((a, b) => {
      const dateA = a.exit_date || a.entry_date;
      const dateB = b.exit_date || b.entry_date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 5)
    .map((t) => ({
      ...t,
      pnl: calculatePnL(t),
    }));

  // Calculate period P&L
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(now.setDate(now.getDate() - 7));
  const monthStart = new Date(now.setMonth(now.getMonth() - 1));

  const todayPnL = closedTrades
    .filter((t) => t.exit_date && new Date(t.exit_date) >= todayStart)
    .reduce((sum, t) => sum + calculatePnL(t), 0);

  const weekPnL = closedTrades
    .filter((t) => t.exit_date && new Date(t.exit_date) >= weekStart)
    .reduce((sum, t) => sum + calculatePnL(t), 0);

  const monthPnL = closedTrades
    .filter((t) => t.exit_date && new Date(t.exit_date) >= monthStart)
    .reduce((sum, t) => sum + calculatePnL(t), 0);

  return {
    totalValue,
    totalPnL,
    winRate,
    activePositions,
    monthlyEquity,
    recentTrades,
    todayPnL,
    weekPnL,
    monthPnL,
  };
}

// Calculate monthly equity curve
function calculateMonthlyEquity(trades: Trade[]) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const currentYear = new Date().getFullYear();
  const monthlyData = months.map((month) => ({ month, value: 0 }));

  // Calculate cumulative P&L for each month
  let cumulativePnL = 0;
  const baseValue = 10000; // Starting portfolio value (realistic $10k)

  for (let i = 0; i < 12; i++) {
    const monthTrades = trades.filter((t) => {
      const tradeDate = new Date(t.exit_date || t.entry_date);
      return (
        tradeDate.getMonth() === i &&
        tradeDate.getFullYear() === currentYear &&
        t.status === 'closed'
      );
    });

    const monthPnL = monthTrades.reduce((sum, t) => sum + calculatePnL(t), 0);
    cumulativePnL += monthPnL;
    monthlyData[i].value = baseValue + cumulativePnL;
  }

  return monthlyData;
}

// Get analytics data
export async function getAnalyticsData(userId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  // Fetch all trades
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true });

  if (error || !trades) {
    console.error('Error fetching trades:', error);
    return {
      pnlByMonth: [],
      equityCurve: [],
      tradeDistribution: [],
      strategyMetrics: {
        expectancy: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        avgHoldTime: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
      },
      bestTrades: [],
      worstTrades: [],
      winRate: 0,
      totalTrades: 0,
      totalPnL: 0,
    };
  }

  // Parse and validate trades
  const validTrades = trades
    .map((t) => {
      try {
        return TradeSchema.parse(t);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Trade[];

  const closedTrades = validTrades.filter((t) => t.status === 'closed');

  // Calculate P&L by month
  const pnlByMonth = calculatePnLByMonth(closedTrades);

  // Calculate equity curve (daily)
  const equityCurve = calculateEquityCurve(closedTrades);

  // Trade distribution by asset type
  const tradeDistribution = calculateTradeDistribution(validTrades);

  // Strategy metrics
  const strategyMetrics = calculateStrategyMetrics(closedTrades);

  // Best and worst trades
  const tradesWithPnL = closedTrades
    .map((t) => ({
      ...t,
      pnl: calculatePnL(t),
    }))
    .sort((a, b) => b.pnl - a.pnl);

  const bestTrades = tradesWithPnL.slice(0, 3);
  const worstTrades = tradesWithPnL.slice(-3).reverse();

  // Overall metrics
  const winningTrades = closedTrades.filter((t) => calculatePnL(t) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  const totalPnL = closedTrades.reduce((sum, t) => sum + calculatePnL(t), 0);

  return {
    pnlByMonth,
    equityCurve,
    tradeDistribution,
    strategyMetrics,
    bestTrades,
    worstTrades,
    winRate,
    totalTrades: validTrades.length,
    totalPnL,
  };
}

// Calculate P&L by month for bar chart
function calculatePnLByMonth(trades: Trade[]) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const currentYear = new Date().getFullYear();

  return months.map((month, index) => {
    const monthTrades = trades.filter((t) => {
      if (!t.exit_date) return false;
      const date = new Date(t.exit_date);
      return date.getMonth() === index && date.getFullYear() === currentYear;
    });

    const pnl = monthTrades.reduce((sum, t) => sum + calculatePnL(t), 0);

    return { month, pnl };
  });
}

// Calculate daily equity curve
function calculateEquityCurve(trades: Trade[]) {
  if (trades.length === 0) return [];

  // Sort trades by exit date
  const sortedTrades = trades
    .filter((t) => t.exit_date)
    .sort((a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime());

  if (sortedTrades.length === 0) return [];

  // Generate daily equity points
  const startDate = new Date(sortedTrades[0].entry_date);
  const endDate = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs);

  const equityCurve = [];
  let cumulativePnL = 0;
  const baseEquity = 10000; // Realistic starting capital

  for (let i = 0; i <= Math.min(days, 365); i++) {
    // Limit to 1 year
    const currentDate = new Date(startDate.getTime() + i * dayMs);

    // Add P&L from trades closed on or before this date
    const dayTrades = sortedTrades.filter((t) => {
      const exitDate = new Date(t.exit_date!);
      return exitDate <= currentDate;
    });

    cumulativePnL = dayTrades.reduce((sum, t) => sum + calculatePnL(t), 0);

    equityCurve.push({
      date: currentDate.toISOString().split('T')[0],
      value: baseEquity + cumulativePnL,
    });
  }

  return equityCurve;
}

// Calculate trade distribution
function calculateTradeDistribution(trades: Trade[]) {
  const distribution = trades.reduce(
    (acc, trade) => {
      const type = trade.asset_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));
}

// Calculate strategy metrics
function calculateStrategyMetrics(trades: Trade[]) {
  if (trades.length === 0) {
    return {
      expectancy: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgHoldTime: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
    };
  }

  const tradesWithPnL = trades.map((t) => ({
    ...t,
    pnl: calculatePnL(t),
  }));

  const wins = tradesWithPnL.filter((t) => t.pnl > 0);
  const losses = tradesWithPnL.filter((t) => t.pnl < 0);

  // Expectancy
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0;
  const winRate = trades.length > 0 ? wins.length / trades.length : 0;
  const lossRate = 1 - winRate;
  const expectancy = avgWin * winRate - avgLoss * lossRate;

  // Sharpe Ratio (simplified)
  const returns = tradesWithPnL.map((t) => t.pnl);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

  // Max Drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;

  for (const trade of tradesWithPnL) {
    runningPnL += trade.pnl;
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const maxDrawdownPercent = peak !== 0 ? (maxDrawdown / peak) * 100 : 0;

  // Average hold time
  const holdTimes = trades
    .filter((t) => t.exit_date)
    .map((t) => {
      const entry = new Date(t.entry_date);
      const exit = new Date(t.exit_date!);
      return (exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24); // Days
    });

  const avgHoldTime =
    holdTimes.length > 0 ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length : 0;

  // Profit Factor
  const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses !== 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  // Largest win/loss
  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0;

  return {
    expectancy,
    sharpeRatio,
    maxDrawdown: maxDrawdownPercent,
    avgHoldTime,
    profitFactor,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
  };
}

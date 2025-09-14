// Trading Statistics Calculation Module
// Implements proper formulas for all trading performance metrics

export interface Trade {
  id: string;
  symbol: string;
  realized_pnl: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  qty_opened: number;
  qty_closed: number;
  avg_open_price: number;
  avg_close_price?: number;
  fees: number;
  instrument_type: 'equity' | 'option' | 'futures';
}

export interface TradingStatistics {
  // Basic Metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // P&L Metrics
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  grossProfit: number;
  grossLoss: number;
  
  // Average Metrics
  avgWin: number;
  avgLoss: number;
  avgTrade: number;
  
  // Risk Metrics
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  
  // Additional Metrics
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgTradeDuration: number;
  
  // Monthly Performance
  monthlyReturns: Array<{
    month: string;
    pnl: number;
    trades: number;
    winRate: number;
  }>;
  
  // Symbol Performance
  performanceBySymbol: Array<{
    symbol: string;
    trades: number;
    pnl: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
  }>;
}

/**
 * Calculate comprehensive trading statistics from trade data
 */
export function calculateTradingStatistics(trades: Trade[]): TradingStatistics {
  if (!trades || trades.length === 0) {
    return getEmptyStatistics();
  }

  // Filter closed trades for most calculations
  const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.realized_pnl !== null);
  const openTrades = trades.filter(trade => trade.status === 'open');

  // Basic counts
  const totalTrades = trades.length;
  const winningTrades = closedTrades.filter(trade => trade.realized_pnl > 0);
  const losingTrades = closedTrades.filter(trade => trade.realized_pnl < 0);
  
  // Win rate calculation: (Winning Trades / Total Closed Trades) * 100
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  // P&L calculations
  const realizedPnL = closedTrades.reduce((sum, trade) => sum + trade.realized_pnl, 0);
  const unrealizedPnL = 0; // For now, set to 0 - can be enhanced with real-time prices
  const totalPnL = realizedPnL + unrealizedPnL;

  // Gross profit and loss
  const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.realized_pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.realized_pnl, 0));

  // Average calculations
  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  const avgTrade = closedTrades.length > 0 ? realizedPnL / closedTrades.length : 0;

  // Profit Factor: Gross Profit / Gross Loss
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

  // Largest win and loss
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.realized_pnl)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.realized_pnl)) : 0;

  // Consecutive wins and losses
  const { consecutiveWins, consecutiveLosses } = calculateConsecutiveStreaks(closedTrades);

  // Average trade duration (in days)
  const avgTradeDuration = calculateAverageTradeDuration(closedTrades);

  // Maximum drawdown calculation
  const { maxDrawdown, maxDrawdownPercent } = calculateMaxDrawdown(closedTrades);

  // Sharpe ratio calculation
  const sharpeRatio = calculateSharpeRatio(closedTrades);

  // Monthly returns
  const monthlyReturns = calculateMonthlyReturns(closedTrades);

  // Performance by symbol
  const performanceBySymbol = calculatePerformanceBySymbol(closedTrades);

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    totalPnL,
    realizedPnL,
    unrealizedPnL,
    grossProfit,
    grossLoss,
    avgWin,
    avgLoss,
    avgTrade,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    maxDrawdownPercent,
    largestWin,
    largestLoss,
    consecutiveWins,
    consecutiveLosses,
    avgTradeDuration,
    monthlyReturns,
    performanceBySymbol,
  };
}

/**
 * Calculate consecutive winning and losing streaks
 */
function calculateConsecutiveStreaks(trades: Trade[]): { consecutiveWins: number; consecutiveLosses: number } {
  if (trades.length === 0) return { consecutiveWins: 0, consecutiveLosses: 0 };

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime()
  );

  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  for (const trade of sortedTrades) {
    if (trade.realized_pnl > 0) {
      currentWins++;
      currentLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
    } else if (trade.realized_pnl < 0) {
      currentLosses++;
      currentWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
    }
  }

  return { consecutiveWins: maxConsecutiveWins, consecutiveLosses: maxConsecutiveLosses };
}

/**
 * Calculate average trade duration in days
 */
function calculateAverageTradeDuration(trades: Trade[]): number {
  const tradesWithDuration = trades.filter(trade => trade.closed_at);
  
  if (tradesWithDuration.length === 0) return 0;

  const totalDuration = tradesWithDuration.reduce((sum, trade) => {
    const openDate = new Date(trade.opened_at);
    const closeDate = new Date(trade.closed_at!);
    const durationMs = closeDate.getTime() - openDate.getTime();
    return sum + (durationMs / (1000 * 60 * 60 * 24)); // Convert to days
  }, 0);

  return totalDuration / tradesWithDuration.length;
}

/**
 * Calculate maximum drawdown
 * Maximum drawdown is the largest peak-to-trough decline in account equity
 */
function calculateMaxDrawdown(trades: Trade[]): { maxDrawdown: number; maxDrawdownPercent: number } {
  if (trades.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: 0 };

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime()
  );

  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let runningPnL = 0;

  for (const trade of sortedTrades) {
    runningPnL += trade.realized_pnl;
    
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
    }
  }

  return { maxDrawdown, maxDrawdownPercent };
}

/**
 * Calculate Sharpe Ratio
 * Sharpe Ratio = (Average Return - Risk-Free Rate) / Standard Deviation of Returns
 * For trading, we use 0 as risk-free rate and calculate from daily returns
 */
function calculateSharpeRatio(trades: Trade[]): number {
  if (trades.length < 2) return 0;

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime()
  );

  // Calculate daily returns (simplified - using trade P&L as daily return)
  const returns = sortedTrades.map(trade => trade.realized_pnl);
  
  // Calculate average return
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  
  // Calculate standard deviation
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Sharpe ratio (using 0 as risk-free rate for simplicity)
  return stdDev > 0 ? avgReturn / stdDev : 0;
}

/**
 * Calculate monthly returns
 */
function calculateMonthlyReturns(trades: Trade[]): Array<{
  month: string;
  pnl: number;
  trades: number;
  winRate: number;
}> {
  const monthlyMap = new Map<string, { pnl: number; trades: number; wins: number }>();

  trades.forEach(trade => {
    const month = trade.closed_at ? trade.closed_at.substring(0, 7) : trade.opened_at.substring(0, 7);
    const existing = monthlyMap.get(month) || { pnl: 0, trades: 0, wins: 0 };
    
    existing.pnl += trade.realized_pnl;
    existing.trades += 1;
    if (trade.realized_pnl > 0) existing.wins += 1;
    
    monthlyMap.set(month, existing);
  });

  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      pnl: data.pnl,
      trades: data.trades,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate performance by symbol
 */
function calculatePerformanceBySymbol(trades: Trade[]): Array<{
  symbol: string;
  trades: number;
  pnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}> {
  const symbolMap = new Map<string, { 
    trades: number; 
    pnl: number; 
    wins: number; 
    winsPnL: number; 
    lossesPnL: number;
    winCount: number;
    lossCount: number;
  }>();

  trades.forEach(trade => {
    const existing = symbolMap.get(trade.symbol) || { 
      trades: 0, 
      pnl: 0, 
      wins: 0, 
      winsPnL: 0, 
      lossesPnL: 0,
      winCount: 0,
      lossCount: 0
    };
    
    existing.trades += 1;
    existing.pnl += trade.realized_pnl;
    
    if (trade.realized_pnl > 0) {
      existing.wins += 1;
      existing.winsPnL += trade.realized_pnl;
      existing.winCount += 1;
    } else if (trade.realized_pnl < 0) {
      existing.lossesPnL += Math.abs(trade.realized_pnl);
      existing.lossCount += 1;
    }
    
    symbolMap.set(trade.symbol, existing);
  });

  return Array.from(symbolMap.entries())
    .map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      pnl: data.pnl,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      avgWin: data.winCount > 0 ? data.winsPnL / data.winCount : 0,
      avgLoss: data.lossCount > 0 ? data.lossesPnL / data.lossCount : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

/**
 * Return empty statistics object
 */
function getEmptyStatistics(): TradingStatistics {
  return {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    grossProfit: 0,
    grossLoss: 0,
    avgWin: 0,
    avgLoss: 0,
    avgTrade: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    maxDrawdownPercent: 0,
    largestWin: 0,
    largestLoss: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    avgTradeDuration: 0,
    monthlyReturns: [],
    performanceBySymbol: [],
  };
}

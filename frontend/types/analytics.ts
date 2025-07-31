// Query params for analytics API calls
export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  symbols?: string[];
  tradeTypes?: string[];
  strategyTags?: string[];
  accounts?: string[];
}

// Overview metrics (KPI)
export interface OverviewMetrics {
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  recoveryFactor: number;
  sharpeRatio: number;
  avgRR: number;
  longestWinningStreak: number;
  longestLosingStreak: number;
  commissionsFees: number;
}

// Daily performance for equity curve
export interface DailyPerformance {
  date: string;
  cumulativePnl: number;
  dailyPnl: number;
}

// Trade breakdown (R:R, MAE, MFE distributions)
export interface TradeBreakdown {
  rrDistribution: { range: string; count: number }[];
  maeDistribution: { range: string; count: number }[];
  mfeDistribution: { range: string; count: number }[];
}

// Performance by category (strategy, symbol, type, etc.)
export interface PerformanceByCategory {
  category: string;
  netProfit: number;
  winRate: number;
  totalTrades: number;
}

// Heatmap data (time-based performance)
export interface HeatmapData {
  day: number; // 0 = Monday
  hour: number; // 0 = 00:00 UTC
  value: number;
}

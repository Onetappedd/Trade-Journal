/**
 * Canonical KPI Types
 * 
 * These are the stable DTOs that the frontend depends on for all KPI calculations.
 * Any changes to these types will require frontend updates, so they should be
 * versioned and backward-compatible.
 */

export interface KPISummary {
  /** Total P&L across all trades */
  totalPnl: number;
  
  /** Win rate as a percentage (0-100) */
  winRate: number;
  
  /** Total number of trades */
  totalTrades: number;
  
  /** Sharpe ratio for risk-adjusted returns */
  sharpe: number;
  
  /** Time period for the calculations */
  period: {
    start: string; // ISO date string
    end: string;    // ISO date string
  };
  
  /** Additional metrics for enhanced dashboard */
  realizedPnl: number;
  unrealizedPnl: number;
  maxDrawdown: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalVolume: number;
  
  /** Metadata */
  lastUpdated: string; // ISO timestamp
  calculationMethod: 'server' | 'client';
}

export interface KPIPeriod {
  /** Start date for the period */
  start: string;
  
  /** End date for the period */
  end: string;
  
  /** Period type */
  type: 'all' | 'ytd' | 'ytd_prev' | 'mtd' | 'mtd_prev' | 'custom';
  
  /** Human-readable description */
  description: string;
}

export interface KPIFilters {
  /** Date range filter */
  period?: KPIPeriod;
  
  /** Asset type filter */
  assetType?: 'all' | 'equity' | 'option' | 'crypto' | 'forex';
  
  /** Symbol filter */
  symbol?: string;
  
  /** Strategy filter */
  strategy?: string;
}

export interface KPITimeSeries {
  /** Date for the data point */
  date: string;
  
  /** Cumulative P&L up to this date */
  cumulativePnl: number;
  
  /** Daily P&L for this date */
  dailyPnl: number;
  
  /** Number of trades on this date */
  tradeCount: number;
  
  /** Volume traded on this date */
  volume: number;
}

export interface KPIBreakdown {
  /** P&L by asset type */
  byAssetType: Record<string, {
    pnl: number;
    trades: number;
    winRate: number;
  }>;
  
  /** P&L by symbol */
  bySymbol: Record<string, {
    pnl: number;
    trades: number;
    winRate: number;
  }>;
  
  /** P&L by month */
  byMonth: Record<string, {
    pnl: number;
    trades: number;
    winRate: number;
  }>;
}

/**
 * KPI Calculation Methods
 * These define how KPIs are calculated on the server
 */
export interface KPICalculationConfig {
  /** Risk-free rate for Sharpe ratio calculation */
  riskFreeRate: number;
  
  /** Minimum number of trades for meaningful statistics */
  minTrades: number;
  
  /** Lookback period for drawdown calculation */
  drawdownLookback: number;
  
  /** Whether to include unrealized P&L */
  includeUnrealized: boolean;
}

/**
 * KPI Cache Configuration
 */
export interface KPICacheConfig {
  /** Cache TTL in seconds */
  ttl: number;
  
  /** Cache tags for invalidation */
  tags: string[];
  
  /** Whether to use stale-while-revalidate */
  swr: boolean;
}

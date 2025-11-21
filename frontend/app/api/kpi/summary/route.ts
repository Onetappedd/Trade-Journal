import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { KPISummary, KPIFilters, KPICalculationConfig } from '@/src/types/kpi';
import { unstable_cache } from 'next/cache';
import { createApiError, createApiSuccess, ERROR_CODES } from '@/src/types/api';

// Force dynamic rendering to avoid build-time static generation
export const dynamic = 'force-dynamic';

/**
 * KPI Summary API
 * 
 * Returns canonical KPI data calculated server-side.
 * This is the single source of truth for all dashboard KPIs.
 * 
 * Features:
 * - Server-side calculation (no client-side computation)
 * - Cached results for performance
 * - Tag-based cache invalidation
 * - Stable DTOs for frontend consumption
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'No authorization token provided'),
        { status: 401 }
      );
    }

    const supabase = await createSupabaseWithToken(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', authError?.message),
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const assetType = searchParams.get('assetType') || 'all';
    const symbol = searchParams.get('symbol') || undefined;

    // Build cache key
    const cacheKey = `kpi-summary-${user.id}-${period}-${assetType}-${symbol || 'all'}`;

    // Get cached KPI data or calculate fresh
    const kpiData = await getCachedKPISummary(user.id, { period, assetType, symbol }, supabase);

    return NextResponse.json(createApiSuccess(kpiData));

  } catch (error: any) {
    console.error('KPI summary API error:', error);
    return NextResponse.json(
      createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch KPI data', error.message),
      { status: 500 }
    );
  }
}

/**
 * Get cached KPI Summary
 */
const getCachedKPISummary = unstable_cache(
  async (
    userId: string, 
    filters: { period: string; assetType: string; symbol?: string },
    supabase: any
  ): Promise<KPISummary> => {
    return getKPISummary(userId, filters, supabase);
  },
  ['kpi-summary'],
  {
    tags: ['kpi'],
    revalidate: 300 // 5 minutes
  }
);

/**
 * Get KPI Summary with caching
 */
async function getKPISummary(
  userId: string, 
  filters: { period: string; assetType: string; symbol?: string },
  supabase: any
): Promise<KPISummary> {
  // Calculate date range based on period
  const dateRange = getDateRange(filters.period);
  
  // Build query for trades
  let query = supabase
    .from('trades')
    .select(`
      id,
      symbol,
      side,
      quantity,
      price,
      pnl,
      opened_at,
      closed_at,
      asset_type,
      status
    `)
    .eq('user_id', userId)
    .gte('opened_at', dateRange.start)
    .lte('opened_at', dateRange.end);

  // Apply filters
  if (filters.assetType !== 'all') {
    query = query.eq('asset_type', filters.assetType);
  }
  
  if (filters.symbol) {
    query = query.eq('symbol', filters.symbol);
  }

  const { data: trades, error: tradesError } = await query;

  if (tradesError) {
    console.error('Trades query error:', tradesError);
    // Return empty summary instead of throwing error
    return getEmptyKPISummary(dateRange);
  }

  if (!trades || trades.length === 0) {
    return getEmptyKPISummary(dateRange);
  }

  // Calculate KPIs server-side
  const kpis = calculateKPIs(trades);

  return {
    totalPnl: kpis.totalPnl,
    winRate: kpis.winRate,
    totalTrades: kpis.totalTrades,
    sharpe: kpis.sharpe,
    period: {
      start: dateRange.start,
      end: dateRange.end
    },
    realizedPnl: kpis.realizedPnl,
    unrealizedPnl: kpis.unrealizedPnl,
    maxDrawdown: kpis.maxDrawdown,
    profitFactor: kpis.profitFactor,
    avgWin: kpis.avgWin,
    avgLoss: kpis.avgLoss,
    totalVolume: kpis.totalVolume,
    lastUpdated: new Date().toISOString(),
    calculationMethod: 'server'
  };
}

/**
 * Calculate KPIs from trades data
 */
function calculateKPIs(trades: any[]): {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  sharpe: number;
  realizedPnl: number;
  unrealizedPnl: number;
  maxDrawdown: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalVolume: number;
} {
  const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.pnl !== null);
  const openTrades = trades.filter(trade => trade.status === 'open');
  
  // Basic metrics
  const totalTrades = trades.length;
  const realizedPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const unrealizedPnl = openTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalPnl = realizedPnl + unrealizedPnl;
  
  // Win rate calculation
  const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  // Average win/loss
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / winningTrades.length 
    : 0;
  
  const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losingTrades.length)
    : 0;
  
  // Profit factor
  const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
  
  // Sharpe ratio calculation
  const returns = closedTrades.map(trade => trade.pnl || 0);
  const sharpe = calculateSharpeRatio(returns);
  
  // Max drawdown calculation
  const maxDrawdown = calculateMaxDrawdown(returns);
  
  // Total volume
  const totalVolume = trades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  
  return {
    totalPnl,
    winRate,
    totalTrades,
    sharpe,
    realizedPnl,
    unrealizedPnl,
    maxDrawdown,
    profitFactor,
    avgWin,
    avgLoss,
    totalVolume
  };
}

/**
 * Calculate Sharpe ratio
 */
function calculateSharpeRatio(returns: number[]): number {
  if (returns.length < 2) return 0;
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  // Assuming risk-free rate of 0 for simplicity
  return avgReturn / stdDev;
}

/**
 * Calculate maximum drawdown
 */
function calculateMaxDrawdown(returns: number[]): number {
  if (returns.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = 0;
  let runningSum = 0;
  
  for (const ret of returns) {
    runningSum += ret;
    if (runningSum > peak) {
      peak = runningSum;
    }
    const drawdown = peak - runningSum;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

/**
 * Get date range based on period
 */
function getDateRange(period: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  
  switch (period) {
    case 'ytd':
      const ytdStart = new Date(now.getFullYear(), 0, 1);
      return { start: ytdStart.toISOString(), end };
    
    case 'mtd':
      const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: mtdStart.toISOString(), end };
    
    case '30d':
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start: thirtyDaysAgo.toISOString(), end };
    
    case '90d':
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { start: ninetyDaysAgo.toISOString(), end };
    
    case '1y':
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return { start: oneYearAgo.toISOString(), end };
    
    case 'all':
    default:
      // Return a very early date for "all time"
      return { start: '2020-01-01T00:00:00.000Z', end };
  }
}

/**
 * Get empty KPI summary for when no trades exist
 */
function getEmptyKPISummary(dateRange: { start: string; end: string }): KPISummary {
  return {
    totalPnl: 0,
    winRate: 0,
    totalTrades: 0,
    sharpe: 0,
    period: dateRange,
    realizedPnl: 0,
    unrealizedPnl: 0,
    maxDrawdown: 0,
    profitFactor: 0,
    avgWin: 0,
    avgLoss: 0,
    totalVolume: 0,
    lastUpdated: new Date().toISOString(),
    calculationMethod: 'server'
  };
}

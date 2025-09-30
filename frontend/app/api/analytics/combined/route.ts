/**
 * Combined Analytics Endpoint
 * Merges data from both SnapTrade broker connections and manually imported trades
 * Provides unified performance metrics across all data sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Service role client for accessing SnapTrade data
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const dataSource = searchParams.get('source') || 'combined'; // 'manual', 'broker', or 'combined'
    const timeframe = searchParams.get('timeframe') || '3M';

    // 1. Fetch manually imported trades
    const { data: manualTrades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false });

    if (tradesError) {
      console.error('Error fetching manual trades:', tradesError);
    }

    // 2. Fetch SnapTrade account data
    const { data: snaptradeAccounts } = await supabaseAdmin
      .from('snaptrade_accounts')
      .select('*')
      .eq('user_id', user.id);

    // 3. Fetch account value snapshots (for equity curve)
    const { data: snapshots } = await supabaseAdmin
      .from('account_value_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true });

    // 4. Check broker verification status
    const { data: verificationData } = await supabaseAdmin
      .from('user_broker_verification')
      .select('is_broker_verified, last_verified_at')
      .eq('user_id', user.id)
      .single();

    const hasBrokerData = verificationData?.is_broker_verified || false;
    const hasManualData = (manualTrades || []).length > 0;

    // Calculate broker-based metrics
    let brokerMetrics = {
      totalValue: 0,
      accountCount: 0,
      lastSync: null as string | null,
      equityCurve: [] as Array<{ date: string; value: number }>,
    };

    if (hasBrokerData && snaptradeAccounts) {
      brokerMetrics.totalValue = snaptradeAccounts.reduce(
        (sum, acc) => sum + (acc.total_value || 0),
        0
      );
      brokerMetrics.accountCount = snaptradeAccounts.length;
      brokerMetrics.lastSync = verificationData?.last_verified_at || null;

      // Build equity curve from snapshots
      if (snapshots) {
        brokerMetrics.equityCurve = snapshots.map(s => ({
          date: s.snapshot_date,
          value: s.total_value,
        }));
      }
    }

    // Calculate manual trade metrics
    let manualMetrics = {
      totalTrades: 0,
      totalPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      monthlyReturns: [] as Array<{ month: string; pnl: number; trades: number }>,
      performanceBySymbol: [] as Array<{ symbol: string; trades: number; pnl: number; winRate: number }>,
    };

    if (hasManualData && manualTrades) {
      const closedTrades = manualTrades.filter(t => t.status === 'closed');
      manualMetrics.totalTrades = closedTrades.length;

      const pnlValues = closedTrades.map(t => t.pnl || 0);
      manualMetrics.totalPnL = pnlValues.reduce((sum, pnl) => sum + pnl, 0);
      manualMetrics.realizedPnL = manualMetrics.totalPnL; // All closed trades are realized

      const wins = pnlValues.filter(p => p > 0);
      const losses = pnlValues.filter(p => p < 0);

      manualMetrics.winRate = closedTrades.length > 0
        ? (wins.length / closedTrades.length) * 100
        : 0;

      manualMetrics.avgWin = wins.length > 0
        ? wins.reduce((a, b) => a + b, 0) / wins.length
        : 0;

      manualMetrics.avgLoss = losses.length > 0
        ? losses.reduce((a, b) => a + b, 0) / losses.length
        : 0;

      const totalWins = wins.reduce((a, b) => a + b, 0);
      const totalLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
      manualMetrics.profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

      // Calculate max drawdown
      let peak = 0;
      let maxDD = 0;
      let cumPnL = 0;
      
      closedTrades
        .sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime())
        .forEach(trade => {
          cumPnL += trade.pnl || 0;
          if (cumPnL > peak) peak = cumPnL;
          const drawdown = peak - cumPnL;
          if (drawdown > maxDD) maxDD = drawdown;
        });

      manualMetrics.maxDrawdown = -maxDD;

      // Calculate monthly returns
      const monthlyMap: { [key: string]: { pnl: number; trades: number } } = {};
      closedTrades.forEach(trade => {
        const date = new Date(trade.executed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { pnl: 0, trades: 0 };
        }
        
        monthlyMap[monthKey].pnl += trade.pnl || 0;
        monthlyMap[monthKey].trades += 1;
      });

      manualMetrics.monthlyReturns = Object.entries(monthlyMap)
        .map(([month, data]) => ({
          month,
          pnl: data.pnl,
          trades: data.trades,
        }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12); // Last 12 months

      // Calculate performance by symbol
      const symbolMap: { [key: string]: { trades: number; pnl: number; wins: number } } = {};
      closedTrades.forEach(trade => {
        const symbol = trade.symbol || 'Unknown';
        
        if (!symbolMap[symbol]) {
          symbolMap[symbol] = { trades: 0, pnl: 0, wins: 0 };
        }
        
        symbolMap[symbol].trades += 1;
        symbolMap[symbol].pnl += trade.pnl || 0;
        if ((trade.pnl || 0) > 0) symbolMap[symbol].wins += 1;
      });

      manualMetrics.performanceBySymbol = Object.entries(symbolMap)
        .map(([symbol, data]) => ({
          symbol,
          trades: data.trades,
          pnl: data.pnl,
          winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
        }))
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 10); // Top 10
    }

    // Calculate Sharpe Ratio (simplified - assumes daily returns)
    let sharpeRatio = 0;
    if (manualMetrics.totalTrades > 0) {
      const returns = manualTrades
        ?.filter(t => t.status === 'closed')
        .map(t => t.pnl || 0) || [];
      
      if (returns.length > 1) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        sharpeRatio = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0; // Annualized
      }
    }

    // Combine metrics based on data source preference
    let combinedAnalytics;

    if (dataSource === 'manual') {
      combinedAnalytics = {
        ...manualMetrics,
        sharpeRatio,
        dataSource: 'manual',
        hasBrokerData: false,
        hasManualData,
      };
    } else if (dataSource === 'broker') {
      combinedAnalytics = {
        totalTrades: 0,
        totalPnL: brokerMetrics.totalValue,
        realizedPnL: 0,
        unrealizedPnL: brokerMetrics.totalValue,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        monthlyReturns: [],
        performanceBySymbol: [],
        brokerData: brokerMetrics,
        dataSource: 'broker',
        hasBrokerData,
        hasManualData: false,
      };
    } else {
      // Combined view
      combinedAnalytics = {
        ...manualMetrics,
        sharpeRatio,
        brokerData: hasBrokerData ? brokerMetrics : null,
        dataSource: 'combined',
        hasBrokerData,
        hasManualData,
        totalPortfolioValue: brokerMetrics.totalValue + (manualMetrics.totalPnL || 0),
      };
    }

    return NextResponse.json({
      success: true,
      data: combinedAnalytics,
      metadata: {
        queriedAt: new Date().toISOString(),
        dataSource,
        timeframe,
      },
    });

  } catch (error: any) {
    console.error('Combined analytics error:', error);
    return NextResponse.json({
      error: 'Failed to fetch combined analytics',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * Combined Analytics Endpoint
 * Merges data from both SnapTrade broker connections and manually imported trades
 * Provides unified performance metrics across all data sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check for Authorization header first (client-side requests)
    const authHeader = request.headers.get('authorization');
    let supabase;
    let user;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use token-based authentication for API requests
      const token = authHeader.replace('Bearer ', '');
      
      // Create Supabase client with token for RLS
      supabase = await createSupabaseWithToken(request);
      
      // Verify the token by calling getUser with the token
      // This validates the JWT and returns the user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authUser) {
        console.error('[Analytics] Auth error:', authError);
        return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
      }
      user = authUser;
    } else {
      // Fallback to cookie-based authentication for server-side requests
      const { createServerClient } = await import('@supabase/ssr');
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      supabase = createServerClient(
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
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;
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
    // Use opened_at (matching engine) or fallback to created_at
    const { data: manualTrades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

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
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      equityCurve: [] as Array<{ date: string; value: number }>,
      drawdownSeries: [] as Array<{ date: string; drawdown: number }>,
      monthlyReturns: [] as Array<{ month: string; pnl: number; trades: number }>,
      performanceBySymbol: [] as Array<{ symbol: string; trades: number; pnl: number; winRate: number }>,
    };

    if (hasManualData && manualTrades) {
      // Normalize trades to handle both matching engine schema and legacy schema
      const normalizedTrades = manualTrades.map((t: any) => ({
        ...t,
        pnl: typeof (t.realized_pnl ?? t.pnl) === 'string' 
          ? parseFloat(t.realized_pnl ?? t.pnl ?? '0') 
          : (t.realized_pnl ?? t.pnl ?? 0),
        executed_at: t.opened_at ?? t.executed_at ?? t.entry_date ?? t.created_at,
        closed_at: t.closed_at ?? t.exit_date ?? null,
        status: t.status || (t.closed_at ? 'closed' : 'open'),
      }));

      const closedTrades = normalizedTrades.filter(t => t.status === 'closed');
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

      // Build equity curve from cumulative realized P&L
      const startingCapital = 10000; // Default starting capital
      const sortedTrades = [...closedTrades].sort((a, b) => {
        const dateA = a.closed_at || a.executed_at || a.opened_at || a.created_at;
        const dateB = b.closed_at || b.executed_at || b.opened_at || b.created_at;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
      
      let cumPnL = 0;
      const firstTradeDate = sortedTrades[0]?.closed_at || sortedTrades[0]?.executed_at || sortedTrades[0]?.opened_at || sortedTrades[0]?.created_at;
      const equityCurve: Array<{ date: string; value: number }> = [
        { date: firstTradeDate, value: startingCapital }
      ];
      
      sortedTrades.forEach(trade => {
        cumPnL += trade.pnl || 0;
        const tradeDate = trade.closed_at || trade.executed_at || trade.opened_at || trade.created_at;
        if (tradeDate) {
          equityCurve.push({
            date: tradeDate,
            value: startingCapital + cumPnL,
          });
        }
      });
      
      manualMetrics.equityCurve = equityCurve;

      // Calculate drawdown series and max drawdown
      let peak = startingCapital;
      let maxDD = 0;
      let maxDDPercent = 0;
      const drawdownSeries: Array<{ date: string; drawdown: number }> = [];
      
      equityCurve.forEach(point => {
        if (point.value > peak) peak = point.value;
        const drawdown = peak > 0 ? ((point.value - peak) / peak) * 100 : 0;
        drawdownSeries.push({
          date: point.date,
          drawdown,
        });
        
        if (drawdown < maxDDPercent) maxDDPercent = drawdown;
        const ddAmount = peak - point.value;
        if (ddAmount > maxDD) maxDD = ddAmount;
      });

      manualMetrics.maxDrawdown = -maxDD; // Dollar amount
      manualMetrics.maxDrawdownPercent = maxDDPercent; // Percentage (negative)
      manualMetrics.drawdownSeries = drawdownSeries;

      // Calculate monthly returns
      const monthlyMap: { [key: string]: { pnl: number; trades: number } } = {};
      closedTrades.forEach(trade => {
        const tradeDate = trade.closed_at || trade.executed_at || trade.opened_at || trade.created_at;
        const date = new Date(tradeDate);
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

    // Calculate Sharpe Ratio from equity curve (proper method using daily returns)
    if (manualMetrics.equityCurve.length > 1) {
      const dailyReturns: number[] = [];
      
      for (let i = 1; i < manualMetrics.equityCurve.length; i++) {
        const prevValue = manualMetrics.equityCurve[i - 1].value;
        const currValue = manualMetrics.equityCurve[i].value;
        
        if (prevValue > 0) {
          const dailyReturn = (currValue - prevValue) / prevValue;
          dailyReturns.push(dailyReturn);
        }
      }
      
      if (dailyReturns.length > 1) {
        const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
        const stdDev = Math.sqrt(variance);
        
        // Annualize: Sharpe = (mean_daily_return / std_daily_return) * sqrt(252)
        manualMetrics.sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;
      }
    }

    // Fetch benchmark data (SPY and QQQ) from Supabase benchmark_prices table
    let benchmarks: {
      spy?: Array<{ date: string; value: number }>;
      qqq?: Array<{ date: string; value: number }>;
    } = {};
    
    if (manualMetrics.equityCurve.length > 0) {
      try {
        const firstDate = manualMetrics.equityCurve[0].date;
        const lastDate = manualMetrics.equityCurve[manualMetrics.equityCurve.length - 1].date;
        const startDate = new Date(firstDate).toISOString().split('T')[0];
        const endDate = new Date(lastDate).toISOString().split('T')[0];
        const startingValue = manualMetrics.equityCurve[0].value;

        // Query benchmark_prices table for SPY and QQQ in the user's date range
        const { data: benchmarkRows, error: benchmarkError } = await supabaseAdmin
          .from('benchmark_prices')
          .select('date, symbol, adjusted_close')
          .in('symbol', ['SPY', 'QQQ'])
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        if (benchmarkError) {
          console.error('[Analytics] Error fetching benchmark data:', benchmarkError);
          // Continue without benchmarks if query fails
        } else if (benchmarkRows && benchmarkRows.length > 0) {
          // Group by symbol
          const spyRows = benchmarkRows.filter((r) => r.symbol === 'SPY');
          const qqqRows = benchmarkRows.filter((r) => r.symbol === 'QQQ');

          // Normalize benchmarks to start from the same value as the portfolio
          const normalizeBenchmark = (
            rows: Array<{ date: string; adjusted_close: number }>,
            symbol: string
          ) => {
            if (!rows || rows.length === 0) return [];

            // Find the first data point that matches or is closest to the portfolio start date
            const startDateObj = new Date(startDate);
            let firstPrice: number | null = null;
            let firstIndex = 0;

            for (let i = 0; i < rows.length; i++) {
              const rowDate = new Date(rows[i].date);
              if (rowDate >= startDateObj) {
                // Parse adjusted_close (may be string from NUMERIC type)
                firstPrice =
                  typeof rows[i].adjusted_close === 'string'
                    ? parseFloat(rows[i].adjusted_close)
                    : rows[i].adjusted_close;
                firstIndex = i;
                break;
              }
            }

            // If no exact match, use the first available price
            if (firstPrice === null && rows.length > 0) {
              firstPrice =
                typeof rows[0].adjusted_close === 'string'
                  ? parseFloat(rows[0].adjusted_close)
                  : rows[0].adjusted_close;
              firstIndex = 0;
            }

            if (firstPrice === null || firstPrice === 0) return [];

            // Normalize: scale all prices so the first price equals startingValue
            const scaleFactor = startingValue / firstPrice;

            // Create a map of dates to normalized prices
            const priceMap = new Map<string, number>();
            for (let i = firstIndex; i < rows.length; i++) {
              const rowDate = rows[i].date;
              const adjClose =
                typeof rows[i].adjusted_close === 'string'
                  ? parseFloat(rows[i].adjusted_close)
                  : rows[i].adjusted_close;
              priceMap.set(rowDate, adjClose * scaleFactor);
            }

            // Match portfolio dates with benchmark prices
            const normalized: Array<{ date: string; value: number }> = [];
            for (const portfolioPoint of manualMetrics.equityCurve) {
              const portfolioDate = portfolioPoint.date.split('T')[0];

              // Find the closest benchmark price (use previous day's price if exact match not found)
              let benchmarkPrice: number | null = null;
              for (let offset = 0; offset < 5; offset++) {
                const checkDate = new Date(portfolioDate);
                checkDate.setDate(checkDate.getDate() - offset);
                const checkDateStr = checkDate.toISOString().split('T')[0];
                if (priceMap.has(checkDateStr)) {
                  benchmarkPrice = priceMap.get(checkDateStr)!;
                  break;
                }
              }

              if (benchmarkPrice !== null) {
                normalized.push({
                  date: portfolioPoint.date,
                  value: benchmarkPrice,
                });
              }
            }

            return normalized;
          };

          benchmarks.spy = normalizeBenchmark(spyRows, 'SPY');
          benchmarks.qqq = normalizeBenchmark(qqqRows, 'QQQ');
        }
      } catch (error) {
        console.error('[Analytics] Error processing benchmark data:', error);
        // Continue without benchmarks if processing fails
      }
    }

    // Combine metrics based on data source preference
    let combinedAnalytics;

    if (dataSource === 'manual') {
      combinedAnalytics = {
        ...manualMetrics,
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
        maxDrawdownPercent: 0,
        equityCurve: brokerMetrics.equityCurve,
        drawdownSeries: [],
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
        brokerData: hasBrokerData ? brokerMetrics : null,
        dataSource: 'combined',
        hasBrokerData,
        hasManualData,
        totalPortfolioValue: brokerMetrics.totalValue + (manualMetrics.totalPnL || 0),
      };
    }

    // Add benchmarks to the response
    if (Object.keys(benchmarks).length > 0) {
      (combinedAnalytics as any).benchmarks = benchmarks;
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

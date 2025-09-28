import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';

// Force dynamic rendering to avoid build-time static generation
export const dynamic = 'force-dynamic';

interface PerformanceMetrics {
  strategy: string;
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalVolume: number;
}

/**
 * Portfolio Performance API
 * Provides performance comparison data grouped by strategy
 * Replaces heavy client-side computation with server-side aggregation
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const supabase = createSupabaseWithToken(request);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query with only required fields
    let query = supabase
      .from('trades')
      .select('id, symbol, side, quantity, price, pnl, opened_at, closed_at, asset_type, notes')
      .eq('user_id', user.id);

    if (startDate) {
      query = query.gte('opened_at', startDate);
    }
    if (endDate) {
      query = query.lte('opened_at', endDate);
    }

    const { data: trades, error: tradesError } = await query;

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json({ error: 'Failed to fetch trades', details: tradesError.message }, { status: 500 });
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json([]);
    }

    // Group trades by strategy (using asset_type as proxy for now)
    const strategyMap = new Map<string, any[]>();
    
    trades.forEach(trade => {
      const strategy = trade.asset_type || 'Unknown';
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, []);
      }
      strategyMap.get(strategy)!.push(trade);
    });

    // Calculate performance metrics for each strategy
    const performanceData: PerformanceMetrics[] = [];
    
    for (const [strategy, strategyTrades] of strategyMap) {
      const closedTrades = strategyTrades.filter(trade => trade.closed_at);
      const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
      const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
      
      const totalTrades = closedTrades.length;
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
      const avgWin = winningTrades.length > 0 ? 
        winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? 
        losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losingTrades.length : 0;
      const profitFactor = avgLoss !== 0 ? Math.abs(avgWin * winningTrades.length / (avgLoss * losingTrades.length)) : 0;
      
      // Calculate total volume
      const totalVolume = strategyTrades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
      
      // Calculate Sharpe ratio (simplified)
      const returns = closedTrades.map(trade => trade.pnl || 0);
      const avgReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
      const variance = returns.length > 1 ? 
        returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1) : 0;
      const sharpeRatio = variance > 0 ? avgReturn / Math.sqrt(variance) : 0;
      
      // Calculate max drawdown (simplified)
      let maxDrawdown = 0;
      let peak = 0;
      let runningPnL = 0;
      
      for (const trade of closedTrades.sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime())) {
        runningPnL += trade.pnl || 0;
        if (runningPnL > peak) {
          peak = runningPnL;
        }
        const drawdown = peak - runningPnL;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      performanceData.push({
        strategy,
        totalTrades,
        totalPnL,
        winRate,
        avgWin,
        avgLoss,
        profitFactor,
        sharpeRatio,
        maxDrawdown,
        totalVolume
      });
    }

    // Sort by total P&L descending
    performanceData.sort((a, b) => b.totalPnL - a.totalPnL);

    return NextResponse.json(performanceData);

  } catch (error: any) {
    console.error('Portfolio performance API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}


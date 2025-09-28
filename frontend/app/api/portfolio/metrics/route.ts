import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { calculateTradingStatistics } from '@/lib/trading-statistics';

// Force dynamic rendering to avoid build-time static generation
export const dynamic = 'force-dynamic';

/**
 * Portfolio Metrics API
 * Provides aggregated trading metrics for dashboard display
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

    // Fetch only required fields for metrics calculation
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, symbol, side, quantity, price, pnl, opened_at, closed_at, asset_type')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: true });

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json({ error: 'Failed to fetch trades', details: tradesError.message }, { status: 500 });
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        totalTrades: 0,
        totalPnL: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        totalVolume: 0,
        bestTrade: 0,
        worstTrade: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        monthlyReturns: [],
        assetTypeBreakdown: {},
        recentTrades: []
      });
    }

    // Calculate metrics server-side
    const stats = calculateTradingStatistics(trades as any);

    // Get recent trades for dashboard display (last 5)
    const recentTrades = trades
      .sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime())
      .slice(0, 5)
      .map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        pnl: trade.pnl,
        opened_at: trade.opened_at,
        closed_at: trade.closed_at,
        asset_type: trade.asset_type
      }));

    return NextResponse.json({
      totalTrades: stats.totalTrades,
      totalPnL: stats.totalPnL,
      realizedPnL: stats.realizedPnL,
      unrealizedPnL: stats.unrealizedPnL,
      winRate: stats.winRate,
      sharpeRatio: stats.sharpeRatio,
      maxDrawdown: stats.maxDrawdown,
      avgWin: stats.avgWin,
      avgLoss: stats.avgLoss,
      profitFactor: stats.profitFactor,
      totalVolume: 0, // Calculate if needed
      bestTrade: 0, // Calculate if needed
      worstTrade: 0, // Calculate if needed
      consecutiveWins: 0, // Calculate if needed
      consecutiveLosses: 0, // Calculate if needed
      monthlyReturns: stats.monthlyReturns,
      assetTypeBreakdown: {},
      recentTrades
    });

  } catch (error: any) {
    console.error('Portfolio metrics API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}


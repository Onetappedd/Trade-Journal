import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { calculateTradingStatistics, Trade } from '@/lib/trading-statistics';

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TradeAnalytics {
  totalTrades: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  monthlyReturns: Array<{
    month: string;
    pnl: number;
    trades: number;
  }>;
  performanceBySymbol: Array<{
    symbol: string;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
}

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

    // Get all user trades
    console.log('Analytics API - User ID:', user.id);
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: true });

    if (error) {
      console.error('Analytics API - Error fetching trades:', error);
      throw error;
    }

    console.log('Analytics API - Trades count:', trades?.length || 0);
    console.log('Analytics API - First few trades:', trades?.slice(0, 3));

    if (!trades || trades.length === 0) {
      return NextResponse.json({
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
        monthlyReturns: [],
        performanceBySymbol: [],
      });
    }

    // Use comprehensive statistics calculation
    const statistics = calculateTradingStatistics(trades as Trade[]);

    const analytics: TradeAnalytics = {
      totalTrades: statistics.totalTrades,
      totalPnL: statistics.totalPnL,
      realizedPnL: statistics.realizedPnL,
      unrealizedPnL: statistics.unrealizedPnL,
      winRate: statistics.winRate,
      avgWin: statistics.avgWin,
      avgLoss: statistics.avgLoss,
      profitFactor: statistics.profitFactor,
      sharpeRatio: statistics.sharpeRatio,
      maxDrawdown: statistics.maxDrawdown,
      monthlyReturns: statistics.monthlyReturns,
      performanceBySymbol: statistics.performanceBySymbol,
    };

    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error calculating portfolio analytics:', error);
    return NextResponse.json({ error: 'Failed to calculate portfolio analytics' }, { status: 500 });
  }
}

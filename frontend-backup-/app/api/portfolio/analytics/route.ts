import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { marketDataService } from '@/lib/market-data';
import { calculatePositions } from '@/lib/position-tracker-server';

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

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // Get all user trades
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: true });

    if (error) {
      throw error;
    }

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

    // Get current positions for unrealized P&L (server-authenticated)
    const positions = await marketDataService.getPortfolioPositions(user.id);
    const unrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);

    // Use position tracker to compute realized P&L and stats from raw legs
    const tracker = calculatePositions(trades as any);
    const realizedClosed = tracker.closedTrades;
    const realizedPnL = tracker.stats.totalPnL;
    const totalPnL = realizedPnL + unrealizedPnL;

    // Stats
    const winRate = tracker.stats.winRate;
    const avgWin = tracker.stats.avgWin;
    const avgLoss = tracker.stats.avgLoss;
    const profitFactor = (() => {
      const wins = realizedClosed.filter((t) => t.pnl > 0);
      const losses = realizedClosed.filter((t) => t.pnl < 0);
      const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
      const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
      return grossLoss > 0 ? grossProfit / grossLoss : 0;
    })();

    // Monthly returns from realized closed trades (use exit_date synthesized by tracker)
    const monthlyMap = new Map<string, { month: string; pnl: number; trades: number }>();
    realizedClosed.forEach((trade) => {
      const month = (trade.exit_date || trade.entry_date).substring(0, 7);
      const existing = monthlyMap.get(month) || { month, pnl: 0, trades: 0 };
      existing.pnl += trade.pnl;
      existing.trades += 1;
      monthlyMap.set(month, existing);
    });
    const monthlyReturns = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    // Performance by symbol
    const symbolMap = new Map<
      string,
      { symbol: string; trades: number; pnl: number; wins: number }
    >();
    realizedClosed.forEach((trade) => {
      const existing = symbolMap.get(trade.symbol) || {
        symbol: trade.symbol,
        trades: 0,
        pnl: 0,
        wins: 0,
      };
      existing.trades += 1;
      existing.pnl += trade.pnl;
      if (trade.pnl > 0) existing.wins += 1;
      symbolMap.set(trade.symbol, existing);
    });
    const performanceBySymbol = Array.from(symbolMap.values())
      .map((item) => ({
        ...item,
        winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // Sharpe ratio (simplified) from monthlyReturns pnl series
    const returns = monthlyReturns.map((m) => m.pnl);
    const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
    const variance =
      returns.length > 1
        ? returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
        : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Max drawdown on cumulative realized P&L
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    realizedClosed.forEach((trade) => {
      runningPnL += trade.pnl;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const analytics: TradeAnalytics = {
      totalTrades: trades.length,
      totalPnL,
      realizedPnL,
      unrealizedPnL,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      monthlyReturns,
      performanceBySymbol,
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

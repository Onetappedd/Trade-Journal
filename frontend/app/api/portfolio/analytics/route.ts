import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Calculate analytics directly from trades table
    const totalTrades = trades.length;
    const closedTrades = trades.filter(trade => trade.status === 'closed');
    const openTrades = trades.filter(trade => trade.status === 'open');
    
    // Calculate realized P&L from closed trades
    const realizedPnL = closedTrades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0);
    
    // For now, set unrealized P&L to 0 (we can enhance this later with real-time prices)
    const unrealizedPnL = 0;
    const totalPnL = realizedPnL + unrealizedPnL;

    // Calculate win rate
    const winningTrades = closedTrades.filter(trade => (trade.realized_pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.realized_pnl || 0) < 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    // Calculate average win and loss
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0)) / losingTrades.length 
      : 0;

    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Calculate monthly returns
    const monthlyMap = new Map<string, { month: string; pnl: number; trades: number }>();
    closedTrades.forEach((trade) => {
      const month = trade.closed_at ? trade.closed_at.substring(0, 7) : trade.opened_at.substring(0, 7);
      const existing = monthlyMap.get(month) || { month, pnl: 0, trades: 0 };
      existing.pnl += trade.realized_pnl || 0;
      existing.trades += 1;
      monthlyMap.set(month, existing);
    });
    const monthlyReturns = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    // Performance by symbol
    const symbolMap = new Map<string, { symbol: string; trades: number; pnl: number; wins: number }>();
    closedTrades.forEach((trade) => {
      const existing = symbolMap.get(trade.symbol) || {
        symbol: trade.symbol,
        trades: 0,
        pnl: 0,
        wins: 0,
      };
      existing.trades += 1;
      existing.pnl += trade.realized_pnl || 0;
      if ((trade.realized_pnl || 0) > 0) existing.wins += 1;
      symbolMap.set(trade.symbol, existing);
    });
    const performanceBySymbol = Array.from(symbolMap.values())
      .map((item) => ({
        ...item,
        winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // Calculate Sharpe ratio (simplified)
    const returns = monthlyReturns.map((m) => m.pnl);
    const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
    const variance = returns.length > 1
      ? returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    closedTrades.forEach((trade) => {
      runningPnL += trade.realized_pnl || 0;
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

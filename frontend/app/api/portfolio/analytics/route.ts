import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
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
        performanceBySymbol: []
      });
    }

    // Calculate analytics
    const totalTrades = trades.length;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const realizedPnL = trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + (t.pnl || 0), 0);
    const unrealizedPnL = trades.filter(t => t.status === 'open').reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length : 0;
    
    const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin * winningTrades.length) / Math.abs(avgLoss * losingTrades.length) : 0;
    
    // Simple Sharpe ratio calculation (would need more sophisticated calculation in production)
    const sharpeRatio = 0; // TODO: Calculate proper Sharpe ratio
    
    // Max drawdown calculation (simplified)
    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;
    
    for (const trade of trades) {
      runningTotal += trade.pnl || 0;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Monthly returns (simplified)
    const monthlyReturns = [];
    const monthlyData = new Map();
    
    trades.forEach(trade => {
      const date = new Date(trade.entry_date || trade.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { pnl: 0, trades: 0 });
      }
      
      const monthData = monthlyData.get(monthKey);
      monthData.pnl += trade.pnl || 0;
      monthData.trades += 1;
    });
    
    for (const [month, data] of monthlyData) {
      monthlyReturns.push({
        month,
        pnl: data.pnl,
        trades: data.trades
      });
    }

    // Performance by symbol
    const symbolData = new Map();
    trades.forEach(trade => {
      if (!symbolData.has(trade.symbol)) {
        symbolData.set(trade.symbol, { pnl: 0, trades: 0, wins: 0 });
      }
      
      const symbol = symbolData.get(trade.symbol);
      symbol.pnl += trade.pnl || 0;
      symbol.trades += 1;
      if ((trade.pnl || 0) > 0) symbol.wins += 1;
    });
    
    const performanceBySymbol = Array.from(symbolData.entries()).map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      pnl: data.pnl,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
    })).sort((a, b) => b.pnl - a.pnl);

    return NextResponse.json({
      totalTrades,
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
      performanceBySymbol
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ 
      error: 'Analytics calculation failed', 
      details: error.message 
    }, { status: 500 });
  }
}
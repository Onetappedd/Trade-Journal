/**
 * SnapTrade Performance Metrics Endpoint
 * Returns win rate, average R:R, P&L from activities
 * 
 * GET /api/snaptrade/analytics/performance?userId=uuid&days=90
 * Returns: { winRate, avgRR, totalPnL, trades, wins, losses }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { snaptrade } from "@/lib/snaptrade";

export const dynamic = 'force-dynamic'

interface Trade {
  symbol: string;
  buyDate: string;
  sellDate: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '90');

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId parameter required' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's SnapTrade credentials
    const { data: snaptradeUser } = await supabase
      .from('snaptrade_users')
      .select('st_user_id, st_user_secret')
      .eq('user_id', userId)
      .single();

    if (!snaptradeUser) {
      return NextResponse.json({ 
        error: 'User not registered with SnapTrade' 
      }, { status: 404 });
    }

    // Get all accounts
    const { data: accounts } = await supabase
      .from('snaptrade_accounts')
      .select('account_id')
      .eq('user_id', userId);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        winRate: 0,
        avgRR: 0,
        totalPnL: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0
      });
    }

    // Calculate date range
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    // Fetch activities (buys/sells) for each account
    const allActivities: any[] = [];

    for (const account of accounts) {
      try {
        const response = await snaptrade.transactionsAndReporting.getActivities({
          userId: snaptradeUser.st_user_id,
          userSecret: snaptradeUser.st_user_secret,
          accounts: account.account_id,
          startDate,
          endDate
        } as any);

        allActivities.push(...response.data);
      } catch (error) {
        console.error(`Failed to fetch activities for account ${account.account_id}:`, error);
      }
    }

    // Parse trades from activities (match buys with sells)
    const trades = parseTradesFromActivities(allActivities);

    // Calculate metrics
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

    const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0;
    const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0;

    return NextResponse.json({
      // Core metrics
      winRate,
      avgRR,
      totalPnL,
      trades: trades.length,
      wins: wins.length,
      losses: losses.length,
      
      // Detailed metrics
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      profitFactor,
      
      // Breakdown
      totalWins,
      totalLosses,
      
      // Recent trades (last 10)
      recentTrades: trades.slice(-10).reverse()
    });

  } catch (error: any) {
    console.error('Performance metrics fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch performance metrics',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Parse trades from buy/sell activities
 * Uses FIFO matching to pair buys with sells
 */
function parseTradesFromActivities(activities: any[]): Trade[] {
  const trades: Trade[] = [];
  
  // Group by symbol
  const bySymbol = new Map<string, any[]>();
  
  for (const activity of activities) {
    const symbol = activity.symbol?.symbol || 'Unknown';
    const type = activity.type?.toLowerCase();
    
    // Only process buy/sell activities
    if (type !== 'buy' && type !== 'sell') continue;
    
    if (!bySymbol.has(symbol)) {
      bySymbol.set(symbol, []);
    }
    bySymbol.get(symbol)!.push({
      ...activity,
      date: activity.trade_date || activity.settlement_date,
      price: activity.price || 0,
      quantity: Math.abs(activity.quantity || 0),
      fees: activity.fee || 0,
      isBuy: type === 'buy'
    });
  }

  // Match buys with sells using FIFO
  for (const [symbol, acts] of bySymbol.entries()) {
    const sorted = acts.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const buyQueue: any[] = [];
    
    for (const act of sorted) {
      if (act.isBuy) {
        buyQueue.push(act);
      } else {
        // Sell - match with oldest buy
        let sellQty = act.quantity;
        
        while (sellQty > 0 && buyQueue.length > 0) {
          const buy = buyQueue[0];
          const matchQty = Math.min(sellQty, buy.quantity);
          
          const pnl = (act.price - buy.price) * matchQty - (act.fees + buy.fees);
          const pnlPercent = buy.price > 0 ? ((act.price - buy.price) / buy.price) * 100 : 0;
          
          trades.push({
            symbol,
            buyDate: buy.date,
            sellDate: act.date,
            quantity: matchQty,
            buyPrice: buy.price,
            sellPrice: act.price,
            pnl,
            pnlPercent,
            fees: act.fees + buy.fees
          });
          
          buy.quantity -= matchQty;
          sellQty -= matchQty;
          
          if (buy.quantity <= 0) {
            buyQueue.shift();
          }
        }
      }
    }
  }

  return trades;
}

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Dummy API] Returning analytics overview dummy data');
  }
  return NextResponse.json({
    netProfit: 12500.50,
    grossProfit: 15000.00,
    grossLoss: -2500.00,
    profitFactor: 6.0,
    totalTrades: 150,
    winningTrades: 100,
    losingTrades: 50,
    winRate: 0.6667,
    avgProfitPerTrade: 125.01,
    avgLossPerTrade: -50.00,
    maxDrawdown: -1500.00,
    maxDrawdownDate: "2024-03-15",
    recoveryFactor: 8.33,
    sharpeRatio: 1.25,
    avgRR: 2.5,
    longestWinningStreak: 8,
    longestLosingStreak: 5,
    commissionsFees: -150.00
  });
}

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryType = searchParams.get('categoryType') || 'strategyTag';
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Dummy API] Returning analytics performance by category dummy data for ${categoryType}`);
  }
  return NextResponse.json([
    { category: "Scalping", netProfit: 5000, winRate: 0.70, totalTrades: 70 },
    { category: "Breakout", netProfit: 3000, winRate: 0.60, totalTrades: 50 },
    { category: "Reversal", netProfit: -500, winRate: 0.45, totalTrades: 30 }
  ]);
}

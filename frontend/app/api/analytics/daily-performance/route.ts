import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Dummy API] Returning analytics daily performance dummy data');
  }
  return NextResponse.json([
    { date: "2024-01-01", cumulativePnl: 0, dailyPnl: 0 },
    { date: "2024-01-02", cumulativePnl: 150, dailyPnl: 150 },
    { date: "2024-01-03", cumulativePnl: 120, dailyPnl: -30 },
    { date: "2024-01-04", cumulativePnl: 200, dailyPnl: 80 },
    { date: "2024-01-05", cumulativePnl: 180, dailyPnl: -20 },
    { date: "2024-01-06", cumulativePnl: 250, dailyPnl: 70 },
    { date: "2024-01-07", cumulativePnl: 300, dailyPnl: 50 },
    { date: "2024-01-08", cumulativePnl: 280, dailyPnl: -20 },
    { date: "2024-01-09", cumulativePnl: 350, dailyPnl: 70 },
    { date: "2024-01-10", cumulativePnl: 400, dailyPnl: 50 }
  ]);
}

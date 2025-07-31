import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Dummy API] Returning dummy trade tag suggestions');
  }
  return NextResponse.json([
    "Scalping",
    "Breakout",
    "Reversal",
    "FOMO",
    "Overtrading",
    "Trend Following",
    "Risk Management Issue",
    "News Play",
    "Earnings",
    "Momentum"
  ]);
}

import { type NextRequest, NextResponse } from 'next/server';
import { requireProAccess, createSubscriptionRequiredResponse } from '@/lib/server-access-control';
import { emitUsageEvent } from '@/lib/usage-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mock analytics data
const mockAnalytics = {
  summary: {
    total_trades: 156,
    winning_trades: 89,
    losing_trades: 67,
    win_rate: 57.05,
    total_pnl: 12450.75,
    avg_win: 245.3,
    avg_loss: -156.8,
    profit_factor: 1.56,
    sharpe_ratio: 1.23,
    max_drawdown: -2340.5,
    total_volume: 1250000,
    avg_hold_time: '2.3 days',
  },
  monthly_pnl: [
    { month: '2024-01', pnl: 2340.5, trades: 23 },
    { month: '2024-02', pnl: 1890.25, trades: 19 },
    { month: '2024-03', pnl: 3120.75, trades: 28 },
    { month: '2024-04', pnl: -890.3, trades: 15 },
    { month: '2024-05', pnl: 2450.8, trades: 22 },
    { month: '2024-06', pnl: 3538.75, trades: 31 },
  ],
  top_symbols: [
    { symbol: 'AAPL', trades: 23, pnl: 3450.75, win_rate: 65.2 },
    { symbol: 'TSLA', trades: 18, pnl: 2890.5, win_rate: 61.1 },
    { symbol: 'NVDA', trades: 15, pnl: 2340.25, win_rate: 60.0 },
    { symbol: 'MSFT', trades: 12, pnl: 1890.75, win_rate: 58.3 },
    { symbol: 'GOOGL', trades: 10, pnl: 1560.5, win_rate: 70.0 },
  ],
  asset_allocation: [
    { asset_type: 'stocks', percentage: 75.5, pnl: 9340.5 },
    { asset_type: 'options', percentage: 20.2, pnl: 2890.25 },
    { asset_type: 'crypto', percentage: 4.3, pnl: 220.0 },
  ],
  recent_performance: [
    { date: '2024-06-01', pnl: 234.5, cumulative_pnl: 12450.75 },
    { date: '2024-05-31', pnl: -89.25, cumulative_pnl: 12216.25 },
    { date: '2024-05-30', pnl: 456.8, cumulative_pnl: 12305.5 },
    { date: '2024-05-29', pnl: 123.45, cumulative_pnl: 11848.7 },
    { date: '2024-05-28', pnl: -67.3, cumulative_pnl: 11725.25 },
  ],
};

export async function GET(request: NextRequest) {
  try {
    // Check Pro access for analytics
    const { userId } = await requireProAccess(request);
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const userParam = searchParams.get('user_id');

    // Track usage for Pro feature
    try {
      await emitUsageEvent(userId, 'analytics_query', {
        query_type: 'analytics_summary',
        period,
        timestamp: new Date().toISOString()
      });
    } catch (usageError) {
      console.error('Failed to track usage:', usageError);
      // Don't fail the request if usage tracking fails
    }

    // In a real app, you would filter by user_id and period
    // For now, return mock data

    return NextResponse.json({
      data: mockAnalytics,
      meta: {
        period,
        user_id: userParam || userId,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Pro access required')) {
      return createSubscriptionRequiredResponse();
    }
    
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

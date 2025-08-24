import { DashboardStatsSimple } from '@/components/dashboard/DashboardStatsSimple';
import { PortfolioPerformance } from '@/components/dashboard/PortfolioPerformance';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { PositionsTable } from '@/components/dashboard/PositionsTable';
import { ExpiredOptionsAlert } from '@/components/dashboard/ExpiredOptionsAlert';
import { getPortfolioStats } from '@/lib/metrics';
import { getDashboardMetrics } from '@/lib/dashboard-metrics';
import { calculatePortfolioHistory } from '@/lib/portfolio-history-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
import { updateExpiredOptionsTrades } from '@/lib/trades/updateExpiredOptions';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Get current user
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check and update expired options on dashboard load
  if (user) {
    try {
      await updateExpiredOptionsTrades(user.id);
    } catch (error) {
      console.error('Failed to update expired options:', error);
    }
  }

  // Get comprehensive dashboard metrics
  const metrics = user ? await getDashboardMetrics(user.id) : null;

  // Get portfolio stats for other components
  const stats = user
    ? await getPortfolioStats(user.id)
    : {
        totalValue: 0,
        totalPnL: 0,
        winRate: 0,
        activePositions: 0,
        monthlyEquity: [],
        recentTrades: [],
        todayPnL: 0,
        weekPnL: 0,
        monthPnL: 0,
      };

  // Use comprehensive metrics if available, otherwise fall back to basic stats
  const dashboardStats = metrics
    ? {
        totalValue: metrics.totalPortfolioValue,
        totalPnL: metrics.totalPnL,
        winRate: metrics.winRate,
        activePositions: metrics.activePositions,
        todayPnL: metrics.todayPnL,
        weekPnL: metrics.weekPnL,
        monthPnL: metrics.monthPnL,
      }
    : stats;

  // Get portfolio history for the performance chart
  const portfolioHistory = user ? await calculatePortfolioHistory(user.id) : [];

  // Get user's initial capital for the chart
  const { data: settings } = user
    ? await supabase.from('user_settings').select('initial_capital').eq('user_id', user.id).single()
    : { data: null };

  const initialCapital = settings?.initial_capital || 10000;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's your trading overview.</p>
      </div>

      {/* Expired Options Alert */}
      <ExpiredOptionsAlert />

      <DashboardStatsSimple stats={dashboardStats} />

      {/* Robinhood-style Portfolio Performance Chart */}
      <PortfolioPerformance data={portfolioHistory} initialValue={initialCapital} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RecentTrades trades={stats.recentTrades} />
        </div>
        <div className="col-span-3">
          <AlertsPanel />
        </div>
      </div>

      {/* Open Positions with Real-Time Prices */}
      <PositionsTable />
    </div>
  );
}

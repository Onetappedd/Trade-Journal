import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { PerformanceChart } from "@/components/dashboard/PerformanceChart"
import { RecentTrades } from "@/components/dashboard/RecentTrades"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"
import { PositionsTable } from "@/components/dashboard/PositionsTable"
import { getPortfolioStats } from "@/lib/metrics"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Get current user
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get portfolio stats
  const stats = user ? await getPortfolioStats(user.id) : {
    totalValue: 0,
    totalPnL: 0,
    winRate: 0,
    activePositions: 0,
    monthlyEquity: [],
    recentTrades: [],
    todayPnL: 0,
    weekPnL: 0,
    monthPnL: 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's your trading overview.</p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <PerformanceChart data={stats.monthlyEquity} />
        </div>
        <div className="col-span-3">
          <QuickActions />
        </div>
      </div>

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
  )
}
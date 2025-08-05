import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { PerformanceChart } from "@/components/dashboard/PerformanceChart"
import { RecentTrades } from "@/components/dashboard/RecentTrades"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's your trading overview.</p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <PerformanceChart />
        </div>
        <div className="col-span-3">
          <QuickActions />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RecentTrades />
        </div>
        <div className="col-span-3">
          <AlertsPanel />
        </div>
      </div>
    </div>
  )
}
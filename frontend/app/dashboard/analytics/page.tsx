"use client"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters"
import { EquityCurveChart } from "@/components/analytics/EquityCurveChart"
import { PnLByMonthChart } from "@/components/analytics/PnLByMonthChart"
import { WinRateChart } from "@/components/analytics/WinRateChart"
import { TradeDistributionChart } from "@/components/analytics/TradeDistributionChart"
import { StrategyMetrics } from "@/components/analytics/StrategyMetrics"
import { TopTrades } from "@/components/analytics/TopTrades"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Deep dive into your trading performance and metrics</p>
      </div>

      <AnalyticsFilters />

      <div className="grid gap-6 md:grid-cols-2">
        <EquityCurveChart />
        <PnLByMonthChart />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <WinRateChart />
        <TradeDistributionChart />
        <StrategyMetrics />
      </div>

      <TopTrades />
    </div>
  )
}

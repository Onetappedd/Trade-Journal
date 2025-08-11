// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters"
import { EquityCurveChart } from "@/components/analytics/EquityCurveChart"
import { PnLByMonthChart } from "@/components/analytics/PnLByMonthChart"
import { WinRateChart } from "@/components/analytics/WinRateChart"
import { TradeDistributionChart } from "@/components/analytics/TradeDistributionChart"
import { StrategyMetrics } from "@/components/analytics/StrategyMetrics"
import { TopTrades } from "@/components/analytics/TopTrades"
import { PerformanceComparisonNew } from "@/components/analytics/PerformanceComparisonNew"
import { getAnalyticsData } from "@/lib/analytics-metrics"
import { notFound } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function AnalyticsPage({ searchParams }: { searchParams?: Record<string,string> }) {
  // Get current user
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Map search params to filter
  const assetType = searchParams?.assetType as any
  const strategy = searchParams?.strategy || undefined
  const time = searchParams?.time || 'all'
  const start = searchParams?.start
  const end = searchParams?.end

  // Derive start/end from time if not custom
  let rangeStart: string | undefined = start
  let rangeEnd: string | undefined = end
  if (time && time !== 'custom' && time !== 'all') {
    const now = new Date()
    const d = new Date(now)
    if (time === '1m') d.setMonth(d.getMonth() - 1)
    if (time === '3m') d.setMonth(d.getMonth() - 3)
    if (time === '6m') d.setMonth(d.getMonth() - 6)
    if (time === '1y') d.setFullYear(d.getFullYear() - 1)
    rangeStart = d.toISOString()
    rangeEnd = now.toISOString()
  } else if (time === 'all') {
    rangeStart = undefined
    rangeEnd = undefined
  }

  // Get analytics data
  const analytics = user ? await getAnalyticsData(user.id, {
    assetType: assetType && assetType !== 'all' ? assetType : undefined,
    strategy: strategy && strategy !== 'all' ? strategy : undefined,
    start: rangeStart,
    end: rangeEnd,
  }) : {
    pnlByMonth: [],
    equityCurve: [],
    tradeDistribution: [],
    strategyMetrics: {
      expectancy: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgHoldTime: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
    },
    bestTrades: [],
    worstTrades: [],
    winRate: 0,
    totalTrades: 0,
    totalPnL: 0,
    wins: 0,
    losses: 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Deep dive into your trading performance and metrics</p>
      </div>

      <AnalyticsFilters />

      <div className="grid gap-6 md:grid-cols-2">
        <EquityCurveChart 
          data={analytics.equityCurve} 
          initialValue={analytics.initialCapital || 10000}
        />
        <PnLByMonthChart data={analytics.pnlByMonth} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <WinRateChart 
          winRate={analytics.winRate} 
          totalTrades={analytics.totalTrades}
          wins={analytics.wins || 0}
          losses={analytics.losses || 0}
        />
        <TradeDistributionChart data={analytics.tradeDistribution} />
        <StrategyMetrics metrics={analytics.strategyMetrics} />
      </div>

      <TopTrades bestTrades={analytics.bestTrades} worstTrades={analytics.worstTrades} />
      
      {/* Performance Comparison Section */}
      <PerformanceComparisonNew 
        portfolioData={analytics.equityCurve}
        initialCapital={analytics.initialCapital || 10000}
        closedTrades={analytics.closedTrades || []}
      />
    </div>
  )
}
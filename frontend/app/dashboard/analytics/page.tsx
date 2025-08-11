// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters"
import { EquityCurveChart } from "@/components/analytics/EquityCurveChart"
import { PnLByMonthChart } from "@/components/analytics/PnLByMonthChart"
import { getUnifiedAnalytics } from "@/lib/analytics-server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function AnalyticsPage({ searchParams }: { searchParams?: Record<string,string> }) {
  // Get current user (guard against missing env or session)
  let userId: string | null = null
  try {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    if (url && key) {
      const supabase = createServerClient(url, key, { cookies: { getAll: () => cookieStore.getAll() } })
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    }
  } catch {}

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

  // Fetch unified analytics, but never throw SSR errors
  let unified: any = null
  if (userId) {
    try {
      unified = await getUnifiedAnalytics({
        userId,
        assetType: assetType && assetType !== 'all' ? assetType : undefined,
        strategy: strategy && strategy !== 'all' ? strategy : undefined,
        start: rangeStart,
        end: rangeEnd,
      })
    } catch (e) {
      unified = null
    }
  }

  const equity = unified?.equity || { points: [], initialBalance: 10000, finalBalance: 10000, pctReturn: 0 }
  const monthly = unified?.monthly || { months: [], totals: {} }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Deep dive into your trading performance and metrics</p>
      </div>

      <AnalyticsFilters />

      <div className="grid gap-6 md:grid-cols-2">
        <EquityCurveChart 
          data={equity.points}
          initialValue={equity.initialBalance}
          finalValue={equity.finalBalance}
          pctReturn={equity.pctReturn}
        />
        <PnLByMonthChart 
          months={monthly.months}
          totals={monthly.totals}
        />
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useAuth } from "@/components/auth/auth-provider"
import { analyticsEquityCurve, analyticsMonthlyPnl, analyticsCards, analyticsCosts, analyticsTrades } from "@/lib/edge-invoke"
import { useAnalyticsFilters } from "@/store/analytics-filters"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { checkSupabaseEnv } from "@/lib/env-guard"
import { useToast } from "@/components/ui/use-toast"

function DevBanner({ user }: { user: any }) {
  if (process.env.NODE_ENV !== "development" || !user) return null
  return (
    <div style={{ background: "#222", color: "#fff", padding: 8, fontSize: 12 }}>
      <span>User: {user.email || "?"}</span>
      <Button size="sm" style={{ marginLeft: 16 }} onClick={async () => {
        const supabase = getSupabaseBrowserClient()
        await supabase.auth.refreshSession()
        window.location.reload()
      }}>Refresh Token</Button>
    </div>
  )
}

export default function AnalyticsPage() {
  const supabase = getSupabaseBrowserClient()
  const { user, loading } = useAuth()
  const [reauth, setReauth] = useState(false)
  const store = useAnalyticsFilters()
  const filters = store.getRequestFilters()
  const filtersHash = JSON.stringify(filters)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  if (loading) return <div>Loading...</div>
  if (!user || reauth) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-2">Sign in to view analytics</h2>
        <Button
          onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
        >
          Sign In with Google
        </Button>
      </div>
    )
  }

  // Widget fetchers using React Query and callAnalytics
  const equityQuery = useQuery({
    queryKey: ["analytics", filtersHash, "equity-curve"],
    queryFn: () => analyticsEquityCurve(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!user
  })
  const monthlyQuery = useQuery({
    queryKey: ["analytics", filtersHash, "monthly-pnl"],
    queryFn: () => analyticsMonthlyPnl(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!user
  })
  const cardsQuery = useQuery({
    queryKey: ["analytics", filtersHash, "cards"],
    queryFn: () => analyticsCards(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!user
  })
  const costsQuery = useQuery({
    queryKey: ["analytics", filtersHash, "costs"],
    queryFn: () => analyticsCosts(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!user
  })
  const tradesQuery = useQuery({
    queryKey: ["analytics", filtersHash, "trades"],
    queryFn: () => analyticsTrades(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!user
  })

  // 401 session expired handling
  if ([equityQuery, monthlyQuery, cardsQuery, costsQuery, tradesQuery].some(q => q.error?.status === 401)) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-2">Session expired</h2>
        <Button
          onClick={async () => {
            await supabase.auth.refreshSession()
            setReauth(false)
            queryClient.invalidateQueries()
          }}
        >
          Reauthenticate
        </Button>
      </div>
    )
  }

  return (
    <>
      <DevBanner user={user} />
      <div className="p-4">
        <Card>
          <CardContent>
            <div>Equity Curve: {equityQuery.isLoading ? "Loading..." : JSON.stringify(equityQuery.data)}</div>
            <div>Monthly PnL: {monthlyQuery.isLoading ? "Loading..." : JSON.stringify(monthlyQuery.data)}</div>
            <div>Cards: {cardsQuery.isLoading ? "Loading..." : JSON.stringify(cardsQuery.data)}</div>
            <div>Costs: {costsQuery.isLoading ? "Loading..." : JSON.stringify(costsQuery.data)}</div>
            <div>Trades: {tradesQuery.isLoading ? "Loading..." : JSON.stringify(tradesQuery.data)}</div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

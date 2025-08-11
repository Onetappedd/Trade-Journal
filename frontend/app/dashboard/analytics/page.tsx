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

function DevBanner({ session }: { session: any }) {
  if (process.env.NODE_ENV !== "development" || !session) return null
  const exp = session?.expires_at ? new Date(session.expires_at * 1000) : null
  return (
    <div style={{ background: "#222", color: "#fff", padding: 8, fontSize: 12 }}>
      <span>User: {session.user?.email || "?"}</span>
      <span style={{ marginLeft: 16 }}>Token exp: {exp ? exp.toLocaleString() : "?"}</span>
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
    enabled: !!session
  })
  const monthlyQuery = useQuery({
    queryKey: ["analytics", filtersHash, "monthly-pnl"],
    queryFn: () => analyticsMonthlyPnl(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!session
  })
  const cardsQuery = useQuery({
    queryKey: ["analytics", filtersHash, "cards"],
    queryFn: () => analyticsCards(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!session
  })
  const costsQuery = useQuery({
    queryKey: ["analytics", filtersHash, "costs"],
    queryFn: () => analyticsCosts(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!session
  })
  const tradesQuery = useQuery({
    queryKey: ["analytics", filtersHash, "trades"],
    queryFn: () => analyticsTrades(filters),
    retry: (fails, err: any) => (err?.status === 401 ? false : fails < 2),
    enabled: !!session
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
      <DevBanner session={{ user }} />
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

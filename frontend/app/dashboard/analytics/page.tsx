"use client"

import React, { useEffect, useMemo, useState } from "react"
import { FiltersBar } from "./_components/FiltersBar"
import { PerformanceTab } from "./_components/tabs/PerformanceTab"
import { createClient } from "@/lib/supabase"
import Link from "next/link"
import { SymbolsTagsTab } from "./_components/tabs/SymbolsTagsTab"
import { TimeHabitsTab } from "./_components/tabs/TimeHabitsTab"
import { RiskCostsTab } from "./_components/tabs/RiskCostsTab"
import { TradeQualityTab } from "./_components/tabs/TradeQualityTab"
import { ErrorBoundary } from "./_components/ErrorBoundary"
import { useFiltersStore } from "@/lib/analytics/filtersStore"

// Accessible Tabs implementation
const TABS = [
  { id: "performance", label: "Performance" },
  { id: "symbols-tags", label: "Symbols & Tags" },
  { id: "time-habits", label: "Time & Habits" },
  { id: "risk-costs", label: "Risk & Costs" },
  { id: "trade-quality", label: "Trade Quality" },
] as const

type TabId = typeof TABS[number]["id"]

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("performance")
  const [authed, setAuthed] = useState<boolean | null>(null)

  // Auth guard
  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data }) => setAuthed(!!data.session)).catch(() => setAuthed(false))
  }, [])

  // Init default timezone in store (browser timezone)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  const setTimezone = useAnalyticsFiltersStore(s => s.setTimezone)
  useEffect(() => { setTimezone(timezone) }, [timezone, setTimezone])

  if (authed === null) return <div className="p-6">Loading…</div>
  if (authed === false) return (
    <div className="p-6 border rounded-md">
      <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
      <p className="text-muted-foreground mb-3">Please sign in to view your analytics.</p>
      <Link href="/login" className="inline-block px-3 py-1 rounded-md border bg-muted">Go to Login</Link>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Persistent Filter Bar */}
      <FiltersBar />

      {/* Tabs */}
      <div>
        <div role="tablist" aria-label="Analytics Sections" className="flex flex-wrap gap-2 border-b">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              tabIndex={activeTab === t.id ? 0 : -1}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 text-sm rounded-t-md transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                activeTab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        <div className="py-4">
          <section
            role="tabpanel"
            id="panel-performance"
            aria-labelledby="tab-performance"
            hidden={activeTab !== "performance"}
            className="outline-none"
          >
            <ErrorBoundary>
              <PerformanceTab />
            </ErrorBoundary>
          </section>

          <section
            role="tabpanel"
            id="panel-symbols-tags"
            aria-labelledby="tab-symbols-tags"
            hidden={activeTab !== "symbols-tags"}
            className="outline-none"
          >
            <ErrorBoundary>
              <SymbolsTagsTab />
            </ErrorBoundary>
          </section>

          <section
            role="tabpanel"
            id="panel-time-habits"
            aria-labelledby="tab-time-habits"
            hidden={activeTab !== "time-habits"}
            className="outline-none"
          >
            <ErrorBoundary>
              <TimeHabitsTab />
            </ErrorBoundary>
          </section>

          <section
            role="tabpanel"
            id="panel-risk-costs"
            aria-labelledby="tab-risk-costs"
            hidden={activeTab !== "risk-costs"}
            className="outline-none"
          >
            <ErrorBoundary>
              <RiskCostsTab />
            </ErrorBoundary>
          </section>

          <section
            role="tabpanel"
            id="panel-trade-quality"
            aria-labelledby="tab-trade-quality"
            hidden={activeTab !== "trade-quality"}
            className="outline-none"
          >
            <ErrorBoundary>
              <TradeQualityTab />
            </ErrorBoundary>
          </section>
        </div>
      </div>
    </div>
  )
}

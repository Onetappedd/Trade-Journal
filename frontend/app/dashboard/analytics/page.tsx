"use client"

import React from "react"
import { useAnalyticsFiltersStore } from "@/store/analytics-filters"

// --- Placeholder Components ---
const Skeleton = ({ height = 32 }) => (
  <div className="bg-gray-200 animate-pulse rounded" style={{ height }} />
)

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  // TODO: Implement real error boundary
  return <>{children}</>
}

// --- Header & Filters ---
function AnalyticsHeader() {
  const filters = useAnalyticsFiltersStore()
  return (
    <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
      <div className="text-2xl font-bold">Analytics</div>
      {/* TODO: Date presets, account multi-select, asset chips, strategy/tag, ticker, timezone, compare, benchmark, save view */}
      <div className="flex flex-wrap gap-2">
        <Skeleton height={36} />
        <Skeleton height={36} />
        <Skeleton height={36} />
        <Skeleton height={36} />
        <Skeleton height={36} />
      </div>
    </div>
  )
}

// --- KPI Cards ---
function KpiCardsRow() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2 mb-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-3 flex flex-col items-center">
          <Skeleton height={24} />
          <div className="w-full mt-2"><Skeleton height={16} /></div>
        </div>
      ))}
    </div>
  )
}

// --- Equity & Drawdown ---
function EquityDrawdownRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-white rounded-lg shadow p-4 col-span-2">
        <Skeleton height={180} />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <Skeleton height={60} />
      </div>
    </div>
  )
}

// --- Monthly PnL ---
function MonthlyPnlRow() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <Skeleton height={120} />
    </div>
  )
}

// --- Breakdowns Tabs ---
function BreakdownsRow() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <Skeleton height={40} />
      <div className="mt-2"><Skeleton height={80} /></div>
    </div>
  )
}

// --- Distributions & Trade Quality ---
function DistributionsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="bg-white rounded-lg shadow p-4">
        <Skeleton height={100} />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <Skeleton height={100} />
      </div>
    </div>
  )
}

// --- Time Analytics ---
function TimeAnalyticsRow() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <Skeleton height={120} />
    </div>
  )
}

// --- Costs & Efficiency ---
function CostsRow() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <Skeleton height={80} />
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-2 py-4 max-w-7xl">
      <AnalyticsHeader />
      <ErrorBoundary>
        <KpiCardsRow />
        <EquityDrawdownRow />
        <MonthlyPnlRow />
        <BreakdownsRow />
        <DistributionsRow />
        <TimeAnalyticsRow />
        <CostsRow />
      </ErrorBoundary>
    </div>
  )
}

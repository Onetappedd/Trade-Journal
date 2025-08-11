"use client"
import React, { useState } from "react"

const TABS = [
  { key: "performance", label: "Performance" },
  { key: "symbols", label: "Symbols & Tags" },
  { key: "time", label: "Time & Habits" },
  { key: "risk", label: "Risk & Costs" },
  { key: "quality", label: "Trade Quality" },
]

function TabBar({ active, setActive }: { active: string; setActive: (key: string) => void }) {
  return (
    <nav className="flex overflow-x-auto border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`px-4 py-3 whitespace-nowrap font-medium tk-heading transition-colors duration-150
            ${active === tab.key
              ? "bg-[hsl(var(--background))] rounded-t-xl border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"}
          `}
          onClick={() => setActive(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

function PerformanceTab() {
  return (
    <section className="tk-card p-4 md:p-6 mb-6">
      <h2 className="tk-heading text-lg md:text-xl mb-3">Net P&L</h2>
      <p className="tk-subtle text-sm mb-4">Net P&L (after fees)</p>
      {/* TODO: Stat card for Net P&L */}
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Equity Curve</h2>
        <p className="tk-subtle text-sm mb-4">Portfolio equity over time</p>
        {/* TODO: Area chart for equity curve with gradient fill, tooltips, % toggle */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Drawdown</h2>
        <p className="tk-subtle text-sm mb-4">Max Drawdown: -X%</p>
        {/* TODO: Drawdown chart or stat */}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="tk-card p-4">
          <span className="tk-subtle text-xs uppercase">Sharpe Ratio</span>
          {/* TODO: Sharpe value */}
        </div>
        <div className="tk-card p-4">
          <span className="tk-subtle text-xs uppercase">Sortino Ratio</span>
          {/* TODO: Sortino value */}
        </div>
      </div>
    </section>
  )
}

function SymbolsTab() {
  return (
    <section className="tk-card p-4 md:p-6 mb-6">
      <h2 className="tk-heading text-lg md:text-xl mb-3">Top Gainers & Losers</h2>
      <p className="tk-subtle text-sm mb-4">Symbols with highest/lowest P&L</p>
      {/* TODO: Table for gainers/losers */}
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Most Active Symbols</h2>
        <p className="tk-subtle text-sm mb-4">Symbols traded most frequently</p>
        {/* TODO: Table/list for most active symbols */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Tag Performance</h2>
        <p className="tk-subtle text-sm mb-4">Performance by strategy/tag</p>
        {/* TODO: Table for tag performance */}
      </div>
    </section>
  )
}

function TimeTab() {
  return (
    <section className="tk-card p-4 md:p-6 mb-6">
      <h2 className="tk-heading text-lg md:text-xl mb-3">Weekday Heatmap</h2>
      <p className="tk-subtle text-sm mb-4">Performance by day of week/hour</p>
      {/* TODO: Heatmap chart */}
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Win Rates by Hour</h2>
        <p className="tk-subtle text-sm mb-4">Win % by trade initiation hour</p>
        {/* TODO: Bar chart for win rates by hour */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Session Performance</h2>
        <p className="tk-subtle text-sm mb-4">Performance by session</p>
        {/* TODO: Line chart or distribution for session performance */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Trade Frequency</h2>
        <p className="tk-subtle text-sm mb-4">Trades by time bucket</p>
        {/* TODO: Chart for trade frequency */}
      </div>
    </section>
  )
}

function RiskTab() {
  return (
    <section className="tk-card p-4 md:p-6 mb-6">
      <h2 className="tk-heading text-lg md:text-xl mb-3">Max Drawdown</h2>
      <p className="tk-subtle text-sm mb-4">Largest peak-to-trough decline</p>
      {/* TODO: Drawdown chart/stat */}
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Volatility</h2>
        <p className="tk-subtle text-sm mb-4">Volatility of returns</p>
        {/* TODO: Volatility chart/stat */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Position Sizing</h2>
        <p className="tk-subtle text-sm mb-4">Average and largest position size</p>
        {/* TODO: Position sizing chart/stat */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Fee/Cost Breakdown</h2>
        <p className="tk-subtle text-sm mb-4">Fees paid by category/asset</p>
        {/* TODO: Fee/cost breakdown chart/stat */}
      </div>
    </section>
  )
}

function QualityTab() {
  return (
    <section className="tk-card p-4 md:p-6 mb-6">
      <h2 className="tk-heading text-lg md:text-xl mb-3">Expectancy</h2>
      <p className="tk-subtle text-sm mb-4">Average P&L per trade</p>
      {/* TODO: Expectancy stat */}
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Profit Factor</h2>
        <p className="tk-subtle text-sm mb-4">Gross profit to gross loss ratio</p>
        {/* TODO: Profit factor stat/gauge */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">R-Multiples Distribution</h2>
        <p className="tk-subtle text-sm mb-4">Distribution of trade outcomes in R</p>
        {/* TODO: R-multiples histogram */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Holding Time</h2>
        <p className="tk-subtle text-sm mb-4">Average and distribution of holding times</p>
        {/* TODO: Holding time chart/stat */}
      </div>
      <div className="mb-6">
        <h2 className="tk-heading text-lg md:text-xl mb-3">Win/Loss Stats</h2>
        <p className="tk-subtle text-sm mb-4">Win rate, avg win, avg loss</p>
        {/* TODO: Win/loss stats */}
      </div>
    </section>
  )
}

function TabContent({ active }: { active: string }) {
  if (active === "performance") return <PerformanceTab />
  if (active === "symbols") return <SymbolsTab />
  if (active === "time") return <TimeTab />
  if (active === "risk") return <RiskTab />
  if (active === "quality") return <QualityTab />
  return null
}

import { useAnalyticsFiltersStore } from '@/store/analytics-filters'
function AnalyticsFilterBar() {
  const filters = useAnalyticsFiltersStore()
  // Placeholder controls for now
  return (
    <div className="flex flex-wrap gap-2 items-center mb-4 bg-[hsl(var(--card))] rounded-xl p-3 border border-[hsl(var(--border))]">
      {/* Date Range Picker */}
      <div className="tk-chip">Date: <span className="font-medium">1M</span></div>
      {/* Asset Class Selector */}
      <div className="tk-chip">Asset Classes: <span className="font-medium">Stocks, Options</span></div>
      {/* Accounts Selector */}
      <div className="tk-chip">Accounts: <span className="font-medium">All</span></div>
      {/* Tags/Strategies Selector */}
      <div className="tk-chip">Tags: <span className="font-medium">All</span></div>
      {/* Symbol Search */}
      <div className="tk-chip">Symbol: <span className="font-medium">All</span></div>
      {/* Timezone Override */}
      <div className="tk-chip">TZ: <span className="font-medium">{filters.userTimezone || 'Local'}</span></div>
      {/* Reset/Clear All */}
      <button className="ml-auto tk-chip bg-transparent border-none text-xs cursor-pointer hover:ring-2" onClick={filters.resetFilters}>Clear All</button>
    </div>
  )
}

export default function AnalyticsTabbedPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  return (
    <div className="mx-auto w-full max-w-[1300px] px-4 lg:px-6 py-6 lg:py-8">
      <AnalyticsFilterBar />
      <TabBar active={activeTab} setActive={setActiveTab} />
      <TabContent active={activeTab} />
    </div>
  )
}

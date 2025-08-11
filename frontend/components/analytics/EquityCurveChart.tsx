"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { cn } from "@/lib/utils"
import { useAnalyticsFilters } from "@/store/analytics-filters"
import { Button } from "@/components/ui/button"

const FILTERS = [
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "YTD", value: "ytd" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
]

function getYtdRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return { start: start.toISOString(), end: now.toISOString() }
}

export function EquityCurveChart({ data, initialValue = 10000, finalValue = 10000, pctReturn = 0 }) {
  const filters = useAnalyticsFilters()

  // Filter buttons logic
  const handleFilter = (v: string) => {
    if (v === "ytd") {
      filters.setTimeRange("custom")
      filters.setDates(new Date(getYtdRange().start), new Date(getYtdRange().end))
    } else {
      filters.setTimeRange(v)
    }
  }

  // Prepare chart data (no weekend gaps, daily points)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    // Fill missing days (flat equity)
    const points = []
    let prevEquity = initialValue
    let prevDate = null
    for (let i = 0; i < data.length; ++i) {
      const { t, equity } = data[i]
      const d = new Date(t)
      if (prevDate) {
        let cur = new Date(prevDate)
        cur.setDate(cur.getDate() + 1)
        while (cur < d) {
          // Skip weekends
          if (cur.getDay() !== 0 && cur.getDay() !== 6) {
            points.push({ date: cur.toISOString().split("T")[0], value: prevEquity })
          }
          cur.setDate(cur.getDate() + 1)
        }
      }
      // Add current point
      points.push({ date: d.toISOString().split("T")[0], value: equity })
      prevEquity = equity
      prevDate = d
    }
    return points
  }, [data, initialValue])

  // Header summary
  const change = finalValue - initialValue
  const percentChange = pctReturn * 100
  const isGain = change >= 0

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload[0]) return null
    const value = payload[0].value
    const idx = chartData.findIndex(p => p.date === label)
    const prev = idx > 0 ? chartData[idx - 1].value : initialValue
    const dailyChange = value - prev
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-semibold">${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className={cn("text-sm font-medium", dailyChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{dailyChange >= 0 ? "+" : "-"}${Math.abs(dailyChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} daily</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Equity Curve</CardTitle>
          <div className={cn("text-sm font-medium", isGain ? "text-green-600" : "text-red-600")}>{isGain ? "+" : "-"}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentChange >= 0 ? "+" : "-"}{Math.abs(percentChange).toFixed(2)}%)</div>
        </div>
        <div className="flex gap-2 mt-2">
          {FILTERS.map(f => (
            <Button key={f.value} variant={filters.timeRange === f.value ? "default" : "outline"} size="sm" onClick={() => handleFilter(f.value)}>{f.label}</Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="equityLossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis dataKey="date" interval="preserveStartEnd" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={value => `$${(value/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <ReferenceLine y={initialValue} stroke="#888" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: "Initial", position: "left", style: { fontSize: 10, fill: '#888' } }} />
            <Area type="monotone" dataKey="value" stroke={isGain ? "#10b981" : "#ef4444"} strokeWidth={2} fill={`url(#${isGain ? "equityGainGradient" : "equityLossGradient"})`} animationDuration={500} animationEasing="ease-in-out" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

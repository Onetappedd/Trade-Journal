"use client"

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { 
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, 
  Tooltip, TooltipProps, ReferenceLine
} from "recharts"
import { DollarSign, Percent, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PortfolioData {
  date: string
  value: number
  percentChange: number
  dollarChange: number
}

interface PortfolioPerformanceProps {
  data: PortfolioData[]
  initialValue?: number
  overlay?: { date: string; value: number }[]
  overlayLabel?: string
  prevDeltas?: Record<string, string|number>
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, viewMode }: any) => {
  if (!active || !payload || !payload[0]) return null

  const data = payload[0].payload
  const isGain = data.dollarChange >= 0

  return (
    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg" aria-hidden={true}>
      <p className="text-xs text-muted-foreground mb-1">
        {new Date(label).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </p>
      <p className="text-lg font-semibold">
        ${data.value.toLocaleString('en-US', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })}
      </p>
      <p className={cn(
        "text-sm font-medium",
        isGain ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}>
        {isGain ? "+" : ""}
        {viewMode === "percent" 
          ? `${data.percentChange.toFixed(2)}%`
          : `$${data.dollarChange.toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}`
        }
      </p>
    </div>
  )
}

export function PortfolioPerformance({ data, initialValue = 10000, overlay, overlayLabel, prevDeltas }: PortfolioPerformanceProps) {
  const [viewMode, setViewMode] = useState<"percent" | "dollar">("percent")
  const [hoveredData, setHoveredData] = useState<PortfolioData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "ALL">("ALL")

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    const now = new Date()
    const cutoffDate = new Date()
    switch (selectedPeriod) {
      case "1D":
        cutoffDate.setDate(now.getDate() - 1)
        break
      case "1W":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "1M":
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case "3M":
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case "1Y":
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      case "ALL":
        return data
    }
    return data.filter(d => new Date(d.date) >= cutoffDate)
  }, [data, selectedPeriod])

  const overlayData = useMemo(() => {
    if (!overlay || !overlay.length) return undefined
    return overlay.filter(d => filteredData.find(fd => fd.date === d.date))
  }, [overlay, filteredData])

  // Current performance
  const currentPerformance = useMemo(() => {
    if (filteredData.length === 0) return { value: initialValue, change: 0, percentChange: 0, isGain: true }
    const latest = filteredData[filteredData.length - 1]
    const overallChange = latest.value - initialValue
    const overallPercent = ((latest.value - initialValue) / initialValue) * 100
    const overallIsGain = overallChange >= 0
    const first = filteredData[0]
    const periodChange = latest.value - first.value
    const periodPercent = ((latest.value - first.value) / first.value) * 100
    const displayChange = selectedPeriod === "ALL" ? overallChange : periodChange
    const displayPercent = selectedPeriod === "ALL" ? overallPercent : periodPercent
    return {
      value: latest.value,
      change: displayChange,
      percentChange: displayPercent,
      isGain: overallIsGain, // Always use overall P&L for color
      overallChange,
      overallPercent
    }
  }, [filteredData, initialValue, selectedPeriod])

  const chartColor = currentPerformance.isGain 
    ? "hsl(var(--success))"
    : "hsl(var(--danger))"
  const gradientId = currentPerformance.isGain ? "gainGradient" : "lossGradient"

  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem)
    if (selectedPeriod === "1D") {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (selectedPeriod === "1W") {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const formatYAxisTick = (value: number) => {
    if (viewMode === "percent") {
      return `${value.toFixed(1)}%`
    } else {
      return `$${(value / 1000).toFixed(0)}k`
    }
  }

  const chartData = useMemo(() => {
    if (viewMode === "percent") {
      return filteredData.map(d => ({
        ...d,
        displayValue: d.percentChange
      }))
    } else {
      return filteredData.map(d => ({
        ...d,
        displayValue: d.value
      }))
    }
  }, [filteredData, viewMode])

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Chart theme container */}
      <div data-chart className="text-muted-foreground" style={{
        '--success': 'var(--chart-success, 158, 95%, 40%)',
        '--danger': 'var(--chart-danger, 0, 80%, 57%)',
        '--axis': 'var(--muted-foreground)',
        '--grid': 'var(--border)',
        '--card': 'var(--card)',
        '--card-foreground': 'var(--card-foreground)',
      } as React.CSSProperties}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              ${currentPerformance.value.toLocaleString('en-US', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </h2>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                currentPerformance.isGain 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {currentPerformance.isGain ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {currentPerformance.isGain ? "+" : ""}
                  ${Math.abs(currentPerformance.change).toLocaleString('en-US', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </span>
                <span className="text-muted-foreground">
                  ({currentPerformance.percentChange >= 0 ? "+" : ""}
                  {currentPerformance.percentChange.toFixed(2)}%)
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {selectedPeriod === "1D" ? "Today" : 
                 selectedPeriod === "1W" ? "Past Week" :
                 selectedPeriod === "1M" ? "Past Month" :
                 selectedPeriod === "3M" ? "Past 3 Months" :
                 selectedPeriod === "1Y" ? "Past Year" : "All Time"}
              </span>
            </div>
            {
              prevDeltas && (
                <div className="flex gap-2 mt-1 text-xs">
                  {Object.entries(prevDeltas).map(([label, delta]) => (
                    <span className="text-muted-foreground" key={label}>{label}: <span className="font-semibold">{delta}</span></span>
                  ))}
                </div>
              )
            }
          </div>
          {/* View Mode Toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v) => v && setViewMode(v as "percent" | "dollar")}
            className="bg-muted/50 rounded-lg p-1"
          >
            <ToggleGroupItem 
              value="percent" 
              aria-label="Percent view"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              <Percent className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="dollar" 
              aria-label="Dollar view"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              <DollarSign className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Time Period Selector */}
        <div className="flex items-center gap-1 px-6 pb-4">
          {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as const).map((period) => (
            <Button
              key={period}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                "h-8 px-3 font-medium transition-all",
                selectedPeriod === period 
                  ? "bg-primary/10 text-primary hover:bg-primary/20" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period}
            </Button>
          ))}
        </div>
        {/* Chart */}
        <div className="h-[300px] w-full" id="chart-root">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                onMouseMove={(e) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setHoveredData(e.activePayload[0].payload)
                  }
                }}
                onMouseLeave={() => setHoveredData(null)}
              >
                <defs>
                  <linearGradient id="gainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--axis))' }}
                  tickFormatter={formatXAxisTick}
                  interval="preserveStartEnd"
                />
                <YAxis
                  hide={true}
                  domain={['dataMin', 'dataMax']}
                />
                {viewMode === "dollar" && (
                  <ReferenceLine y={initialValue} stroke="#888" strokeDasharray="3 3" strokeOpacity={0.3}/>
                )}
                <Tooltip content={<CustomTooltip viewMode={viewMode} />} cursor={false} wrapperStyle={{ zIndex: 50 }} contentStyle={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', boxShadow: 'var(--shadow-lg,0 0 #0000)' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--muted-foreground))' }} />
                <Area
                  type="monotone"
                  dataKey="displayValue"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
                {/* Overlay benchmark: normalized series */}
                {overlayData && (
                  <Area
                    type="monotone"
                    dataKey="value"
                    data={overlayData}
                    stroke="#8884d8"
                    strokeWidth={1}
                    dot={false}
                    fillOpacity={0}
                    legendType="none"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </div>
      </CardContent>
      </div>
    </Card>
  )
}

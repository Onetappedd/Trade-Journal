"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { cn } from "@/lib/utils"

interface EquityCurveChartProps {
  data: Array<{
    date: string
    value: number
  }>
  initialValue?: number
}

export function EquityCurveChart({ data, initialValue = 10000 }: EquityCurveChartProps) {
  // Use placeholder data if no real data
  const chartData = data.length > 0 ? data.slice(-90) : [ // Last 90 days
    { date: "Jan", value: initialValue },
    { date: "Feb", value: initialValue },
    { date: "Mar", value: initialValue },
  ]

  // Calculate if we're in profit or loss
  const performance = useMemo(() => {
    if (chartData.length === 0) return { isGain: true, change: 0, percentChange: 0 }
    
    const latestValue = chartData[chartData.length - 1].value
    const change = latestValue - initialValue
    const percentChange = ((latestValue - initialValue) / initialValue) * 100
    
    return {
      isGain: change >= 0,
      change,
      percentChange,
      latestValue
    }
  }, [chartData, initialValue])

  // Dynamic colors based on performance
  const chartColor = performance.isGain ? "#10b981" : "#ef4444"
  const gradientId = performance.isGain ? "equityGainGradient" : "equityLossGradient"

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (dateStr.length <= 3) return dateStr // Month names
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null

    const value = payload[0].value
    const change = value - initialValue
    const percentChange = ((value - initialValue) / initialValue) * 100
    const isGain = change >= 0

    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">
          {formatDate(label)}
        </p>
        <p className="text-lg font-semibold">
          ${value.toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </p>
        <p className={cn(
          "text-sm font-medium",
          isGain ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {isGain ? "+" : ""}${Math.abs(change).toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })} ({percentChange >= 0 ? "+" : ""}{percentChange.toFixed(2)}%)
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Equity Curve</CardTitle>
          <div className={cn(
            "text-sm font-medium",
            performance.isGain ? "text-green-600" : "text-red-600"
          )}>
            {performance.isGain ? "+" : ""}
            ${Math.abs(performance.change).toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })} ({performance.percentChange >= 0 ? "+" : ""}{performance.percentChange.toFixed(2)}%)
          </div>
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
            
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#888' }}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#888' }}
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={false} />
            
            <ReferenceLine 
              y={initialValue} 
              stroke="#888" 
              strokeDasharray="3 3" 
              strokeOpacity={0.3}
              label={{ value: "Initial", position: "left", style: { fontSize: 10, fill: '#888' } }}
            />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { cn } from "@/lib/utils"

interface PnLByMonthChartProps {
  data: Array<{
    month: string
    pnl: number
  }>
}

export function PnLByMonthChart({ data }: PnLByMonthChartProps) {
  // Use placeholder data if no real data
  const chartData = data.length > 0 ? data : [
    { month: "Jan", pnl: 0 },
    { month: "Feb", pnl: 0 },
    { month: "Mar", pnl: 0 },
  ]

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalPnL = chartData.reduce((sum, d) => sum + d.pnl, 0)
    const profitableMonths = chartData.filter(d => d.pnl > 0).length
    const losingMonths = chartData.filter(d => d.pnl < 0).length
    const avgMonthly = chartData.length > 0 ? totalPnL / chartData.length : 0
    
    return {
      totalPnL,
      profitableMonths,
      losingMonths,
      avgMonthly,
      isPositive: totalPnL >= 0
    }
  }, [chartData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null

    const value = payload[0].value
    const isGain = value >= 0

    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">
          {label}
        </p>
        <p className={cn(
          "text-lg font-semibold",
          isGain ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {isGain ? "+" : ""}${Math.abs(value).toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </p>
      </div>
    )
  }

  // Custom bar shape with rounded corners
  const CustomBar = (props: any) => {
    const { fill, x, y, width, height } = props
    const radius = 4
    const isPositive = props.pnl >= 0

    return (
      <g>
        <rect
          x={x}
          y={isPositive ? y : y}
          width={width}
          height={Math.abs(height)}
          fill={fill}
          rx={radius}
          ry={radius}
        />
      </g>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>P&L by Month</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-muted-foreground">
                {stats.profitableMonths} profitable
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-muted-foreground">
                {stats.losingMonths} losing
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className={cn(
                "font-semibold",
                stats.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {stats.isPositive ? "+" : ""}${Math.abs(stats.totalPnL).toLocaleString('en-US', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Monthly: </span>
              <span className={cn(
                "font-semibold",
                stats.avgMonthly >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {stats.avgMonthly >= 0 ? "+" : ""}${Math.abs(stats.avgMonthly).toLocaleString('en-US', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#888' }}
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#888' }}
                tickFormatter={(value) => `$${(Math.abs(value)/1000).toFixed(0)}k`}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              
              <ReferenceLine y={0} stroke="#888" strokeOpacity={0.3} />
              
              <Bar 
                dataKey="pnl" 
                radius={[4, 4, 0, 0]}
                animationDuration={500}
                animationEasing="ease-in-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { cn } from "@/lib/utils"

interface Month {
  month: string
  realizedPnl: number
  fees: number
  netPnl: number
  tradeCount: number
  isProfitable: boolean
}
interface Totals {
  realizedPnl?: number
  fees?: number
  netPnl?: number
  profitableMonths?: number
  losingMonths?: number
  avgMonthlyNet?: number
}

export function PnLByMonthChart({ months, totals }: { months: Month[]; totals: Totals }) {
  // Prepare chart data (zero bars for empty months)
  const chartData = months.length > 0 ? months : []

  // Subtitle summary
  const subtitle = `${totals.profitableMonths ?? 0} profitable • ${totals.losingMonths ?? 0} losing, Total: $${totals.netPnl?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? 0}, Avg Monthly: $${totals.avgMonthlyNet?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? 0}`

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null
    const d = payload[0].payload
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm">Realized: <span className="font-semibold">${d.realizedPnl.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span></p>
        <p className="text-sm">Fees: <span className="font-semibold">${d.fees.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span></p>
        <p className="text-sm">Net: <span className={cn("font-semibold", d.netPnl >= 0 ? "text-green-600" : "text-red-600")}>{d.netPnl >= 0 ? "+" : "-"}${Math.abs(d.netPnl).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span></p>
        <p className="text-sm">Trades: <span className="font-semibold">{d.tradeCount}</span></p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>P&L by Month</CardTitle>
        </div>
        <div className="text-muted-foreground text-sm mt-1">{subtitle}</div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={value => `$${(Math.abs(value)/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <ReferenceLine y={0} stroke="#888" strokeOpacity={0.3} />
            <Bar dataKey="netPnl" radius={[4, 4, 0, 0]} animationDuration={500} animationEasing="ease-in-out">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.netPnl >= 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

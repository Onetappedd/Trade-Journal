"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L by Month</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [
                `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                "P&L"
              ]} 
            />
            <Bar 
              dataKey="pnl" 
              fill={(entry: any) => entry.pnl >= 0 ? "#10b981" : "#ef4444"}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface EquityCurveChartProps {
  data: Array<{
    date: string
    value: number
  }>
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  // Use placeholder data if no real data
  const chartData = data.length > 0 ? data.slice(-90) : [ // Last 90 days
    { date: "Jan", value: 100000 },
    { date: "Feb", value: 100000 },
    { date: "Mar", value: 100000 },
  ]

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (dateStr.length <= 3) return dateStr // Month names
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Portfolio Value"]}
              labelFormatter={(label) => formatDate(label)}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
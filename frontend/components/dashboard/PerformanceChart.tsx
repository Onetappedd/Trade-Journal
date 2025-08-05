"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { date: "Jan", portfolio: 10000, benchmark: 10000 },
  { date: "Feb", portfolio: 10500, benchmark: 10200 },
  { date: "Mar", portfolio: 9800, benchmark: 9900 },
  { date: "Apr", portfolio: 11200, benchmark: 10800 },
  { date: "May", portfolio: 12100, benchmark: 11200 },
  { date: "Jun", portfolio: 11800, benchmark: 11000 },
  { date: "Jul", portfolio: 13200, benchmark: 11800 },
  { date: "Aug", portfolio: 12900, benchmark: 11600 },
  { date: "Sep", portfolio: 14100, benchmark: 12200 },
  { date: "Oct", portfolio: 13800, benchmark: 12000 },
  { date: "Nov", portfolio: 15200, benchmark: 12800 },
  { date: "Dec", portfolio: 16500, benchmark: 13200 },
]

export function PerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => [
                `$${value.toLocaleString()}`,
                name === "portfolio" ? "Your Portfolio" : "S&P 500",
              ]}
            />
            <Line type="monotone" dataKey="portfolio" stroke="#3b82f6" strokeWidth={2} name="portfolio" />
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="benchmark"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

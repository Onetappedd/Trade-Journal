"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { date: "Jan", value: 10000 },
  { date: "Feb", value: 10500 },
  { date: "Mar", value: 9800 },
  { date: "Apr", value: 11200 },
  { date: "May", value: 12100 },
  { date: "Jun", value: 11800 },
  { date: "Jul", value: 13200 },
  { date: "Aug", value: 12900 },
  { date: "Sep", value: 14100 },
  { date: "Oct", value: 13800 },
  { date: "Nov", value: 15200 },
  { date: "Dec", value: 16500 },
]

export function EquityCurveChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Portfolio Value"]} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

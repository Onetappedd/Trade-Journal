"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { name: "Stocks", value: 45, count: 111 },
  { name: "Options", value: 30, count: 74 },
  { name: "Crypto", value: 15, count: 37 },
  { name: "Forex", value: 10, count: 25 },
]

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"]

export function TradeDistributionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

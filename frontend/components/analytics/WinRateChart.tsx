"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { name: "Winning Trades", value: 68.4, count: 169 },
  { name: "Losing Trades", value: 31.6, count: 78 },
]

const COLORS = ["#10b981", "#ef4444"]

export function WinRateChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Win Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">68.4%</div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

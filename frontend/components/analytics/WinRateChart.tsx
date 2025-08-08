"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface WinRateChartProps {
  winRate: number
  totalTrades: number
  wins?: number
  losses?: number
}

export function WinRateChart({ winRate, totalTrades, wins: propWins, losses: propLosses }: WinRateChartProps) {
  // Use provided wins/losses or calculate from win rate
  const wins = propWins !== undefined ? propWins : Math.round((winRate / 100) * totalTrades)
  const losses = propLosses !== undefined ? propLosses : totalTrades - wins
  
  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
  ]

  const COLORS = ["#10b981", "#ef4444"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Win Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-4">
          <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Win Rate ({totalTrades} trades)</div>
        </div>
      </CardContent>
    </Card>
  )
}
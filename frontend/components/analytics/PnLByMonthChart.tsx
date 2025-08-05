"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", pnl: 1200 },
  { month: "Feb", pnl: 500 },
  { month: "Mar", pnl: -700 },
  { month: "Apr", pnl: 1400 },
  { month: "May", pnl: 900 },
  { month: "Jun", pnl: -300 },
  { month: "Jul", pnl: 1400 },
  { month: "Aug", pnl: -300 },
  { month: "Sep", pnl: 1200 },
  { month: "Oct", pnl: -300 },
  { month: "Nov", pnl: 1400 },
  { month: "Dec", pnl: 1300 },
]

export function PnLByMonthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L by Month</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "P&L"]} />
            <Bar dataKey="pnl" fill={(entry) => (entry >= 0 ? "#10b981" : "#ef4444")} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"

const monthlyData = [
  { month: "Jan", gains: 4200, losses: -1800 },
  { month: "Feb", gains: 3800, losses: -2200 },
  { month: "Mar", gains: 5200, losses: -1200 },
  { month: "Apr", gains: 2800, losses: -3200 },
  { month: "May", gains: 6200, losses: -800 },
  { month: "Jun", gains: 4800, losses: -2800 },
  { month: "Jul", gains: 5800, losses: -1800 },
  { month: "Aug", gains: 3200, losses: -2200 },
  { month: "Sep", gains: 4800, losses: -1600 },
  { month: "Oct", gains: 5200, losses: -2400 },
  { month: "Nov", gains: 3800, losses: -1800 },
  { month: "Dec", gains: 2200, losses: -800 },
]

const holdingPeriodData = [
  { name: "< 1 Day", value: 45, color: "#ef4444" },
  { name: "1-7 Days", value: 32, color: "#f97316" },
  { name: "1-4 Weeks", value: 28, color: "#eab308" },
  { name: "1-6 Months", value: 35, color: "#22c55e" },
  { name: "6-12 Months", value: 18, color: "#3b82f6" },
  { name: "> 1 Year", value: 22, color: "#8b5cf6" },
]

export function TaxCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Gains/Losses</CardTitle>
          <CardDescription>Realized gains and losses by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              gains: {
                label: "Gains",
                color: "hsl(var(--chart-1))",
              },
              losses: {
                label: "Losses",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="gains" fill="var(--color-gains)" />
                <Bar dataKey="losses" fill="var(--color-losses)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holding Period Distribution</CardTitle>
          <CardDescription>Trade distribution by holding period</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: {
                label: "Trades",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={holdingPeriodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {holdingPeriodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react"

export function DashboardContent() {
  const metrics = [
    {
      title: "Total P&L",
      value: "+$12,345",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Win Rate",
      value: "68.5%",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Total Trades",
      value: "247",
      change: "+15",
      trend: "up",
      icon: Activity,
    },
    {
      title: "Avg Trade",
      value: "$156",
      change: "-$12",
      trend: "down",
      icon: TrendingDown,
    },
  ]

  const recentTrades = [
    { symbol: "AAPL", type: "Long", pnl: "+$245", date: "2024-01-15" },
    { symbol: "TSLA", type: "Short", pnl: "-$89", date: "2024-01-15" },
    { symbol: "MSFT", type: "Long", pnl: "+$167", date: "2024-01-14" },
    { symbol: "NVDA", type: "Long", pnl: "+$423", date: "2024-01-14" },
    { symbol: "GOOGL", type: "Short", pnl: "+$78", date: "2024-01-13" },
  ]

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Your latest trading activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrades.map((trade, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="font-medium">{trade.symbol}</div>
                  <Badge variant={trade.type === "Long" ? "default" : "secondary"}>{trade.type}</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">{trade.date}</div>
                  <div className={`font-medium ${trade.pnl.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {trade.pnl}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react"

export function DashboardContent() {
  const metrics = [
    {
      title: "Total P&L",
      value: "$12,345.67",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Win Rate",
      value: "68.4%",
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
      title: "Avg. Trade",
      value: "$156.78",
      change: "-3.2%",
      trend: "down",
      icon: TrendingDown,
    },
  ]

  const recentTrades = [
    { symbol: "AAPL", type: "Long", pnl: "+$234.56", date: "2024-01-15" },
    { symbol: "TSLA", type: "Short", pnl: "-$89.12", date: "2024-01-14" },
    { symbol: "MSFT", type: "Long", pnl: "+$456.78", date: "2024-01-13" },
    { symbol: "GOOGL", type: "Long", pnl: "+$123.45", date: "2024-01-12" },
    { symbol: "NVDA", type: "Short", pnl: "+$678.90", date: "2024-01-11" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your trading overview.</p>
      </div>

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
                <p className="text-xs text-muted-foreground">
                  <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>{metric.change}</span>{" "}
                  from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Your latest trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrades.map((trade, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">{trade.symbol}</p>
                      <p className="text-xs text-muted-foreground">{trade.date}</p>
                    </div>
                    <Badge variant={trade.type === "Long" ? "default" : "secondary"}>{trade.type}</Badge>
                  </div>
                  <div
                    className={`text-sm font-medium ${trade.pnl.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                  >
                    {trade.pnl}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Best Day</span>
              <span className="text-sm font-medium text-green-600">+$1,234.56</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Worst Day</span>
              <span className="text-sm font-medium text-red-600">-$456.78</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg. Daily P&L</span>
              <span className="text-sm font-medium">+$89.12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
              <span className="text-sm font-medium">1.45</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
              <span className="text-sm font-medium text-red-600">-8.2%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

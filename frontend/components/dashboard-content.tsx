"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, Activity, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react"

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
      change: "+18",
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
    {
      symbol: "AAPL",
      type: "Long",
      entry: "$175.50",
      exit: "$178.25",
      pnl: "+$275.00",
      date: "2024-01-15",
      status: "closed",
    },
    {
      symbol: "TSLA",
      type: "Short",
      entry: "$245.80",
      exit: "$242.15",
      pnl: "+$365.00",
      date: "2024-01-14",
      status: "closed",
    },
    {
      symbol: "NVDA",
      type: "Long",
      entry: "$520.30",
      exit: "$518.90",
      pnl: "-$140.00",
      date: "2024-01-13",
      status: "closed",
    },
    {
      symbol: "SPY",
      type: "Long",
      entry: "$485.20",
      exit: "Current",
      pnl: "+$85.50",
      date: "2024-01-12",
      status: "open",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's your trading overview.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Trade
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {metric.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>{metric.change}</span>
                <span className="ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
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
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium">{trade.symbol}</p>
                    <p className="text-xs text-muted-foreground">{trade.date}</p>
                  </div>
                  <Badge variant={trade.type === "Long" ? "default" : "secondary"}>{trade.type}</Badge>
                  <Badge variant={trade.status === "open" ? "outline" : "secondary"}>{trade.status}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {trade.entry} → {trade.exit}
                  </p>
                  <p className={`text-sm font-medium ${trade.pnl.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {trade.pnl}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PlusCircle,
  BarChart3,
  Calendar,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import Link from "next/link"

export function DashboardPage() {
  // Mock data for dashboard
  const portfolioValue = 125750.5
  const dailyPnL = 2450.75
  const dailyPnLPercent = 1.98
  const totalTrades = 247
  const winRate = 68.4
  const monthlyReturn = 12.3

  const recentTrades = [
    { symbol: "AAPL", type: "BUY", quantity: 100, price: 175.5, pnl: 450.0, date: "2024-01-15" },
    { symbol: "TSLA", type: "SELL", quantity: 50, price: 245.8, pnl: -125.5, date: "2024-01-15" },
    { symbol: "MSFT", type: "BUY", quantity: 75, price: 380.25, pnl: 890.25, date: "2024-01-14" },
    { symbol: "GOOGL", type: "SELL", quantity: 25, price: 142.75, pnl: 320.0, date: "2024-01-14" },
  ]

  const topPositions = [
    { symbol: "AAPL", shares: 500, value: 87750, pnl: 12450, pnlPercent: 16.5 },
    { symbol: "MSFT", shares: 200, value: 76050, pnl: 8920, pnlPercent: 13.3 },
    { symbol: "GOOGL", shares: 150, value: 21412, pnl: -1250, pnlPercent: -5.5 },
    { symbol: "TSLA", shares: 100, value: 24580, pnl: 2100, pnlPercent: 9.3 },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/dashboard/add-trade">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Trade
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
            {dailyPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dailyPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
              {dailyPnL >= 0 ? "+" : ""}${dailyPnL.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyPnL >= 0 ? "+" : ""}
              {dailyPnLPercent}% today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">+12 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}%</div>
            <Progress value={winRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Trades */}
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
                    <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>{trade.type}</Badge>
                    <div>
                      <p className="text-sm font-medium">{trade.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {trade.quantity} shares @ ${trade.price}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {trade.pnl >= 0 ? "+" : ""}${Math.abs(trade.pnl).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{trade.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/dashboard/trade-history">View All Trades</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Positions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Positions</CardTitle>
            <CardDescription>Your largest holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPositions.map((position, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{position.symbol}</p>
                    <p className="text-xs text-muted-foreground">{position.shares} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${position.value.toLocaleString()}</p>
                    <div className="flex items-center text-xs">
                      {position.pnl >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span className={position.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                        {position.pnlPercent >= 0 ? "+" : ""}
                        {position.pnlPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/dashboard/portfolio">View Portfolio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
              <Link href="/dashboard/add-trade">
                <PlusCircle className="h-6 w-6 mb-2" />
                Add New Trade
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
              <Link href="/dashboard/import-trades">
                <Activity className="h-6 w-6 mb-2" />
                Import Trades
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
              <Link href="/dashboard/analytics">
                <BarChart3 className="h-6 w-6 mb-2" />
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
              <Link href="/dashboard/calendar">
                <Calendar className="h-6 w-6 mb-2" />
                Trading Calendar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="text-sm font-medium">Risk Alert</p>
                <p className="text-xs text-muted-foreground">Your TSLA position exceeds 20% of portfolio</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/risk-management">Review</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium">Price Alert Triggered</p>
                <p className="text-xs text-muted-foreground">AAPL reached your target price of $175</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/price-alerts">View Alerts</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

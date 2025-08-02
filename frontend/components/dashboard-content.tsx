"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, Activity, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"

interface Trade {
  id: string
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  pnl: number
  date: string
  status: "open" | "closed"
}

export function DashboardContent() {
  const [stats, setStats] = useState({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    activePositions: 0,
  })
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])

  useEffect(() => {
    // Mock data - replace with actual API calls
    setStats({
      totalPnL: 12450.75,
      winRate: 68.5,
      totalTrades: 147,
      activePositions: 8,
    })

    setRecentTrades([
      {
        id: "1",
        symbol: "AAPL",
        side: "buy",
        quantity: 100,
        price: 175.5,
        pnl: 850.0,
        date: "2024-01-15",
        status: "closed",
      },
      {
        id: "2",
        symbol: "TSLA",
        side: "sell",
        quantity: 50,
        price: 245.3,
        pnl: -320.0,
        date: "2024-01-14",
        status: "closed",
      },
      {
        id: "3",
        symbol: "NVDA",
        side: "buy",
        quantity: 25,
        price: 520.75,
        pnl: 0,
        date: "2024-01-13",
        status: "open",
      },
    ])
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your trading overview.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/add-trade">
            <Plus className="mr-2 h-4 w-4" />
            Add Trade
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalPnL.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">+23 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePositions}</div>
            <p className="text-xs text-muted-foreground">-2 from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Your latest trading activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={trade.side === "buy" ? "default" : "secondary"}>{trade.side.toUpperCase()}</Badge>
                    <span className="font-medium">{trade.symbol}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.quantity} shares @ ${trade.price}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={trade.status === "open" ? "outline" : "secondary"}>{trade.status}</Badge>
                  {trade.pnl !== 0 && (
                    <div className={`flex items-center space-x-1 ${trade.pnl > 0 ? "text-green-600" : "text-red-600"}`}>
                      {trade.pnl > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <span className="font-medium">${Math.abs(trade.pnl).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">{new Date(trade.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/dashboard/trade-history">View All Trades</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

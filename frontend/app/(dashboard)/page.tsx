"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpIcon, ArrowDownIcon, DollarSign, TrendingUp, Clock, BarChart3, Plus } from "lucide-react"
import Link from "next/link"

const stats = [
  {
    title: "Total P&L",
    value: "$12,847.32",
    change: "+8.2%",
    icon: DollarSign,
    positive: true,
  },
  {
    title: "Win Rate",
    value: "68.4%",
    change: "+2.1%",
    icon: TrendingUp,
    positive: true,
  },
  {
    title: "Avg Hold Time",
    value: "3.2 days",
    change: "-0.5 days",
    icon: Clock,
    positive: false,
  },
  {
    title: "Total Trades",
    value: "247",
    change: "+12",
    icon: BarChart3,
    positive: true,
  },
]

const recentTrades = [
  {
    symbol: "AAPL",
    type: "Stock",
    pnl: 245.67,
    quantity: 100,
    date: "2024-01-15",
    side: "Buy",
  },
  {
    symbol: "TSLA",
    type: "Option",
    pnl: -89.23,
    quantity: 5,
    date: "2024-01-14",
    side: "Sell",
  },
  {
    symbol: "NVDA",
    type: "Stock",
    pnl: 567.89,
    quantity: 50,
    date: "2024-01-13",
    side: "Buy",
  },
  {
    symbol: "SPY",
    type: "Option",
    pnl: 123.45,
    quantity: 10,
    date: "2024-01-12",
    side: "Buy",
  },
  {
    symbol: "QQQ",
    type: "Stock",
    pnl: -45.67,
    quantity: 25,
    date: "2024-01-11",
    side: "Sell",
  },
]

const topTickers = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "SPY"]

export default function Dashboard() {
  return (
    <div className="flex flex-col">
      <Navbar title="Dashboard" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.positive ? (
                    <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={stat.positive ? "text-green-500" : "text-red-500"}>{stat.change}</span>
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Trades */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>Your latest trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTrades.map((trade, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{trade.type}</Badge>
                      </TableCell>
                      <TableCell className={trade.pnl > 0 ? "text-green-600" : "text-red-600"}>
                        ${trade.pnl.toFixed(2)}
                      </TableCell>
                      <TableCell>{trade.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Link href="/trade-history">
                  <Button variant="outline" className="w-full bg-transparent">
                    View All Trades
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Tickers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Tickers</CardTitle>
              <CardDescription>Your most profitable symbols</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {topTickers.map((ticker) => (
                  <Badge key={ticker} variant="secondary">
                    {ticker}
                  </Badge>
                ))}
              </div>
              <Link href="/add-trade">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Trade
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

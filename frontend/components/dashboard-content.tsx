"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, CreditCard } from "lucide-react"

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
      icon: Activity,
    },
    {
      title: "Total Trades",
      value: "247",
      change: "+15",
      trend: "up",
      icon: Users,
    },
    {
      title: "Average Trade",
      value: "$156.78",
      change: "-3.2%",
      trend: "down",
      icon: CreditCard,
    },
  ]

  const recentTrades = [
    {
      symbol: "AAPL",
      type: "Long",
      entry: "$185.50",
      exit: "$189.25",
      pnl: "+$375.00",
      date: "2024-01-15",
      status: "Closed",
    },
    {
      symbol: "TSLA",
      type: "Short",
      entry: "$248.42",
      exit: "$245.10",
      pnl: "+$332.00",
      date: "2024-01-14",
      status: "Closed",
    },
    {
      symbol: "NVDA",
      type: "Long",
      entry: "$520.75",
      exit: "$515.20",
      pnl: "-$555.00",
      date: "2024-01-13",
      status: "Closed",
    },
    {
      symbol: "MSFT",
      type: "Long",
      entry: "$378.90",
      exit: null,
      pnl: "+$125.50",
      date: "2024-01-12",
      status: "Open",
    },
  ]

  return (
    <div className="space-y-6">
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
              <div className="flex items-center text-xs text-muted-foreground">
                {metric.trend === "up" ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>{metric.change}</span>
                <span className="ml-1">from last month</span>
              </div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTrades.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>
                    <Badge variant={trade.type === "Long" ? "default" : "secondary"}>{trade.type}</Badge>
                  </TableCell>
                  <TableCell>{trade.entry}</TableCell>
                  <TableCell>{trade.exit || "-"}</TableCell>
                  <TableCell>
                    <span className={trade.pnl.startsWith("+") ? "text-green-600" : "text-red-600"}>{trade.pnl}</span>
                  </TableCell>
                  <TableCell>{trade.date}</TableCell>
                  <TableCell>
                    <Badge variant={trade.status === "Open" ? "outline" : "default"}>{trade.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Add New Trade</CardTitle>
            <CardDescription>Record a new trading position</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Add Trade</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Trades</CardTitle>
            <CardDescription>Import from your broker</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent">
              Import CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Create performance report</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent">
              Generate
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

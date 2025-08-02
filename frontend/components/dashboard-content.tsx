"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react"

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your trading journal dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+$12,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trade</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$49.52</div>
            <p className="text-xs text-muted-foreground">-4.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Your latest trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { symbol: "AAPL", type: "BUY", quantity: 100, price: 150.25, pnl: "+$234.50" },
                { symbol: "TSLA", type: "SELL", quantity: 50, price: 245.8, pnl: "-$123.25" },
                { symbol: "MSFT", type: "BUY", quantity: 75, price: 380.15, pnl: "+$456.75" },
                { symbol: "GOOGL", type: "SELL", quantity: 25, price: 2750.3, pnl: "+$789.10" },
              ].map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === "BUY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {trade.type}
                    </div>
                    <div>
                      <p className="font-medium">{trade.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.quantity} shares @ ${trade.price}
                      </p>
                    </div>
                  </div>
                  <div className={`font-medium ${trade.pnl.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {trade.pnl}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription>Current portfolio allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { symbol: "AAPL", allocation: 35, value: "$12,450" },
                { symbol: "TSLA", allocation: 25, value: "$8,900" },
                { symbol: "MSFT", allocation: 20, value: "$7,120" },
                { symbol: "GOOGL", allocation: 15, value: "$5,340" },
                { symbol: "Cash", allocation: 5, value: "$1,780" },
              ].map((holding, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">{holding.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{holding.symbol}</p>
                      <p className="text-sm text-muted-foreground">{holding.allocation}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{holding.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

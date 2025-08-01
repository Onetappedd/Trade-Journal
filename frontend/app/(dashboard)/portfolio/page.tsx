"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, TrendingUp, TrendingDown, RefreshCw, DollarSign } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const portfolioData = [
  { symbol: "AAPL", shares: 50, avgPrice: 145.3, currentPrice: 152.4, sector: "Technology" },
  { symbol: "MSFT", shares: 30, avgPrice: 280.5, currentPrice: 295.2, sector: "Technology" },
  { symbol: "GOOGL", shares: 15, avgPrice: 2650.0, currentPrice: 2720.8, sector: "Technology" },
  { symbol: "TSLA", shares: 25, avgPrice: 220.0, currentPrice: 195.3, sector: "Automotive" },
  { symbol: "SPY", shares: 100, avgPrice: 420.0, currentPrice: 435.6, sector: "ETF" },
]

const intradayData = [
  { time: "9:30", value: 98500 },
  { time: "10:00", value: 98750 },
  { time: "10:30", value: 98200 },
  { time: "11:00", value: 99100 },
  { time: "11:30", value: 99500 },
  { time: "12:00", value: 99200 },
  { time: "12:30", value: 99800 },
  { time: "1:00", value: 100200 },
  { time: "1:30", value: 99900 },
  { time: "2:00", value: 100500 },
  { time: "2:30", value: 100800 },
  { time: "3:00", value: 101200 },
  { time: "3:30", value: 100900 },
  { time: "4:00", value: 101500 },
]

const sectorData = [
  { name: "Technology", value: 65, color: "#8884d8" },
  { name: "ETF", value: 20, color: "#82ca9d" },
  { name: "Automotive", value: 15, color: "#ffc658" },
]

export default function PortfolioPage() {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastUpdate(new Date())
      setIsRefreshing(false)
    }, 1000)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const totalValue = portfolioData.reduce((sum, position) => sum + position.shares * position.currentPrice, 0)

  const totalCost = portfolioData.reduce((sum, position) => sum + position.shares * position.avgPrice, 0)

  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent = (totalGainLoss / totalCost) * 100

  const formatCurrency = (value: number) => {
    if (isPrivacyMode) return "****"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Live Portfolio</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch id="privacy-mode" checked={isPrivacyMode} onCheckedChange={setIsPrivacyMode} />
            <Label htmlFor="privacy-mode" className="flex items-center gap-1">
              {isPrivacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Privacy Mode
            </Label>
          </div>
          <Button onClick={refreshData} disabled={isRefreshing} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdate.toLocaleTimeString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalGainLoss)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalGainLossPercent >= 0 ? "+" : ""}
              {totalGainLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Day's Change</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(1750)}</div>
            <p className="text-xs text-muted-foreground">+1.75%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(15420)}</div>
            <p className="text-xs text-muted-foreground">Available for trading</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="intraday">Intraday Chart</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
              <CardDescription>Real-time position values and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioData.map((position) => {
                  const positionValue = position.shares * position.currentPrice
                  const positionCost = position.shares * position.avgPrice
                  const positionGainLoss = positionValue - positionCost
                  const positionGainLossPercent = (positionGainLoss / positionCost) * 100

                  return (
                    <div key={position.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{position.symbol}</span>
                            <Badge variant="outline">{position.sector}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {position.shares} shares @ {formatCurrency(position.avgPrice)} avg
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(position.currentPrice)}</div>
                        <div className={`text-sm ${positionGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(positionGainLoss)} ({positionGainLossPercent >= 0 ? "+" : ""}
                          {positionGainLossPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intraday" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intraday Performance</CardTitle>
              <CardDescription>Portfolio value throughout the trading day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={intradayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={["dataMin - 500", "dataMax + 500"]} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), "Portfolio Value"]} />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sector Allocation</CardTitle>
                <CardDescription>Portfolio distribution by sector</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allocation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sectorData.map((sector) => (
                  <div key={sector.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{sector.name}</span>
                      <span>{sector.value}%</span>
                    </div>
                    <Progress value={sector.value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

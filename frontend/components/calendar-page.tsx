"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, TrendingUp, DollarSign, BarChart3 } from "lucide-react"

interface Trade {
  id: string
  symbol: string
  type: "buy" | "sell"
  quantity: number
  price: number
  date: Date
  pnl: number
  status: "open" | "closed"
}

const mockTrades: Trade[] = [
  {
    id: "1",
    symbol: "AAPL",
    type: "buy",
    quantity: 100,
    price: 150.25,
    date: new Date(2024, 0, 15),
    pnl: 245.5,
    status: "closed",
  },
  {
    id: "2",
    symbol: "TSLA",
    type: "sell",
    quantity: 50,
    price: 248.75,
    date: new Date(2024, 0, 15),
    pnl: -123.25,
    status: "closed",
  },
  {
    id: "3",
    symbol: "NVDA",
    type: "buy",
    quantity: 25,
    price: 520.0,
    date: new Date(2024, 0, 20),
    pnl: 890.75,
    status: "open",
  },
  {
    id: "4",
    symbol: "MSFT",
    type: "buy",
    quantity: 75,
    price: 378.5,
    date: new Date(2024, 0, 22),
    pnl: 456.25,
    status: "closed",
  },
]

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const tradesForDate = mockTrades.filter(
        (trade) =>
          trade.date.getDate() === date.getDate() &&
          trade.date.getMonth() === date.getMonth() &&
          trade.date.getFullYear() === date.getFullYear(),
      )
      setSelectedTrades(tradesForDate)
    } else {
      setSelectedTrades([])
    }
  }

  const getDayTrades = (date: Date) => {
    return mockTrades.filter(
      (trade) =>
        trade.date.getDate() === date.getDate() &&
        trade.date.getMonth() === date.getMonth() &&
        trade.date.getFullYear() === date.getFullYear(),
    )
  }

  const getTotalPnLForDate = (date: Date) => {
    const trades = getDayTrades(date)
    return trades.reduce((sum, trade) => sum + trade.pnl, 0)
  }

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyTrades = mockTrades.filter(
      (trade) => trade.date.getMonth() === currentMonth && trade.date.getFullYear() === currentYear,
    )

    const totalPnL = monthlyTrades.reduce((sum, trade) => sum + trade.pnl, 0)
    const winningTrades = monthlyTrades.filter((trade) => trade.pnl > 0).length
    const totalTrades = monthlyTrades.length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    return {
      totalPnL,
      totalTrades,
      winRate,
      avgPnL: totalTrades > 0 ? totalPnL / totalTrades : 0,
    }
  }

  const monthlyStats = getMonthlyStats()

  return (
    <div className="space-y-6">
      {/* Monthly Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className={`text-2xl font-bold ${monthlyStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${monthlyStats.totalPnL.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Monthly P&L</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{monthlyStats.totalTrades}</div>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{monthlyStats.winRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className={`text-2xl font-bold ${monthlyStats.avgPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${monthlyStats.avgPnL.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Avg P&L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Calendar</CardTitle>
            <CardDescription>Click on a date to view trades for that day</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
              modifiers={{
                hasTradesProfit: (date) => {
                  const pnl = getTotalPnLForDate(date)
                  return pnl > 0
                },
                hasTradesLoss: (date) => {
                  const pnl = getTotalPnLForDate(date)
                  return pnl < 0
                },
                hasTrades: (date) => getDayTrades(date).length > 0,
              }}
              modifiersStyles={{
                hasTradesProfit: {
                  backgroundColor: "rgb(34 197 94 / 0.2)",
                  color: "rgb(34 197 94)",
                  fontWeight: "bold",
                },
                hasTradesLoss: {
                  backgroundColor: "rgb(239 68 68 / 0.2)",
                  color: "rgb(239 68 68)",
                  fontWeight: "bold",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedDate ? `Trades for ${selectedDate.toLocaleDateString()}` : "Select a Date"}</CardTitle>
            <CardDescription>
              {selectedTrades.length > 0
                ? `${selectedTrades.length} trade${selectedTrades.length > 1 ? "s" : ""} found`
                : "No trades found for this date"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTrades.length > 0 ? (
              <div className="space-y-4">
                {selectedTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={trade.type === "buy" ? "default" : "secondary"}>{trade.type.toUpperCase()}</Badge>
                      <div>
                        <div className="font-medium">{trade.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {trade.quantity} shares @ ${trade.price}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </div>
                      <Badge variant={trade.status === "open" ? "outline" : "secondary"} className="text-xs">
                        {trade.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total P&L:</span>
                    <span
                      className={`font-bold ${
                        selectedTrades.reduce((sum, trade) => sum + trade.pnl, 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${selectedTrades.reduce((sum, trade) => sum + trade.pnl, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No trades recorded for this date</p>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Add Trade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trading Activity Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trading Activity</CardTitle>
              <CardDescription>Your latest trades across all dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTrades.slice(0, 5).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={trade.type === "buy" ? "default" : "secondary"}>{trade.type.toUpperCase()}</Badge>
                      <div>
                        <div className="font-medium">{trade.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {trade.date.toLocaleDateString()} • {trade.quantity} shares
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">${trade.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed analysis of your trading performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Best Day:</span>
                    <span className="text-green-600 font-medium">+$890.75</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Worst Day:</span>
                    <span className="text-red-600 font-medium">-$123.25</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Daily P&L:</span>
                    <span className="font-medium">+$367.31</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Volume:</span>
                    <span className="font-medium">$63,287.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Largest Position:</span>
                    <span className="font-medium">AAPL (100 shares)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most Traded:</span>
                    <span className="font-medium">AAPL</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Trading Patterns</CardTitle>
              <CardDescription>Insights into your trading behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Day of Week Performance</h4>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <div key={day} className="p-2 border rounded">
                        <div className="text-xs text-muted-foreground">{day}</div>
                        <div className={`text-sm font-medium ${index % 2 === 0 ? "text-green-600" : "text-red-600"}`}>
                          {index % 2 === 0 ? "+$45" : "-$12"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Most Active Hours</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>• 9:30 AM - 10:30 AM: 45% of trades</p>
                    <p>• 2:00 PM - 3:00 PM: 30% of trades</p>
                    <p>• 3:30 PM - 4:00 PM: 25% of trades</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CalendarPage

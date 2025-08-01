"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { format } from "date-fns"

interface Trade {
  id: string
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  pnl: number
  date: Date
}

// Mock trade data
const mockTrades: Trade[] = [
  {
    id: "1",
    symbol: "AAPL",
    side: "buy",
    quantity: 100,
    price: 150.25,
    pnl: 250.5,
    date: new Date(2024, 0, 15),
  },
  {
    id: "2",
    symbol: "TSLA",
    side: "sell",
    quantity: 50,
    price: 245.8,
    pnl: -125.3,
    date: new Date(2024, 0, 16),
  },
  {
    id: "3",
    symbol: "MSFT",
    side: "buy",
    quantity: 75,
    price: 380.9,
    pnl: 450.75,
    date: new Date(2024, 0, 18),
  },
  {
    id: "4",
    symbol: "GOOGL",
    side: "sell",
    quantity: 25,
    price: 142.5,
    pnl: 180.25,
    date: new Date(2024, 0, 20),
  },
]

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const getTradesForDate = (date: Date): Trade[] => {
    return mockTrades.filter(
      (trade) =>
        trade.date.getDate() === date.getDate() &&
        trade.date.getMonth() === date.getMonth() &&
        trade.date.getFullYear() === date.getFullYear(),
    )
  }

  const getDayPnL = (date: Date): number => {
    const trades = getTradesForDate(date)
    return trades.reduce((total, trade) => total + trade.pnl, 0)
  }

  const hasTradesOnDate = (date: Date): boolean => {
    return getTradesForDate(date).length > 0
  }

  const selectedTrades = selectedDate ? getTradesForDate(selectedDate) : []
  const selectedDayPnL = selectedDate ? getDayPnL(selectedDate) : 0

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Trading Calendar</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendar View
            </CardTitle>
            <CardDescription>Click on any date to view your trades for that day</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              components={{
                Day: ({ date, ...props }) => {
                  const dayPnL = getDayPnL(date)
                  const hasTrades = hasTradesOnDate(date)

                  return (
                    <div className="relative">
                      <button
                        {...props}
                        className={`
                          w-full h-full p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground
                          ${hasTrades ? "font-semibold" : ""}
                          ${dayPnL > 0 ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : ""}
                          ${dayPnL < 0 ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : ""}
                        `}
                      >
                        {date.getDate()}
                        {hasTrades && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-60" />
                        )}
                      </button>
                    </div>
                  )
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a Date"}</CardTitle>
            <CardDescription>
              {selectedTrades.length > 0
                ? `${selectedTrades.length} trade${selectedTrades.length > 1 ? "s" : ""} on this day`
                : "No trades on this day"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTrades.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Day P&L</span>
                  <div className="flex items-center gap-1">
                    {selectedDayPnL > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-semibold ${selectedDayPnL > 0 ? "text-green-600" : "text-red-600"}`}>
                      ${selectedDayPnL.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={trade.side === "buy" ? "default" : "secondary"}>
                          {trade.side.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {trade.quantity} shares @ ${trade.price}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${trade.pnl > 0 ? "text-green-600" : "text-red-600"}`}>
                          ${trade.pnl.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No trades recorded for this date</p>
                <Button variant="outline" className="mt-4 bg-transparent">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Trade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

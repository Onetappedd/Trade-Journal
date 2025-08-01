"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, TrendingUp, TrendingDown } from "lucide-react"
import { format, startOfMonth, endOfMonth, isSameDay, isToday } from "date-fns"

interface TradeEvent {
  id: string
  date: Date
  symbol: string
  type: "entry" | "exit"
  pnl?: number
  side: "buy" | "sell"
  assetType: string
}

const mockTradeEvents: TradeEvent[] = [
  {
    id: "1",
    date: new Date(2024, 0, 15), // January 15, 2024
    symbol: "AAPL",
    type: "entry",
    side: "buy",
    assetType: "stock",
  },
  {
    id: "2",
    date: new Date(2024, 0, 15), // January 15, 2024
    symbol: "AAPL",
    type: "exit",
    pnl: 245.67,
    side: "sell",
    assetType: "stock",
  },
  {
    id: "3",
    date: new Date(2024, 0, 14), // January 14, 2024
    symbol: "TSLA",
    type: "entry",
    side: "buy",
    assetType: "option",
  },
  {
    id: "4",
    date: new Date(2024, 0, 14), // January 14, 2024
    symbol: "TSLA",
    type: "exit",
    pnl: -89.23,
    side: "sell",
    assetType: "option",
  },
  {
    id: "5",
    date: new Date(2024, 0, 13), // January 13, 2024
    symbol: "NVDA",
    type: "entry",
    side: "buy",
    assetType: "stock",
  },
  {
    id: "6",
    date: new Date(2024, 0, 12), // January 12, 2024
    symbol: "SPY",
    type: "entry",
    side: "buy",
    assetType: "option",
  },
  {
    id: "7",
    date: new Date(2024, 0, 12), // January 12, 2024
    symbol: "SPY",
    type: "exit",
    pnl: 123.45,
    side: "sell",
    assetType: "option",
  },
]

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [view, setView] = useState<"month" | "week">("month")

  const getDayEvents = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return []
    }
    return mockTradeEvents.filter((event) => {
      if (!event.date || isNaN(event.date.getTime())) {
        return false
      }
      return isSameDay(event.date, date)
    })
  }

  const getDayPnL = (date: Date) => {
    const events = getDayEvents(date)
    return events.reduce((sum, event) => sum + (event.pnl || 0), 0)
  }

  const getMonthStats = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const monthEvents = mockTradeEvents.filter((event) => event.date >= monthStart && event.date <= monthEnd)

    const totalPnL = monthEvents.reduce((sum, event) => sum + (event.pnl || 0), 0)
    const tradingDays = new Set(monthEvents.map((event) => format(event.date, "yyyy-MM-dd"))).size
    const totalTrades = monthEvents.filter((event) => event.type === "exit").length

    return { totalPnL, tradingDays, totalTrades }
  }

  const monthStats = getMonthStats()
  const selectedDayEvents = getDayEvents(selectedDate)
  const selectedDayPnL = getDayPnL(selectedDate)

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth)
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  return (
    <div className="flex flex-col">
      <Navbar title="Trading Calendar" />

      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(value: "month" | "week") => setView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Trade
            </Button>
          </div>
        </div>

        {/* Month Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${monthStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${monthStats.totalPnL.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Monthly P&L</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{monthStats.tradingDays}</div>
              <p className="text-xs text-muted-foreground">Trading Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{monthStats.totalTrades}</div>
              <p className="text-xs text-muted-foreground">Completed Trades</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Calendar */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Trading Calendar</CardTitle>
              <CardDescription>Your trading activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border"
                components={{
                  Day: ({ date, ...props }) => {
                    if (!date || isNaN(date.getTime())) {
                      return <div {...props}></div>
                    }

                    const dayEvents = getDayEvents(date)
                    const dayPnL = getDayPnL(date)
                    const hasEvents = dayEvents.length > 0

                    return (
                      <div className="relative">
                        <button
                          {...props}
                          className={`
                            w-full h-full p-2 text-sm rounded-md transition-colors
                            ${isSameDay(date, selectedDate) ? "bg-primary text-primary-foreground" : ""}
                            ${isToday(date) ? "bg-accent text-accent-foreground" : ""}
                            ${hasEvents ? "font-medium" : ""}
                            hover:bg-accent hover:text-accent-foreground
                          `}
                        >
                          <div className="flex flex-col items-center">
                            <span>{format(date, "d")}</span>
                            {hasEvents && (
                              <div className="flex items-center gap-1 mt-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${dayPnL >= 0 ? "bg-green-500" : "bg-red-500"}`}
                                />
                                <span className="text-xs">{dayEvents.filter((e) => e.type === "exit").length}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    )
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <Card>
            <CardHeader>
              <CardTitle>{format(selectedDate, "EEEE, MMMM d")}</CardTitle>
              <CardDescription>
                {selectedDayEvents.length > 0 ? `${selectedDayEvents.length} trading events` : "No trading activity"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDayPnL !== 0 && (
                <div className="mb-4 p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Day P&L</span>
                    <div
                      className={`flex items-center gap-1 ${selectedDayPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {selectedDayPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-bold">${selectedDayPnL.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={event.type === "entry" ? "default" : "secondary"}>{event.type}</Badge>
                        <div>
                          <div className="font-medium">{event.symbol}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {event.side} {event.assetType}
                          </div>
                        </div>
                      </div>
                      {event.pnl && (
                        <div className={`font-medium ${event.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${event.pnl.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No trades on this day</p>
                    <Button variant="outline" className="mt-2 bg-transparent" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Trade
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Important dates and reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "2024-01-20", event: "AAPL Earnings", type: "earnings" },
                { date: "2024-01-22", event: "TSLA Earnings", type: "earnings" },
                { date: "2024-01-25", event: "SPY Options Expiry", type: "expiry" },
                { date: "2024-01-30", event: "Monthly Review", type: "review" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{item.type}</Badge>
                    <div>
                      <div className="font-medium">{item.event}</div>
                      <div className="text-sm text-muted-foreground">{item.date}</div>
                    </div>
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

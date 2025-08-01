"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, TrendingUp, TrendingDown } from "lucide-react"

const mockTradeData = {
  "2024-01-15": { trades: 3, pnl: 234.5, winRate: 66.7 },
  "2024-01-14": { trades: 2, pnl: -123.45, winRate: 50.0 },
  "2024-01-13": { trades: 1, pnl: 456.78, winRate: 100.0 },
  "2024-01-12": { trades: 4, pnl: 789.12, winRate: 75.0 },
  "2024-01-11": { trades: 2, pnl: -345.67, winRate: 0.0 },
}

export function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState("month")

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const getTradeDataForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    return mockTradeData[dateKey as keyof typeof mockTradeData]
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Trading Calendar</h2>
        <div className="flex items-center space-x-2">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              January 2024
            </CardTitle>
            <CardDescription>Click on any date to view detailed trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              components={{
                Day: ({ date: dayDate, ...props }) => {
                  const tradeData = getTradeDataForDate(dayDate)
                  return (
                    <div className="relative">
                      <button
                        {...props}
                        className={`
                          w-full h-full p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground
                          ${date && dayDate.toDateString() === date.toDateString() ? "bg-primary text-primary-foreground" : ""}
                          ${tradeData ? "font-bold" : ""}
                        `}
                      >
                        {dayDate.getDate()}
                        {tradeData && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            <div
                              className={`w-1 h-1 rounded-full ${tradeData.pnl >= 0 ? "bg-green-500" : "bg-red-500"}`}
                            />
                          </div>
                        )}
                      </button>
                    </div>
                  )
                },
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selected Date</CardTitle>
              <CardDescription>{date ? date.toLocaleDateString() : "Select a date"}</CardDescription>
            </CardHeader>
            <CardContent>
              {date && getTradeDataForDate(date) ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trades</span>
                    <Badge variant="outline">{getTradeDataForDate(date)?.trades}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">P&L</span>
                    <span
                      className={`font-medium ${getTradeDataForDate(date)!.pnl >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {getTradeDataForDate(date)!.pnl >= 0 ? "+" : ""}${getTradeDataForDate(date)!.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-medium">{getTradeDataForDate(date)!.winRate.toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {date ? "No trades on this date" : "Select a date to view details"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Month Summary</CardTitle>
              <CardDescription>January 2024 overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trading Days</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Trades</span>
                <Badge variant="outline">47</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Winning Days</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">8</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Losing Days</span>
                <div className="flex items-center space-x-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">4</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Net P&L</span>
                <span className="text-green-600 font-bold">+$1,011.28</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

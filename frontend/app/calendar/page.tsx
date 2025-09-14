"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react"

// Mock trade data for calendar visualization
const mockTrades = [
  { date: "2024-01-15", symbol: "AAPL", pnl: 1247, side: "BUY" },
  { date: "2024-01-15", symbol: "TSLA", pnl: -523, side: "SELL" },
  { date: "2024-01-16", symbol: "MSFT", pnl: 892, side: "BUY" },
  { date: "2024-01-17", symbol: "NVDA", pnl: 2134, side: "SELL" },
  { date: "2024-01-17", symbol: "GOOGL", pnl: -456, side: "BUY" },
  { date: "2024-01-18", symbol: "AMZN", pnl: 1678, side: "BUY" },
  { date: "2024-01-19", symbol: "META", pnl: -234, side: "SELL" },
  { date: "2024-01-22", symbol: "NFLX", pnl: 567, side: "BUY" },
  { date: "2024-01-23", symbol: "AMD", pnl: -789, side: "SELL" },
  { date: "2024-01-24", symbol: "INTC", pnl: 345, side: "BUY" },
]

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly")
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  // Group trades by date
  const tradesByDate = mockTrades.reduce(
    (acc, trade) => {
      if (!acc[trade.date]) {
        acc[trade.date] = []
      }
      acc[trade.date].push(trade)
      return acc
    },
    {} as Record<string, typeof mockTrades>,
  )

  // Calculate daily P&L
  const dailyPnL = Object.entries(tradesByDate).reduce(
    (acc, [date, trades]) => {
      acc[date] = trades.reduce((sum, trade) => sum + trade.pnl, 0)
      return acc
    },
    {} as Record<string, number>,
  )

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(date.getDate() - day)

    const days = []
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek)
      currentDay.setDate(startOfWeek.getDate() + i)
      days.push(currentDay)
    }

    return days
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const getPnLColor = (pnl: number) => {
    if (pnl === 0) return "bg-slate-700"

    const intensity = Math.min(Math.abs(pnl) / 2000, 1) // Max intensity at $2000

    if (pnl > 0) {
      return `bg-emerald-500/${Math.round(intensity * 100)}`
    } else {
      return `bg-red-500/${Math.round(intensity * 100)}`
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      newDate.setDate(currentDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)

    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Day headers */}
        {DAYS.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="aspect-square" />
          }

          const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
          const dayPnL = dailyPnL[dateKey] || 0
          const dayTrades = tradesByDate[dateKey] || []

          return (
            <div
              key={day}
              className={`aspect-square border border-slate-700/50 rounded-lg p-1 sm:p-2 cursor-pointer transition-all hover:border-slate-600 relative ${getPnLColor(dayPnL)}`}
              onMouseEnter={() => setHoveredDay(dateKey)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="text-xs sm:text-sm font-medium text-white">{day}</div>
              {dayTrades.length > 0 && (
                <div className="absolute bottom-1 right-1">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white rounded-full opacity-80" />
                </div>
              )}

              {/* Hover tooltip */}
              {hoveredDay === dateKey && dayTrades.length > 0 && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl min-w-48">
                  <div className="text-sm font-medium text-white mb-2">
                    {MONTHS[currentDate.getMonth()]} {day}, {currentDate.getFullYear()}
                  </div>
                  <div className="space-y-1">
                    {dayTrades.map((trade, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">{trade.symbol}</span>
                        <span className={trade.pnl > 0 ? "text-emerald-400" : "text-red-400"}>
                          {trade.pnl > 0 ? "+" : ""}${trade.pnl.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-slate-700 pt-1 mt-1">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-white">Total P&L:</span>
                        <span className={dayPnL > 0 ? "text-emerald-400" : "text-red-400"}>
                          {dayPnL > 0 ? "+" : ""}${dayPnL.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate)

    return (
      <div className="grid grid-cols-7 gap-2 sm:gap-4">
        {weekDays.map((day, index) => {
          const dateKey = formatDateKey(day.getFullYear(), day.getMonth(), day.getDate())
          const dayPnL = dailyPnL[dateKey] || 0
          const dayTrades = tradesByDate[dateKey] || []

          return (
            <div key={index} className="space-y-2">
              <div className="text-center">
                <div className="text-sm font-medium text-slate-400">{DAYS[day.getDay()]}</div>
                <div className="text-lg font-semibold text-white">{day.getDate()}</div>
              </div>

              <Card
                className={`bg-slate-900/50 border-slate-800/50 min-h-32 cursor-pointer transition-all hover:border-slate-600 ${getPnLColor(dayPnL)}`}
                onMouseEnter={() => setHoveredDay(dateKey)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <CardContent className="p-3">
                  {dayTrades.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-300">
                        {dayTrades.length} trade{dayTrades.length !== 1 ? "s" : ""}
                      </div>
                      <div className={`text-sm font-semibold ${dayPnL > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {dayPnL > 0 ? "+" : ""}${dayPnL.toLocaleString()}
                      </div>
                      <div className="space-y-1">
                        {dayTrades.slice(0, 2).map((trade, i) => (
                          <div key={i} className="text-xs text-slate-400">
                            {trade.symbol}
                          </div>
                        ))}
                        {dayTrades.length > 2 && (
                          <div className="text-xs text-slate-500">+{dayTrades.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 text-center pt-4">No trades</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    )
  }

  // Check if we have any trades to show
  const hasTrades = mockTrades.length > 0

  if (!hasTrades) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-7xl">
          <EmptyState
            icon={CalendarIcon}
            title="No trades yet"
            description="Import your trades to see your trading calendar with daily P&L visualization"
            onAction={() => window.location.href = "/import"}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
                <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-emerald-400" />
                Trading Calendar
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Visualize your daily trading performance and P&L patterns
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-slate-900/50 border border-slate-800/50 rounded-lg p-1">
                <Button
                  variant={viewMode === "monthly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("monthly")}
                  className={viewMode === "monthly" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Monthly
                </Button>
                <Button
                  variant={viewMode === "weekly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("weekly")}
                  className={viewMode === "weekly" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Weekly
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation and Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (viewMode === "monthly" ? navigateMonth("prev") : navigateWeek("prev"))}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {viewMode === "monthly"
                  ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : `Week of ${getWeekDays(currentDate)[0].toLocaleDateString()}`}
              </h2>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => (viewMode === "monthly" ? navigateMonth("next") : navigateWeek("next"))}
                className="text-slate-400 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-400">Winning Days:</span>
                <span className="text-sm font-medium text-emerald-400">12</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-sm text-slate-400">Losing Days:</span>
                <span className="text-sm font-medium text-red-400">8</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-white" />
                <span className="text-sm text-slate-400">Avg Daily:</span>
                <span className="text-sm font-medium text-white">+$247</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4 sm:p-6">
            {viewMode === "monthly" ? renderMonthView() : renderWeekView()}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-emerald-500/60 rounded border border-slate-600" />
              <span className="text-sm text-slate-400">Profitable Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-red-500/60 rounded border border-slate-600" />
              <span className="text-sm text-slate-400">Loss Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-slate-700 rounded border border-slate-600" />
              <span className="text-sm text-slate-400">No Trades</span>
            </div>
          </div>

          <div className="text-xs text-slate-500">Color intensity represents P&L magnitude • Hover for details</div>
        </div>
      </div>
    </div>
  )
}

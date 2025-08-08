"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarData, DailyPnL } from "@/lib/calendar-metrics"

interface PnLCalendarProps {
  data: CalendarData
}

export function PnLCalendar({ data }: PnLCalendarProps) {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [viewMode, setViewMode] = useState<"realized" | "unrealized" | "all">("realized")

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1)
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0)
    const startPadding = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const days: (DailyPnL | null)[] = []
    
    // Add padding for start of month
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = data.dailyData[dateStr]
      
      if (dayData) {
        days.push(dayData)
      } else {
        days.push({
          date: dateStr,
          realizedPnL: 0,
          unrealizedPnL: 0,
          totalPnL: 0,
          tradeCount: 0,
          trades: []
        })
      }
    }
    
    return days
  }, [selectedYear, selectedMonth, data.dailyData])

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    Object.keys(data.dailyData).forEach(date => {
      years.add(new Date(date).getFullYear())
    })
    // Add current year if not present
    years.add(currentDate.getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [data.dailyData])

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? "+" : ""
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const getPnLValue = (day: DailyPnL | null) => {
    if (!day) return 0
    switch (viewMode) {
      case "realized":
        return day.realizedPnL
      case "unrealized":
        return day.unrealizedPnL
      case "all":
        return day.totalPnL
      default:
        return day.realizedPnL
    }
  }

  const getColorClass = (pnl: number, isToday: boolean = false) => {
    if (pnl > 0) {
      return cn(
        "bg-green-100 hover:bg-green-200 text-green-900",
        pnl > 100 && "bg-green-200 hover:bg-green-300",
        pnl > 500 && "bg-green-300 hover:bg-green-400",
        pnl > 1000 && "bg-green-400 hover:bg-green-500",
        isToday && "ring-2 ring-blue-500"
      )
    } else if (pnl < 0) {
      return cn(
        "bg-red-100 hover:bg-red-200 text-red-900",
        pnl < -100 && "bg-red-200 hover:bg-red-300",
        pnl < -500 && "bg-red-300 hover:bg-red-400",
        pnl < -1000 && "bg-red-400 hover:bg-red-500",
        isToday && "ring-2 ring-blue-500"
      )
    } else {
      return cn(
        "bg-gray-50 hover:bg-gray-100 text-gray-600",
        isToday && "ring-2 ring-blue-500"
      )
    }
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              P&L Calendar
            </CardTitle>
            <CardDescription>
              Daily profit and loss heatmap
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realized">Realized</SelectItem>
                <SelectItem value="unrealized">Unrealized</SelectItem>
                <SelectItem value="all">All P&L</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Month Selector */}
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Year Selector */}
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }
              
              const pnl = getPnLValue(day)
              const dayNumber = new Date(day.date).getDate()
              
              return (
                <TooltipProvider key={day.date}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square p-2 rounded-lg cursor-pointer transition-colors",
                          "flex flex-col items-center justify-center gap-1",
                          getColorClass(pnl, isToday(day.date))
                        )}
                      >
                        <span className="text-xs font-medium">{dayNumber}</span>
                        {day.tradeCount > 0 && (
                          <span className="text-xs font-bold">
                            {formatCurrency(pnl).replace(/\.\d{2}$/, '')}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    
                    <TooltipContent className="w-64 p-3">
                      <div className="space-y-2">
                        <div className="font-semibold">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        
                        {day.tradeCount > 0 ? (
                          <>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Realized P&L:</span>
                                <span className={day.realizedPnL >= 0 ? "text-green-600" : "text-red-600"}>
                                  {formatCurrency(day.realizedPnL)}
                                </span>
                              </div>
                              {day.unrealizedPnL !== 0 && (
                                <div className="flex justify-between">
                                  <span>Unrealized P&L:</span>
                                  <span className={day.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}>
                                    {formatCurrency(day.unrealizedPnL)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-1 border-t">
                                <span>Total:</span>
                                <span className={day.totalPnL >= 0 ? "text-green-600" : "text-red-600"}>
                                  {formatCurrency(day.totalPnL)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-1 pt-2 border-t">
                              <div className="text-xs font-semibold">
                                Trades ({day.tradeCount}):
                              </div>
                              {day.trades.slice(0, 5).map((trade, i) => (
                                <div key={i} className="text-xs flex justify-between">
                                  <span>
                                    {trade.symbol} {trade.side.toUpperCase()} {trade.quantity}
                                  </span>
                                  <span className={trade.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                                    {formatCurrency(trade.pnl)}
                                  </span>
                                </div>
                              ))}
                              {day.trades.length > 5 && (
                                <div className="text-xs text-muted-foreground">
                                  +{day.trades.length - 5} more trades
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No trades on this day
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-300 rounded" />
                <span className="text-xs text-muted-foreground">Profit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-300 rounded" />
                <span className="text-xs text-muted-foreground">Loss</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 rounded" />
                <span className="text-xs text-muted-foreground">No trades</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>{data.winningDays} winning days</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span>{data.losingDays} losing days</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
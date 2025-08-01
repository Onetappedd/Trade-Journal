"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  TrendingDown,
  CalendarIcon,
  Search,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  AlertCircle,
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns"
import { cn } from "@/lib/utils"

interface TradeEvent {
  id: string
  date: Date
  symbol: string
  type: "entry" | "exit"
  pnl?: number
  side: "buy" | "sell"
  assetType: "stock" | "option" | "crypto" | "forex"
  quantity: number
  price: number
  strategy?: string
  notes?: string
  tags?: string[]
}

interface MarketEvent {
  id: string
  date: Date
  title: string
  type: "earnings" | "dividend" | "split" | "economic" | "expiry"
  symbol?: string
  importance: "low" | "medium" | "high"
}

const mockTradeEvents: TradeEvent[] = [
  {
    id: "1",
    date: new Date(2024, 0, 15),
    symbol: "AAPL",
    type: "entry",
    side: "buy",
    assetType: "stock",
    quantity: 100,
    price: 185.5,
    strategy: "Momentum",
    tags: ["tech", "large-cap"],
    notes: "Strong earnings momentum",
  },
  {
    id: "2",
    date: new Date(2024, 0, 15),
    symbol: "AAPL",
    type: "exit",
    pnl: 245.67,
    side: "sell",
    assetType: "stock",
    quantity: 100,
    price: 187.95,
    strategy: "Momentum",
    tags: ["tech", "large-cap"],
  },
  {
    id: "3",
    date: new Date(2024, 0, 14),
    symbol: "TSLA",
    type: "entry",
    side: "buy",
    assetType: "option",
    quantity: 5,
    price: 3.2,
    strategy: "Swing",
    tags: ["ev", "volatile"],
  },
  {
    id: "4",
    date: new Date(2024, 0, 14),
    symbol: "TSLA",
    type: "exit",
    pnl: -89.23,
    side: "sell",
    assetType: "option",
    quantity: 5,
    price: 1.42,
    strategy: "Swing",
    tags: ["ev", "volatile"],
  },
  {
    id: "5",
    date: new Date(2024, 0, 13),
    symbol: "NVDA",
    type: "entry",
    side: "buy",
    assetType: "stock",
    quantity: 50,
    price: 495.2,
    strategy: "AI Play",
    tags: ["ai", "semiconductor"],
  },
  {
    id: "6",
    date: new Date(2024, 0, 12),
    symbol: "SPY",
    type: "entry",
    side: "buy",
    assetType: "option",
    quantity: 10,
    price: 2.15,
    strategy: "Market Hedge",
    tags: ["spy", "hedge"],
  },
  {
    id: "7",
    date: new Date(2024, 0, 12),
    symbol: "SPY",
    type: "exit",
    pnl: 123.45,
    side: "sell",
    assetType: "option",
    quantity: 10,
    price: 3.38,
    strategy: "Market Hedge",
    tags: ["spy", "hedge"],
  },
  {
    id: "8",
    date: new Date(2024, 0, 11),
    symbol: "MSFT",
    type: "entry",
    side: "buy",
    assetType: "stock",
    quantity: 75,
    price: 375.8,
    strategy: "Value",
    tags: ["tech", "dividend"],
  },
  {
    id: "9",
    date: new Date(2024, 0, 10),
    symbol: "AMZN",
    type: "entry",
    side: "sell",
    assetType: "stock",
    quantity: 25,
    price: 155.3,
    strategy: "Short",
    tags: ["retail", "overvalued"],
  },
  {
    id: "10",
    date: new Date(2024, 0, 10),
    symbol: "AMZN",
    type: "exit",
    pnl: 187.5,
    side: "buy",
    assetType: "stock",
    quantity: 25,
    price: 147.8,
    strategy: "Short",
    tags: ["retail", "overvalued"],
  },
  {
    id: "11",
    date: new Date(2024, 0, 9),
    symbol: "GOOGL",
    type: "exit",
    pnl: 456.78,
    side: "sell",
    assetType: "stock",
    quantity: 30,
    price: 142.5,
    strategy: "Growth",
    tags: ["tech", "ai"],
  },
  {
    id: "12",
    date: new Date(2024, 0, 8),
    symbol: "META",
    type: "exit",
    pnl: -234.56,
    side: "sell",
    assetType: "stock",
    quantity: 40,
    price: 385.2,
    strategy: "Momentum",
    tags: ["social", "metaverse"],
  },
  {
    id: "13",
    date: new Date(2024, 0, 5),
    symbol: "QQQ",
    type: "exit",
    pnl: 89.12,
    side: "sell",
    assetType: "option",
    quantity: 15,
    price: 4.25,
    strategy: "ETF Play",
    tags: ["etf", "tech"],
  },
  {
    id: "14",
    date: new Date(2024, 0, 4),
    symbol: "IWM",
    type: "exit",
    pnl: -45.67,
    side: "sell",
    assetType: "option",
    quantity: 8,
    price: 2.15,
    strategy: "Small Cap",
    tags: ["etf", "small-cap"],
  },
  {
    id: "15",
    date: new Date(2024, 0, 3),
    symbol: "AMD",
    type: "exit",
    pnl: 312.45,
    side: "sell",
    assetType: "stock",
    quantity: 60,
    price: 145.8,
    strategy: "Semiconductor",
    tags: ["semiconductor", "ai"],
  },
]

const mockMarketEvents: MarketEvent[] = [
  {
    id: "1",
    date: new Date(2024, 0, 20),
    title: "AAPL Earnings",
    type: "earnings",
    symbol: "AAPL",
    importance: "high",
  },
  {
    id: "2",
    date: new Date(2024, 0, 22),
    title: "TSLA Earnings",
    type: "earnings",
    symbol: "TSLA",
    importance: "high",
  },
  {
    id: "3",
    date: new Date(2024, 0, 25),
    title: "SPY Options Expiry",
    type: "expiry",
    symbol: "SPY",
    importance: "medium",
  },
  {
    id: "4",
    date: new Date(2024, 0, 26),
    title: "Fed Meeting",
    type: "economic",
    importance: "high",
  },
  {
    id: "5",
    date: new Date(2024, 0, 18),
    title: "MSFT Dividend",
    type: "dividend",
    symbol: "MSFT",
    importance: "low",
  },
]

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [view, setView] = useState<"month" | "week">("month")
  const [filter, setFilter] = useState<"all" | "profitable" | "unprofitable">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all")

  const getDayEvents = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return []
    }
    return mockTradeEvents.filter((event) => {
      if (!event.date || isNaN(event.date.getTime())) {
        return false
      }
      const matchesDate = isSameDay(event.date, date)
      const matchesSearch =
        searchTerm === "" ||
        event.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.strategy?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStrategy = selectedStrategy === "all" || event.strategy === selectedStrategy

      return matchesDate && matchesSearch && matchesStrategy
    })
  }

  const getDayMarketEvents = (date: Date) => {
    return mockMarketEvents.filter((event) => isSameDay(event.date, date))
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
    const winningTrades = monthEvents.filter((event) => event.type === "exit" && (event.pnl || 0) > 0).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    return { totalPnL, tradingDays, totalTrades, winRate }
  }

  const getWeekStats = () => {
    const weekStart = startOfWeek(selectedDate)
    const weekEnd = endOfWeek(selectedDate)
    const weekEvents = mockTradeEvents.filter((event) => event.date >= weekStart && event.date <= weekEnd)

    const totalPnL = weekEvents.reduce((sum, event) => sum + (event.pnl || 0), 0)
    const totalTrades = weekEvents.filter((event) => event.type === "exit").length

    return { totalPnL, totalTrades }
  }

  const monthStats = getMonthStats()
  const weekStats = getWeekStats()
  const selectedDayEvents = getDayEvents(selectedDate)
  const selectedDayMarketEvents = getDayMarketEvents(selectedDate)
  const selectedDayPnL = getDayPnL(selectedDate)

  const strategies = Array.from(new Set(mockTradeEvents.map((event) => event.strategy).filter(Boolean)))

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentMonth(subMonths(currentMonth, 1))
    } else {
      setCurrentMonth(addMonths(currentMonth, 1))
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "earnings":
        return <BarChart3 className="h-3 w-3" />
      case "dividend":
        return <DollarSign className="h-3 w-3" />
      case "expiry":
        return <Clock className="h-3 w-3" />
      case "economic":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <CalendarIcon className="h-3 w-3" />
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "border-red-500 bg-red-50 text-red-700"
      case "medium":
        return "border-yellow-500 bg-yellow-50 text-yellow-700"
      case "low":
        return "border-green-500 bg-green-50 text-green-700"
      default:
        return "border-gray-500 bg-gray-50 text-gray-700"
    }
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">P&L Calendar</h1>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search symbols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-40"
            />
          </div>

          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              {strategies.map((strategy) => (
                <SelectItem key={strategy} value={strategy!}>
                  {strategy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Trade
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly P&L</p>
                <div className={cn("text-2xl font-bold", monthStats.totalPnL >= 0 ? "text-green-600" : "text-red-600")}>
                  ${monthStats.totalPnL.toFixed(2)}
                </div>
              </div>
              <div
                className={cn(
                  "rounded-full p-2",
                  monthStats.totalPnL >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600",
                )}
              >
                {monthStats.totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trading Days</p>
                <div className="text-2xl font-bold">{monthStats.tradingDays}</div>
              </div>
              <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                <CalendarIcon className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                <div className="text-2xl font-bold">{monthStats.totalTrades}</div>
              </div>
              <div className="rounded-full bg-purple-100 p-2 text-purple-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <div className="text-2xl font-bold">{monthStats.winRate.toFixed(1)}%</div>
              </div>
              <div
                className={cn(
                  "rounded-full p-2",
                  monthStats.winRate >= 50 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600",
                )}
              >
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Webull-style P&L Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentMonth, "MMMM yyyy")}
              </span>
            </CardTitle>
            <CardDescription>Daily P&L overview - Click any day to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Custom Calendar Grid */}
            <div className="space-y-2">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dayPnL = getDayPnL(day)
                  const dayEvents = getDayEvents(day)
                  const hasEvents = dayEvents.length > 0
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isTodayDate = isToday(day)
                  const isSelected = isSameDay(day, selectedDate)

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                        "flex flex-col justify-between",
                        !isCurrentMonth && "opacity-40",
                        isTodayDate && "ring-2 ring-blue-500",
                        isSelected && "ring-2 ring-primary",
                        dayPnL > 0 && "bg-green-50 border-green-200 hover:bg-green-100",
                        dayPnL < 0 && "bg-red-50 border-red-200 hover:bg-red-100",
                        dayPnL === 0 && hasEvents && "bg-gray-50 border-gray-200 hover:bg-gray-100",
                        dayPnL === 0 && !hasEvents && "bg-background hover:bg-muted/50",
                      )}
                    >
                      {/* Day number */}
                      <div className="flex justify-between items-start">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !isCurrentMonth && "text-muted-foreground",
                            isTodayDate && "text-blue-600 font-bold",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {hasEvents && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                      </div>

                      {/* P&L Amount */}
                      {dayPnL !== 0 && (
                        <div className="text-center">
                          <div className={cn("text-xs font-bold", dayPnL > 0 ? "text-green-700" : "text-red-700")}>
                            {dayPnL > 0 ? "+" : ""}${Math.abs(dayPnL).toFixed(0)}
                          </div>
                        </div>
                      )}

                      {/* Trade count */}
                      {hasEvents && (
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">
                            {dayEvents.filter((e) => e.type === "exit").length} trades
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-100 border border-green-200"></div>
                <span>Profitable Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-100 border border-red-200"></div>
                <span>Loss Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-blue-500"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Has Trades</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{format(selectedDate, "MMM d")}</span>
              {isToday(selectedDate) && <Badge variant="secondary">Today</Badge>}
            </CardTitle>
            <CardDescription>
              {selectedDayEvents.length > 0
                ? `${selectedDayEvents.length} event${selectedDayEvents.length > 1 ? "s" : ""}`
                : "No activity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trades" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trades">Trades</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>

              <TabsContent value="trades" className="space-y-4">
                {selectedDayPnL !== 0 && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Day P&L</span>
                      <div
                        className={cn(
                          "flex items-center gap-1 font-bold",
                          selectedDayPnL >= 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {selectedDayPnL >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>${selectedDayPnL.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {selectedDayEvents.length > 0 ? (
                      selectedDayEvents.map((event) => (
                        <Dialog key={event.id}>
                          <DialogTrigger asChild>
                            <div className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge variant={event.type === "entry" ? "default" : "secondary"}>{event.type}</Badge>
                                  <div>
                                    <div className="font-medium">{event.symbol}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {event.side} {event.quantity} {event.assetType}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {event.pnl && (
                                    <div
                                      className={cn("font-medium", event.pnl >= 0 ? "text-green-600" : "text-red-600")}
                                    >
                                      ${event.pnl.toFixed(2)}
                                    </div>
                                  )}
                                  <div className="text-sm text-muted-foreground">${event.price.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {event.symbol} - {event.type}
                              </DialogTitle>
                              <DialogDescription>
                                Trade details for {format(event.date, "MMMM d, yyyy")}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Symbol</label>
                                  <p className="text-sm text-muted-foreground">{event.symbol}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Asset Type</label>
                                  <p className="text-sm text-muted-foreground capitalize">{event.assetType}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Side</label>
                                  <p className="text-sm text-muted-foreground capitalize">{event.side}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Quantity</label>
                                  <p className="text-sm text-muted-foreground">{event.quantity}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Price</label>
                                  <p className="text-sm text-muted-foreground">${event.price.toFixed(2)}</p>
                                </div>
                                {event.pnl && (
                                  <div>
                                    <label className="text-sm font-medium">P&L</label>
                                    <p
                                      className={cn(
                                        "text-sm font-medium",
                                        event.pnl >= 0 ? "text-green-600" : "text-red-600",
                                      )}
                                    >
                                      ${event.pnl.toFixed(2)}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {event.strategy && (
                                <div>
                                  <label className="text-sm font-medium">Strategy</label>
                                  <p className="text-sm text-muted-foreground">{event.strategy}</p>
                                </div>
                              )}
                              {event.tags && event.tags.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium">Tags</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {event.tags.map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {event.notes && (
                                <div>
                                  <label className="text-sm font-medium">Notes</label>
                                  <p className="text-sm text-muted-foreground">{event.notes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-2">No trades on this day</p>
                        <Button variant="outline" className="mt-2 bg-transparent" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Trade
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {selectedDayMarketEvents.length > 0 ? (
                      selectedDayMarketEvents.map((event) => (
                        <div key={event.id} className="rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("rounded-full p-1.5 border", getImportanceColor(event.importance))}>
                              {getEventTypeIcon(event.type)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {event.type} {event.symbol && `• ${event.symbol}`}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                event.importance === "high" && "border-red-500 text-red-700",
                                event.importance === "medium" && "border-yellow-500 text-yellow-700",
                                event.importance === "low" && "border-green-500 text-green-700",
                              )}
                            >
                              {event.importance}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-2">No market events on this day</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Market Events</CardTitle>
          <CardDescription>Important dates and reminders for the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {mockMarketEvents
              .filter((event) => event.date >= new Date())
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 8)
              .map((event) => (
                <div key={event.id} className="rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("rounded-full p-1.5 border mt-0.5", getImportanceColor(event.importance))}>
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{format(event.date, "MMM d, yyyy")}</div>
                      {event.symbol && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {event.symbol}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

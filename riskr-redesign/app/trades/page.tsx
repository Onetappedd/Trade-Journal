"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { EmptyState } from "@/components/empty-state"
import { showNotification } from "@/lib/notifications"
import {
  BarChart3,
  Search,
  Filter,
  Download,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  SortAsc,
  SortDesc,
  RefreshCw,
  Plus,
  Target,
  DollarSign,
  Activity,
  Tag,
  AlertTriangle,
  Layers,
  ArrowUpDown,
} from "lucide-react"

type DensityMode = "comfortable" | "compact" | "ultra-compact"

interface Trade {
  id: string
  date: string
  time: string
  symbol: string
  type: string
  side: string
  quantity: number
  entryPrice: number
  exitPrice: number | null
  pnl: number
  pnlPercent: number
  status: string
  strategy: string
  holdTime: string
  commission: number
  tags: string[]
  strike?: string
  expiry?: string
  contract?: string
}

export default function TradesPage() {
  const [selectedFilters, setSelectedFilters] = useState({
    dateRange: "all",
    tradeType: "all",
    status: "all",
    symbols: [] as string[],
    strategies: [] as string[],
    pnlRange: [0, 50000] as [number, number],
    tags: [] as string[],
  })

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Trade
    direction: "asc" | "desc"
  }>({ key: "date", direction: "desc" })

  const [multiSort, setMultiSort] = useState<Array<{ key: keyof Trade; direction: "asc" | "desc" }>>([])
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [density, setDensity] = useState<DensityMode>("comfortable")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const savedDensity = localStorage.getItem("trades-density") as DensityMode
    if (savedDensity) {
      setDensity(savedDensity)
    }
  }, [])

  const handleDensityChange = (newDensity: DensityMode) => {
    setDensity(newDensity)
    localStorage.setItem("trades-density", newDensity)
  }

  const generateMockTrades = (count: number): Trade[] => {
    const symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "SPY", "QQQ", "IWM", "AMD", "META"]
    const types = ["Stock", "Options", "Futures"]
    const sides = ["Long", "Short", "Long Call", "Short Put", "Iron Condor"]
    const strategies = ["Momentum", "Reversal", "Breakout", "Mean Reversion", "Income", "Scalp"]
    const tags = ["Tech", "Growth", "Value", "Income", "Volatile", "Large Cap", "Small Cap", "Index"]

    return Array.from({ length: count }, (_, i) => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      const type = types[Math.floor(Math.random() * types.length)]
      const side = sides[Math.floor(Math.random() * sides.length)]
      const entryPrice = Math.random() * 500 + 50
      const exitPrice = Math.random() > 0.2 ? entryPrice * (0.8 + Math.random() * 0.4) : null
      const pnl = exitPrice ? (exitPrice - entryPrice) * (Math.random() * 100 + 10) : Math.random() * 2000 - 1000

      return {
        id: `TRD-${String(i + 1).padStart(4, "0")}`,
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        time: `${Math.floor(Math.random() * 24)
          .toString()
          .padStart(2, "0")}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
        symbol,
        type,
        side,
        quantity: Math.floor(Math.random() * 1000) + 1,
        entryPrice,
        exitPrice,
        pnl,
        pnlPercent: exitPrice ? ((exitPrice - entryPrice) / entryPrice) * 100 : (Math.random() - 0.5) * 20,
        status: exitPrice ? "Closed" : "Open",
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        holdTime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h`,
        commission: Math.random() * 10 + 1,
        tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
        ...(type === "Options" && {
          strike: `${Math.floor(entryPrice)}C`,
          expiry: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }),
        ...(type === "Futures" && {
          contract: `${symbol}H24`,
        }),
      }
    })
  }

  const allTrades = useMemo(() => generateMockTrades(12000), [])

  const filteredAndSortedTrades = useMemo(() => {
    const filtered = allTrades.filter((trade) => {
      // Search query filter
      if (
        searchQuery &&
        !trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !trade.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Date range filter
      if (selectedFilters.dateRange !== "all") {
        const tradeDate = new Date(trade.date)
        const now = new Date()
        const daysDiff = (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24)

        switch (selectedFilters.dateRange) {
          case "today":
            if (daysDiff > 1) return false
            break
          case "week":
            if (daysDiff > 7) return false
            break
          case "month":
            if (daysDiff > 30) return false
            break
          case "quarter":
            if (daysDiff > 90) return false
            break
          case "year":
            if (daysDiff > 365) return false
            break
        }
      }

      // Other filters
      if (selectedFilters.tradeType !== "all" && trade.type.toLowerCase() !== selectedFilters.tradeType) return false
      if (selectedFilters.status !== "all" && trade.status.toLowerCase() !== selectedFilters.status) return false
      if (selectedFilters.symbols.length > 0 && !selectedFilters.symbols.includes(trade.symbol)) return false
      if (selectedFilters.strategies.length > 0 && !selectedFilters.strategies.includes(trade.strategy)) return false
      if (trade.pnl < selectedFilters.pnlRange[0] || trade.pnl > selectedFilters.pnlRange[1]) return false
      if (selectedFilters.tags.length > 0 && !selectedFilters.tags.some((tag) => trade.tags.includes(tag))) return false

      return true
    })

    // Multi-column sorting
    if (multiSort.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of multiSort) {
          const aVal = a[sort.key]
          const bVal = b[sort.key]

          let comparison = 0
          if (typeof aVal === "string" && typeof bVal === "string") {
            comparison = aVal.localeCompare(bVal)
          } else if (typeof aVal === "number" && typeof bVal === "number") {
            comparison = aVal - bVal
          }

          if (comparison !== 0) {
            return sort.direction === "asc" ? comparison : -comparison
          }
        }
        return 0
      })
    } else {
      // Single column sorting
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        let comparison = 0
        if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal)
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal
        }

        return sortConfig.direction === "asc" ? comparison : -comparison
      })
    }

    return filtered
  }, [allTrades, selectedFilters, sortConfig, multiSort, searchQuery])

  const uniqueSymbols = useMemo(() => [...new Set(allTrades.map((t) => t.symbol))].sort(), [allTrades])
  const uniqueStrategies = useMemo(() => [...new Set(allTrades.map((t) => t.strategy))].sort(), [allTrades])
  const uniqueTags = useMemo(() => [...new Set(allTrades.flatMap((t) => t.tags))].sort(), [allTrades])

  const handleExport = async () => {
    setIsLoading(true)
    try {
      // Simulate export processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const csv = [
        "Trade ID,Date,Time,Symbol,Type,Side,Quantity,Entry Price,Exit Price,P&L,P&L %,Status,Strategy,Hold Time,Commission,Tags",
        ...filteredAndSortedTrades.map(
          (trade) =>
            `${trade.id},${trade.date},${trade.time},${trade.symbol},${trade.type},${trade.side},${trade.quantity},${trade.entryPrice},${trade.exitPrice || ""},${trade.pnl},${trade.pnlPercent},${trade.status},${trade.strategy},${trade.holdTime},${trade.commission},"${trade.tags.join(", ")}"`,
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `trades-export-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      showNotification.success(`Exported ${filteredAndSortedTrades.length} trades to CSV`)
    } catch (error) {
      showNotification.error("Failed to export trades")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (key: keyof Trade, addToMultiSort = false) => {
    if (addToMultiSort) {
      const existingIndex = multiSort.findIndex((s) => s.key === key)
      if (existingIndex >= 0) {
        const newMultiSort = [...multiSort]
        newMultiSort[existingIndex].direction = newMultiSort[existingIndex].direction === "asc" ? "desc" : "asc"
        setMultiSort(newMultiSort)
      } else {
        setMultiSort([...multiSort, { key, direction: "asc" }])
      }
    } else {
      setSortConfig({
        key,
        direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
      })
      setMultiSort([])
    }
  }

  const getTradeTypeIcon = (type: string) => {
    switch (type) {
      case "Stock":
        return <TrendingUp className="h-4 w-4" />
      case "Options":
        return <Target className="h-4 w-4" />
      case "Futures":
        return <Activity className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "Open") {
      return (
        <Badge className="bg-blue-950/50 text-blue-400 border-blue-800/50">
          <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
          Open
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 border-slate-700/50">
        Closed
      </Badge>
    )
  }

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? "text-emerald-400" : "text-red-400"
  }

  const getRowHeight = () => {
    switch (density) {
      case "ultra-compact":
        return "h-8"
      case "compact":
        return "h-12"
      default:
        return "h-16"
    }
  }

  const getTextSize = () => {
    switch (density) {
      case "ultra-compact":
        return "text-xs"
      case "compact":
        return "text-sm"
      default:
        return "text-sm"
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800/50 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Error Loading Trades</h3>
            <p className="text-slate-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isLoading && filteredAndSortedTrades.length === 0 && allTrades.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={<BarChart3 className="h-12 w-12" />}
            title="No trade history"
            description="Start building your trading journal by importing your first trades or connecting a broker."
            action={{
              label: "Import Trades",
              href: "/import",
            }}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Trade History</h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Complete record of all your trading activity ({filteredAndSortedTrades.length.toLocaleString()} trades)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search trades, symbols..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 w-full sm:w-64"
                />
              </div>

              {/* Density Toggle */}
              <div className="flex bg-slate-800/50 rounded-lg p-1">
                <Button
                  variant={density === "comfortable" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleDensityChange("comfortable")}
                  className="text-xs"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  Comfortable
                </Button>
                <Button
                  variant={density === "compact" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleDensityChange("compact")}
                  className="text-xs"
                >
                  Compact
                </Button>
                <Button
                  variant={density === "ultra-compact" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleDensityChange("ultra-compact")}
                  className="text-xs"
                >
                  Ultra
                </Button>
              </div>

              {/* View mode toggle for mobile */}
              <div className="flex lg:hidden bg-slate-800/50 rounded-lg p-1">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="text-xs"
                >
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="text-xs"
                >
                  Table
                </Button>
              </div>

              {/* Filter Drawer */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {(selectedFilters.symbols.length > 0 ||
                      selectedFilters.strategies.length > 0 ||
                      selectedFilters.tags.length > 0 ||
                      selectedFilters.dateRange !== "all" ||
                      selectedFilters.tradeType !== "all" ||
                      selectedFilters.status !== "all") && (
                      <Badge className="ml-2 bg-emerald-600 text-white text-xs px-1.5 py-0.5">Active</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] bg-slate-900 border-slate-800">
                  <SheetHeader>
                    <SheetTitle className="text-white">Filter Trades</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                    {/* Date Range */}
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-3 block">Date Range</label>
                      <select
                        value={selectedFilters.dateRange}
                        onChange={(e) => setSelectedFilters({ ...selectedFilters, dateRange: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                      </select>
                    </div>

                    {/* Instrument Type */}
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-3 block">Instrument Type</label>
                      <select
                        value={selectedFilters.tradeType}
                        onChange={(e) => setSelectedFilters({ ...selectedFilters, tradeType: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="all">All Types</option>
                        <option value="stock">Stocks</option>
                        <option value="options">Options</option>
                        <option value="futures">Futures</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-3 block">Status</label>
                      <select
                        value={selectedFilters.status}
                        onChange={(e) => setSelectedFilters({ ...selectedFilters, status: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Symbol Multi-Select */}
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-3 block">
                        Symbols ({selectedFilters.symbols.length} selected)
                      </label>
                      <div className="max-h-32 overflow-y-auto space-y-2 bg-slate-800/30 rounded-lg p-3">
                        {uniqueSymbols.slice(0, 20).map((symbol) => (
                          <div key={symbol} className="flex items-center space-x-2">
                            <Checkbox
                              id={`symbol-${symbol}`}
                              checked={selectedFilters.symbols.includes(symbol)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedFilters({
                                    ...selectedFilters,
                                    symbols: [...selectedFilters.symbols, symbol],
                                  })
                                } else {
                                  setSelectedFilters({
                                    ...selectedFilters,
                                    symbols: selectedFilters.symbols.filter((s) => s !== symbol),
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`symbol-${symbol}`} className="text-sm text-slate-300">
                              {symbol}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strategy Multi-Select */}
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-3 block">
                        Strategies ({selectedFilters.strategies.length} selected)
                      </label>
                      <div className="space-y-2">
                        {uniqueStrategies.map((strategy) => (
                          <div key={strategy} className="flex items-center space-x-2">
                            <Checkbox
                              id={`strategy-${strategy}`}
                              checked={selectedFilters.strategies.includes(strategy)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedFilters({
                                    ...selectedFilters,
                                    strategies: [...selectedFilters.strategies, strategy],
                                  })
                                } else {
                                  setSelectedFilters({
                                    ...selectedFilters,
                                    strategies: selectedFilters.strategies.filter((s) => s !== strategy),
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`strategy-${strategy}`} className="text-sm text-slate-300">
                              {strategy}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* P&L Range */}
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-3 block">
                        P&L Range: ${selectedFilters.pnlRange[0].toLocaleString()} - $
                        {selectedFilters.pnlRange[1].toLocaleString()}
                      </label>
                      <Slider
                        value={selectedFilters.pnlRange}
                        onValueChange={(value) =>
                          setSelectedFilters({ ...selectedFilters, pnlRange: value as [number, number] })
                        }
                        max={50000}
                        min={-10000}
                        step={100}
                        className="w-full"
                      />
                    </div>

                    {/* Tags Multi-Select */}
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-3 block">
                        Tags ({selectedFilters.tags.length} selected)
                      </label>
                      <div className="space-y-2">
                        {uniqueTags.map((tag) => (
                          <div key={tag} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag}`}
                              checked={selectedFilters.tags.includes(tag)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedFilters({
                                    ...selectedFilters,
                                    tags: [...selectedFilters.tags, tag],
                                  })
                                } else {
                                  setSelectedFilters({
                                    ...selectedFilters,
                                    tags: selectedFilters.tags.filter((t) => t !== tag),
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`tag-${tag}`} className="text-sm text-slate-300">
                              <Tag className="h-3 w-3 inline mr-1" />
                              {tag}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSelectedFilters({
                          dateRange: "all",
                          tradeType: "all",
                          status: "all",
                          symbols: [],
                          strategies: [],
                          pnlRange: [0, 50000],
                          tags: [],
                        })
                      }
                      className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isLoading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>

              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Trade</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Total Trades</p>
                  <p className="text-2xl font-bold text-white">{filteredAndSortedTrades.length.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Win Rate</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {(
                      (filteredAndSortedTrades.filter((t) => t.pnl > 0).length / filteredAndSortedTrades.length) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Total P&L</p>
                  <p
                    className={`text-2xl font-bold ${getPnLColor(filteredAndSortedTrades.reduce((sum, t) => sum + t.pnl, 0))}`}
                  >
                    {filteredAndSortedTrades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? "+" : ""}$
                    {(filteredAndSortedTrades.reduce((sum, t) => sum + t.pnl, 0) / 1000).toFixed(1)}K
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Avg Trade</p>
                  <p className="text-2xl font-bold text-white">
                    $
                    {(
                      filteredAndSortedTrades.reduce((sum, t) => sum + t.pnl, 0) / filteredAndSortedTrades.length || 0
                    ).toFixed(0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Best Trade</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    +${Math.max(...filteredAndSortedTrades.map((t) => t.pnl)).toFixed(0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Open Positions</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {filteredAndSortedTrades.filter((t) => t.status === "Open").length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isLoading && (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Card View */}
        {!isLoading && viewMode === "cards" && (
          <div className="lg:hidden space-y-4">
            {filteredAndSortedTrades.slice(0, 100).map((trade, index) => (
              <Card key={trade.id} className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">{trade.symbol}</span>
                      </div>
                      <div>
                        <div className="font-medium text-white">{trade.symbol}</div>
                        <div className="text-xs text-slate-400">{trade.date}</div>
                      </div>
                    </div>
                    {getStatusBadge(trade.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-slate-400">Entry/Exit</div>
                      <div className="text-sm text-white">
                        ${trade.entryPrice.toFixed(2)} → {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">P&L</div>
                      <div className={`text-sm font-medium ${getPnLColor(trade.pnl)}`}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      className={`${
                        trade.side.includes("Long") || trade.side.includes("Call")
                          ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
                          : trade.side.includes("Short") || trade.side.includes("Put")
                            ? "bg-red-950/50 text-red-400 border-red-800/50"
                            : "bg-purple-950/50 text-purple-400 border-purple-800/50"
                      }`}
                    >
                      {trade.side}
                    </Badge>
                    <div className="text-xs text-slate-400">{trade.strategy}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Desktop Table View with Virtualization */}
        {!isLoading && (viewMode === "table" || window.innerWidth >= 1024) && (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg sm:text-xl text-white">
                  All Trades ({filteredAndSortedTrades.length.toLocaleString()})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {multiSort.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMultiSort([])}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Clear Multi-Sort ({multiSort.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                    <tr className="border-b border-slate-800/50">
                      {[
                        { key: "id", label: "Trade ID" },
                        { key: "date", label: "Date/Time" },
                        { key: "symbol", label: "Symbol" },
                        { key: "type", label: "Type" },
                        { key: "side", label: "Side" },
                        { key: "quantity", label: "Quantity" },
                        { key: "entryPrice", label: "Entry" },
                        { key: "exitPrice", label: "Exit" },
                        { key: "pnl", label: "P&L" },
                        { key: "status", label: "Status" },
                        { key: "strategy", label: "Strategy" },
                        { key: "holdTime", label: "Hold Time" },
                      ].map(({ key, label }) => (
                        <th
                          key={key}
                          className="text-left p-4 text-slate-400 font-medium text-sm cursor-pointer hover:text-slate-300 group"
                          onClick={(e) => handleSort(key as keyof Trade, e.ctrlKey || e.metaKey)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{label}</span>
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {sortConfig.key === key && (
                              <div className="text-emerald-400">
                                {sortConfig.direction === "asc" ? (
                                  <SortAsc className="h-3 w-3" />
                                ) : (
                                  <SortDesc className="h-3 w-3" />
                                )}
                              </div>
                            )}
                            {multiSort.find((s) => s.key === key) && (
                              <Badge className="bg-emerald-600 text-white text-xs px-1 py-0">
                                {multiSort.findIndex((s) => s.key === key) + 1}
                              </Badge>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="text-left p-4 text-slate-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedTrades.slice(0, 100).map((trade, index) => (
                      <tr
                        key={trade.id}
                        className={`border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors ${getRowHeight()}`}
                      >
                        <td className="p-4">
                          <div className={`font-mono ${getTextSize()} text-slate-300`}>{trade.id}</div>
                        </td>
                        <td className="p-4">
                          <div className={`${getTextSize()} text-white`}>{trade.date}</div>
                          {density !== "ultra-compact" && <div className="text-xs text-slate-400">{trade.time}</div>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">{trade.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <div className={`${getTextSize()} font-medium text-white`}>{trade.symbol}</div>
                              {density === "comfortable" && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {trade.tags.slice(0, 2).map((tag, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="text-xs bg-slate-800/50 text-slate-400 border-slate-700/50"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {getTradeTypeIcon(trade.type)}
                            <span className={`${getTextSize()} text-slate-300`}>{trade.type}</span>
                          </div>
                          {density === "comfortable" && trade.type === "Options" && (
                            <div className="text-xs text-slate-400 mt-1">
                              {trade.strike} • {trade.expiry}
                            </div>
                          )}
                          {density === "comfortable" && trade.type === "Futures" && (
                            <div className="text-xs text-slate-400 mt-1">{trade.contract}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge
                            className={`${
                              trade.side.includes("Long") || trade.side.includes("Call")
                                ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
                                : trade.side.includes("Short") || trade.side.includes("Put")
                                  ? "bg-red-950/50 text-red-400 border-red-800/50"
                                  : "bg-purple-950/50 text-purple-400 border-purple-800/50"
                            } ${density === "ultra-compact" ? "text-xs px-1 py-0" : ""}`}
                          >
                            {density === "ultra-compact" ? trade.side.slice(0, 1) : trade.side}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className={`${getTextSize()} text-white font-medium`}>
                            {trade.quantity.toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`${getTextSize()} text-white`}>${trade.entryPrice.toFixed(2)}</div>
                        </td>
                        <td className="p-4">
                          <div className={`${getTextSize()} text-white`}>
                            {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "-"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`${getTextSize()} font-medium ${getPnLColor(trade.pnl)}`}>
                            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(0)}
                          </div>
                          {density !== "ultra-compact" && (
                            <div className={`text-xs ${getPnLColor(trade.pnl)}`}>
                              ({trade.pnl >= 0 ? "+" : ""}
                              {trade.pnlPercent.toFixed(2)}%)
                            </div>
                          )}
                        </td>
                        <td className="p-4">{getStatusBadge(trade.status)}</td>
                        <td className="p-4">
                          <div className={`${getTextSize()} text-slate-300`}>{trade.strategy}</div>
                        </td>
                        <td className="p-4">
                          <div className={`${getTextSize()} text-slate-300`}>{trade.holdTime}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {density !== "ultra-compact" && (
                              <>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-400">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-800/50 space-y-4 sm:space-y-0">
                <div className="text-sm text-slate-400">
                  Showing 1-{Math.min(100, filteredAndSortedTrades.length)} of{" "}
                  {filteredAndSortedTrades.length.toLocaleString()} trades
                  {filteredAndSortedTrades.length > 100 && (
                    <span className="text-yellow-400 ml-2">(Virtualized - showing first 100 for performance)</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" className="bg-emerald-600 text-white h-8 w-8 p-0">
                      1
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                      2
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                      3
                    </Button>
                    <span className="text-slate-400 px-2 hidden sm:inline">...</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white h-8 w-8 p-0 hidden sm:inline-flex"
                    >
                      {Math.ceil(filteredAndSortedTrades.length / 100)}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredAndSortedTrades.length === 0 && allTrades.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-12 text-center">
              <Filter className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No trades match your filters</h3>
              <p className="text-slate-400 mb-4">Try adjusting your filter criteria to see more results.</p>
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedFilters({
                    dateRange: "all",
                    tradeType: "all",
                    status: "all",
                    symbols: [],
                    strategies: [],
                    pnlRange: [0, 50000],
                    tags: [],
                  })
                }
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

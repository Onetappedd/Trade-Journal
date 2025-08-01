"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, RefreshCw, Zap, Eye, Plus } from "lucide-react"

// Mock scanner data
const scannerResults = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 182.25,
    change: 2.15,
    changePercent: 1.19,
    volume: 45230000,
    avgVolume: 52000000,
    marketCap: 2850000000000,
    rsi: 68.5,
    macd: 0.85,
    signal: "bullish",
    pattern: "Cup and Handle",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 445.8,
    change: -8.2,
    changePercent: -1.81,
    volume: 62450000,
    avgVolume: 45000000,
    marketCap: 1100000000000,
    rsi: 45.2,
    macd: -1.25,
    signal: "bearish",
    pattern: "Head and Shoulders",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 238.9,
    change: 4.5,
    changePercent: 1.92,
    volume: 89230000,
    avgVolume: 65000000,
    marketCap: 760000000000,
    rsi: 72.8,
    macd: 2.15,
    signal: "bullish",
    pattern: "Breakout",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    price: 142.35,
    change: -3.45,
    changePercent: -2.37,
    volume: 78450000,
    avgVolume: 55000000,
    marketCap: 230000000000,
    rsi: 35.6,
    macd: -0.95,
    signal: "oversold",
    pattern: "Double Bottom",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.5,
    change: 1.85,
    changePercent: 0.49,
    volume: 28450000,
    avgVolume: 32000000,
    marketCap: 2810000000000,
    rsi: 58.3,
    macd: 0.45,
    signal: "neutral",
    pattern: "Consolidation",
  },
]

const presetScans = [
  { name: "High Volume Breakouts", description: "Stocks breaking out with high volume" },
  { name: "Oversold Bounce", description: "Oversold stocks ready for reversal" },
  { name: "Momentum Stocks", description: "Stocks with strong upward momentum" },
  { name: "Gap Up Stocks", description: "Stocks gapping up on news" },
  { name: "Unusual Volume", description: "Stocks with unusual volume activity" },
  { name: "Technical Patterns", description: "Stocks forming technical patterns" },
]

const marketNews = [
  {
    title: "Fed Signals Potential Rate Cut",
    time: "2 hours ago",
    impact: "bullish",
    symbols: ["SPY", "QQQ", "IWM"],
  },
  {
    title: "Tech Earnings Beat Expectations",
    time: "4 hours ago",
    impact: "bullish",
    symbols: ["AAPL", "MSFT", "GOOGL"],
  },
  {
    title: "Oil Prices Surge on Supply Concerns",
    time: "6 hours ago",
    impact: "mixed",
    symbols: ["XOM", "CVX", "COP"],
  },
]

export default function MarketScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [filters, setFilters] = useState({
    minPrice: [1],
    maxPrice: [1000],
    minVolume: [1000000],
    minMarketCap: [1000000000],
    rsiRange: [30, 70],
    sector: "all",
    pattern: "all",
  })
  const [selectedScan, setSelectedScan] = useState("")

  const runScan = async () => {
    setIsScanning(true)
    // Simulate scanning
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsScanning(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatVolume = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(1)}T`
    }
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    return value.toString()
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "bullish":
        return "text-green-600"
      case "bearish":
        return "text-red-600"
      case "oversold":
        return "text-blue-600"
      case "overbought":
        return "text-orange-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case "bullish":
        return "default"
      case "bearish":
        return "destructive"
      case "oversold":
        return "secondary"
      case "overbought":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPLColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600"
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Scanner</h1>
          <p className="text-muted-foreground">Find trading opportunities with technical analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={runScan} disabled={isScanning}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning..." : "Run Scan"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="presets">Preset Scans</TabsTrigger>
          <TabsTrigger value="news">Market News</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-4">
            {/* Filters */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.minPrice}
                      onValueChange={(value) => setFilters({ ...filters, minPrice: value })}
                      max={1000}
                      min={1}
                      step={1}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>${filters.minPrice[0]}</span>
                      <span>$1000+</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Volume (Min)</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.minVolume}
                      onValueChange={(value) => setFilters({ ...filters, minVolume: value })}
                      max={100000000}
                      min={100000}
                      step={100000}
                    />
                    <div className="text-xs text-muted-foreground mt-1">{formatVolume(filters.minVolume[0])}+</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>RSI Range</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.rsiRange}
                      onValueChange={(value) => setFilters({ ...filters, rsiRange: value })}
                      max={100}
                      min={0}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{filters.rsiRange[0]}</span>
                      <span>{filters.rsiRange[1]}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Select value={filters.sector} onValueChange={(value) => setFilters({ ...filters, sector: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sectors</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="energy">Energy</SelectItem>
                      <SelectItem value="consumer">Consumer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pattern</Label>
                  <Select value={filters.pattern} onValueChange={(value) => setFilters({ ...filters, pattern: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Patterns</SelectItem>
                      <SelectItem value="breakout">Breakout</SelectItem>
                      <SelectItem value="reversal">Reversal</SelectItem>
                      <SelectItem value="continuation">Continuation</SelectItem>
                      <SelectItem value="consolidation">Consolidation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={runScan} className="w-full" disabled={isScanning}>
                  <Search className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
                <CardDescription>{scannerResults.length} stocks match your criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>RSI</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scannerResults.map((stock) => (
                      <TableRow key={stock.symbol}>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="font-mono">
                              {stock.symbol}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">{formatMarketCap(stock.marketCap)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(stock.price)}</div>
                        </TableCell>
                        <TableCell>
                          <div className={`${getPLColor(stock.change)}`}>
                            <div>
                              {stock.change >= 0 ? "+" : ""}
                              {formatCurrency(stock.change)}
                            </div>
                            <div className="text-xs">
                              ({stock.changePercent >= 0 ? "+" : ""}
                              {stock.changePercent.toFixed(2)}%)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatVolume(stock.volume)}</div>
                            <div className="text-xs text-muted-foreground">vs {formatVolume(stock.avgVolume)} avg</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`font-medium ${
                              stock.rsi > 70
                                ? "text-red-600"
                                : stock.rsi < 30
                                  ? "text-blue-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {stock.rsi.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSignalBadge(stock.signal)} className={getSignalColor(stock.signal)}>
                            {stock.signal}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{stock.pattern}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {presetScans.map((preset, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {preset.name}
                  </CardTitle>
                  <CardDescription>{preset.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedScan(preset.name)
                      runScan()
                    }}
                    disabled={isScanning}
                  >
                    {isScanning && selectedScan === preset.name ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Run Scan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Moving News</CardTitle>
              <CardDescription>Latest news that could impact your trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketNews.map((news, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{news.title}</h4>
                      <Badge
                        variant={
                          news.impact === "bullish"
                            ? "default"
                            : news.impact === "bearish"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {news.impact}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{news.time}</span>
                      <div className="flex items-center gap-2">
                        <span>Affects:</span>
                        {news.symbols.map((symbol) => (
                          <Badge key={symbol} variant="outline" className="text-xs">
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scanner Watchlist</CardTitle>
              <CardDescription>Stocks you're monitoring from scanner results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No stocks in your scanner watchlist yet</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stocks from Scanner
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Search, Star, Plus, Eye } from "lucide-react"

interface Ticker {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: string
  sector: string
  yourTrades: number
  yourPnL: number
  watchlisted: boolean
}

const mockTickers: Ticker[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 185.5,
    change: 2.75,
    changePercent: 1.51,
    volume: 45678900,
    marketCap: "2.89T",
    sector: "Technology",
    yourTrades: 12,
    yourPnL: 2450.67,
    watchlisted: true,
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 248.42,
    change: -5.23,
    changePercent: -2.06,
    volume: 89234567,
    marketCap: "789.2B",
    sector: "Consumer Cyclical",
    yourTrades: 8,
    yourPnL: -234.56,
    watchlisted: true,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 520.75,
    change: 12.45,
    changePercent: 2.45,
    volume: 34567890,
    marketCap: "1.28T",
    sector: "Technology",
    yourTrades: 5,
    yourPnL: 1890.23,
    watchlisted: false,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.9,
    change: 1.85,
    changePercent: 0.49,
    volume: 23456789,
    marketCap: "2.81T",
    sector: "Technology",
    yourTrades: 3,
    yourPnL: 567.89,
    watchlisted: true,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.65,
    change: -0.95,
    changePercent: -0.66,
    volume: 19876543,
    marketCap: "1.79T",
    sector: "Communication Services",
    yourTrades: 2,
    yourPnL: 123.45,
    watchlisted: false,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    price: 155.2,
    change: 3.42,
    changePercent: 2.25,
    volume: 41234567,
    marketCap: "1.61T",
    sector: "Consumer Cyclical",
    yourTrades: 6,
    yourPnL: 890.12,
    watchlisted: true,
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    price: 485.3,
    change: 8.75,
    changePercent: 1.84,
    volume: 15678901,
    marketCap: "1.23T",
    sector: "Communication Services",
    yourTrades: 4,
    yourPnL: 456.78,
    watchlisted: false,
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    price: 485.67,
    change: 1.23,
    changePercent: 0.25,
    volume: 67890123,
    marketCap: "445.2B",
    sector: "ETF",
    yourTrades: 15,
    yourPnL: 1234.56,
    watchlisted: true,
  },
]

export default function TrendingTickers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("changePercent")
  const [filterBy, setFilterBy] = useState("all")
  const [tickers, setTickers] = useState(mockTickers)

  const filteredTickers = tickers
    .filter((ticker) => {
      const matchesSearch =
        ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticker.name.toLowerCase().includes(searchTerm.toLowerCase())

      if (filterBy === "watchlist") return matchesSearch && ticker.watchlisted
      if (filterBy === "traded") return matchesSearch && ticker.yourTrades > 0
      if (filterBy === "gainers") return matchesSearch && ticker.changePercent > 0
      if (filterBy === "losers") return matchesSearch && ticker.changePercent < 0

      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "changePercent":
          return b.changePercent - a.changePercent
        case "volume":
          return b.volume - a.volume
        case "price":
          return b.price - a.price
        case "symbol":
          return a.symbol.localeCompare(b.symbol)
        default:
          return 0
      }
    })

  const toggleWatchlist = (symbol: string) => {
    setTickers((prev) =>
      prev.map((ticker) => (ticker.symbol === symbol ? { ...ticker, watchlisted: !ticker.watchlisted } : ticker)),
    )
  }

  const marketStats = {
    totalGainers: tickers.filter((t) => t.changePercent > 0).length,
    totalLosers: tickers.filter((t) => t.changePercent < 0).length,
    avgChange: tickers.reduce((sum, t) => sum + t.changePercent, 0) / tickers.length,
    watchlistCount: tickers.filter((t) => t.watchlisted).length,
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trending Tickers</h1>
            <p className="text-muted-foreground">Track market movers and manage your watchlist</p>
          </div>
        </div>
        {/* Market Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{marketStats.totalGainers}</div>
              <p className="text-xs text-muted-foreground">Gainers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{marketStats.totalLosers}</div>
              <p className="text-xs text-muted-foreground">Losers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${marketStats.avgChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {marketStats.avgChange.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">Avg Change</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{marketStats.watchlistCount}</div>
              <p className="text-xs text-muted-foreground">Watchlisted</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="changePercent">% Change</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="symbol">Symbol</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickers</SelectItem>
                  <SelectItem value="watchlist">Watchlist</SelectItem>
                  <SelectItem value="traded">Previously Traded</SelectItem>
                  <SelectItem value="gainers">Gainers</SelectItem>
                  <SelectItem value="losers">Losers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="sectors">By Sector</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Market Movers</CardTitle>
                <CardDescription>Showing {filteredTickers.length} tickers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Market Cap</TableHead>
                        <TableHead>Your Trades</TableHead>
                        <TableHead>Your P&L</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickers.map((ticker) => (
                        <TableRow key={ticker.symbol}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {ticker.watchlisted && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                              {ticker.symbol}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ticker.name}</div>
                              <Badge variant="outline" className="text-xs">
                                {ticker.sector}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>${ticker.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <div
                              className={`flex items-center gap-1 ${ticker.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {ticker.changePercent >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span>{ticker.changePercent.toFixed(2)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{(ticker.volume / 1000000).toFixed(1)}M</TableCell>
                          <TableCell>{ticker.marketCap}</TableCell>
                          <TableCell>
                            {ticker.yourTrades > 0 ? <Badge variant="secondary">{ticker.yourTrades}</Badge> : "-"}
                          </TableCell>
                          <TableCell>
                            {ticker.yourTrades > 0 ? (
                              <span className={ticker.yourPnL >= 0 ? "text-green-600" : "text-red-600"}>
                                ${ticker.yourPnL.toFixed(2)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => toggleWatchlist(ticker.symbol)}>
                                <Star
                                  className={`h-4 w-4 ${ticker.watchlisted ? "text-yellow-500 fill-current" : ""}`}
                                />
                              </Button>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchlist">
            <Card>
              <CardHeader>
                <CardTitle>Your Watchlist</CardTitle>
                <CardDescription>{tickers.filter((t) => t.watchlisted).length} symbols you're tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tickers
                    .filter((t) => t.watchlisted)
                    .map((ticker) => (
                      <Card key={ticker.symbol}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{ticker.symbol}</span>
                              <Badge variant="outline" className="text-xs">
                                {ticker.sector}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => toggleWatchlist(ticker.symbol)}>
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">${ticker.price.toFixed(2)}</span>
                              <div
                                className={`flex items-center gap-1 ${ticker.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {ticker.changePercent >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                <span className="font-medium">{ticker.changePercent.toFixed(2)}%</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">{ticker.name}</div>
                            {ticker.yourTrades > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span>{ticker.yourTrades} trades</span>
                                <span className={ticker.yourPnL >= 0 ? "text-green-600" : "text-red-600"}>
                                  ${ticker.yourPnL.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sectors">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(
                tickers.reduce(
                  (acc, ticker) => {
                    if (!acc[ticker.sector]) {
                      acc[ticker.sector] = []
                    }
                    acc[ticker.sector].push(ticker)
                    return acc
                  },
                  {} as Record<string, Ticker[]>,
                ),
              ).map(([sector, sectorTickers]) => (
                <Card key={sector}>
                  <CardHeader>
                    <CardTitle className="text-lg">{sector}</CardTitle>
                    <CardDescription>
                      {sectorTickers.length} tickers • Avg:{" "}
                      {(sectorTickers.reduce((sum, t) => sum + t.changePercent, 0) / sectorTickers.length).toFixed(2)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sectorTickers.slice(0, 5).map((ticker) => (
                        <div key={ticker.symbol} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{ticker.symbol}</span>
                            <span className="text-sm text-muted-foreground">${ticker.price.toFixed(2)}</span>
                          </div>
                          <div
                            className={`flex items-center gap-1 ${ticker.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {ticker.changePercent >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            <span className="text-sm">{ticker.changePercent.toFixed(2)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

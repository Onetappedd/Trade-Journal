"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, Search, Star, Plus, Eye, RefreshCw, ExternalLink } from "lucide-react"
import { useHybridMarketMovers, useHybridTickerSnapshot, useHybridTickerSearch } from "@/hooks/useHybridMarketData"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase"

interface ExtendedTicker {
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
  high: number
  low: number
  open: number
}

// Ticker Detail Modal Component
function TickerDetailModal({ ticker, isOpen, onClose }: { 
  ticker: string
  isOpen: boolean
  onClose: () => void 
}) {
  const { snapshot, isLoading } = useHybridTickerSnapshot(ticker)
  
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ticker}
            <Badge variant="outline">Live Data</Badge>
          </DialogTitle>
          <DialogDescription>
            Real-time market data from Polygon.io
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : snapshot ? (
          <div className="space-y-6">
            {/* Price Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold">${snapshot.price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Change</p>
                <p className={`text-lg font-semibold ${snapshot.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {snapshot.changePercent >= 0 ? '+' : ''}{snapshot.change?.toFixed(2)} ({snapshot.changePercent?.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume</p>
                <p className="text-lg font-semibold">{((snapshot.volume || 0) / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="text-lg font-semibold">{snapshot.marketCap}</p>
              </div>
            </div>

            {/* OHLC Data */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-lg font-medium">${snapshot.open?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-lg font-medium text-green-600">${snapshot.high?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low</p>
                <p className="text-lg font-medium text-red-600">${snapshot.low?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Previous Close</p>
                <p className="text-lg font-medium">${snapshot.previousClose?.toFixed(2)}</p>
              </div>
            </div>

            {/* Company Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="text-lg font-medium">{snapshot.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sector</p>
                <p className="text-lg font-medium">{snapshot.sector}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Add to Watchlist
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Chart
              </Button>
            </div>
          </div>
        ) : (
          <p>No data available for {ticker}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function TrendingTickers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("changePercent")
  const [filterBy, setFilterBy] = useState("all")
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [userTrades, setUserTrades] = useState<Map<string, { count: number; pnl: number }>>(new Map())
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([])
  
  const { user } = useAuth()
  const { gainers, losers, mostActive, isLoading, error, refresh } = useHybridMarketMovers()
  const { query, setQuery, results } = useHybridTickerSearch()

  // Fetch user's trade history for each symbol
  useEffect(() => {
    if (!user) return

    const fetchUserTrades = async () => {
      try {
        const supabase = createClient()
        const { data: trades, error } = await supabase
          .from('trades')
          .select('symbol, side, quantity, entry_price, exit_price, status')
          .eq('user_id', user.id)

        if (error) throw error

        const tradesMap = new Map()
        trades?.forEach(trade => {
          const existing = tradesMap.get(trade.symbol) || { count: 0, pnl: 0 }
          existing.count += 1
          
          // Calculate P&L for closed trades
          if (trade.status === 'closed' && trade.exit_price) {
            const pnl = trade.side === 'buy' 
              ? (trade.exit_price - trade.entry_price) * trade.quantity
              : (trade.entry_price - trade.exit_price) * trade.quantity
            existing.pnl += pnl
          }
          
          tradesMap.set(trade.symbol, existing)
        })

        setUserTrades(tradesMap)
      } catch (error) {
        console.error('Error fetching user trades:', error)
      }
    }

    fetchUserTrades()
  }, [user])

  // Load user's watchlist
  useEffect(() => {
    if (!user) return

    const loadWatchlist = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('watchlist')
          .select('symbol')
          .eq('user_id', user.id)

        if (error) throw error

        setWatchlistSymbols(data?.map(item => item.symbol) || [])
      } catch (error) {
        console.error('Error loading watchlist:', error)
      }
    }

    loadWatchlist()
  }, [user])

  // Convert market movers to extended tickers with user data
  const allTickers: ExtendedTicker[] = useMemo(() => {
    const tickers: ExtendedTicker[] = []
    
    // Add gainers
    gainers.forEach(mover => {
      const userTradeData = userTrades.get(mover.ticker) || { count: 0, pnl: 0 }
      tickers.push({
        symbol: mover.ticker,
        name: mover.ticker, // We'll need to fetch company names separately
        price: mover.value,
        change: mover.change_amount,
        changePercent: mover.change_percentage,
        volume: mover.session?.close || 0,
        marketCap: 'N/A', // Will be fetched separately
        sector: 'Unknown', // Will be fetched separately
        yourTrades: userTradeData.count,
        yourPnL: userTradeData.pnl,
        watchlisted: watchlistSymbols.includes(mover.ticker),
        high: mover.session?.high || 0,
        low: mover.session?.low || 0,
        open: mover.session?.open || 0
      })
    })

    // Add losers
    losers.forEach(mover => {
      const userTradeData = userTrades.get(mover.ticker) || { count: 0, pnl: 0 }
      tickers.push({
        symbol: mover.ticker,
        name: mover.ticker,
        price: mover.value,
        change: mover.change_amount,
        changePercent: mover.change_percentage,
        volume: mover.session?.close || 0,
        marketCap: 'N/A',
        sector: 'Unknown',
        yourTrades: userTradeData.count,
        yourPnL: userTradeData.pnl,
        watchlisted: watchlistSymbols.includes(mover.ticker),
        high: mover.session?.high || 0,
        low: mover.session?.low || 0,
        open: mover.session?.open || 0
      })
    })

    // Add most active
    mostActive.forEach(snapshot => {
      const userTradeData = userTrades.get(snapshot.ticker) || { count: 0, pnl: 0 }
      tickers.push({
        symbol: snapshot.ticker,
        name: snapshot.ticker,
        price: snapshot.value || snapshot.day?.c || 0,
        change: snapshot.todaysChange || 0,
        changePercent: snapshot.todaysChangePerc || 0,
        volume: snapshot.day?.v || 0,
        marketCap: 'N/A',
        sector: 'Unknown',
        yourTrades: userTradeData.count,
        yourPnL: userTradeData.pnl,
        watchlisted: watchlistSymbols.includes(snapshot.ticker),
        high: snapshot.day?.h || 0,
        low: snapshot.day?.l || 0,
        open: snapshot.day?.o || 0
      })
    })

    // Remove duplicates and sort by absolute change percentage
    const uniqueTickers = Array.from(
      new Map(tickers.map(ticker => [ticker.symbol, ticker])).values()
    )

    return uniqueTickers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
  }, [gainers, losers, mostActive, userTrades, watchlistSymbols])

  const filteredTickers = allTickers
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

  const toggleWatchlist = async (symbol: string) => {
    if (!user) return

    try {
      const supabase = createClient()
      const isWatchlisted = watchlistSymbols.includes(symbol)

      if (isWatchlisted) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol)
        
        setWatchlistSymbols(prev => prev.filter(s => s !== symbol))
      } else {
        await supabase
          .from('watchlist')
          .insert({ user_id: user.id, symbol })
        
        setWatchlistSymbols(prev => [...prev, symbol])
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error)
    }
  }

  const marketStats = {
    totalGainers: gainers.length,
    totalLosers: losers.length,
    avgChange: allTickers.length > 0 
      ? allTickers.reduce((sum, t) => sum + t.changePercent, 0) / allTickers.length 
      : 0,
    watchlistCount: allTickers.filter((t) => t.watchlisted).length,
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-600">Error loading market data: {error.message}</p>
        <Button onClick={() => refresh()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trending Tickers</h1>
            <p className="text-muted-foreground">
              Real-time market data from Polygon.io • Updates every 30 seconds
            </p>
          </div>
          <Button onClick={() => refresh()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Market Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{marketStats.totalGainers}</div>
              <p className="text-xs text-muted-foreground">Top Gainers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{marketStats.totalLosers}</div>
              <p className="text-xs text-muted-foreground">Top Losers</p>
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

        <Tabs defaultValue="movers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="movers">Market Movers</TabsTrigger>
            <TabsTrigger value="watchlist">My Watchlist</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="movers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Live Market Data
                  <Badge variant="outline" className="text-green-600">
                    {isLoading ? 'Loading...' : 'Live'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Real-time market movers from Polygon.io • Showing {filteredTickers.length} tickers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>High/Low</TableHead>
                          <TableHead>Your Trades</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTickers.map((ticker) => (
                          <TableRow key={ticker.symbol}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {ticker.watchlisted && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                                <span className="font-bold">{ticker.symbol}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-lg font-semibold">${ticker.price.toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 ${ticker.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {ticker.changePercent >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                <div>
                                  <div className="font-semibold">{ticker.changePercent.toFixed(2)}%</div>
                                  <div className="text-sm">{ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{((ticker.volume || 0) / 1000000).toFixed(1)}M</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="text-green-600">H: ${ticker.high.toFixed(2)}</div>
                                <div className="text-red-600">L: ${ticker.low.toFixed(2)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {ticker.yourTrades > 0 ? (
                                <div className="text-sm">
                                  <Badge variant="secondary">{ticker.yourTrades} trades</Badge>
                                  <div className={ticker.yourPnL >= 0 ? "text-green-600" : "text-red-600"}>
                                    ${ticker.yourPnL.toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setSelectedTicker(ticker.symbol)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleWatchlist(ticker.symbol)}
                                >
                                  <Star className={`h-4 w-4 ${ticker.watchlisted ? "text-yellow-500 fill-current" : ""}`} />
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchlist">
            <Card>
              <CardHeader>
                <CardTitle>Your Watchlist</CardTitle>
                <CardDescription>
                  {allTickers.filter((t) => t.watchlisted).length} symbols you're tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allTickers
                    .filter((t) => t.watchlisted)
                    .map((ticker) => (
                      <Card key={ticker.symbol} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4" onClick={() => setSelectedTicker(ticker.symbol)}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{ticker.symbol}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleWatchlist(ticker.symbol)
                              }}
                            >
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">${ticker.price.toFixed(2)}</span>
                              <div className={`flex items-center gap-1 ${ticker.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {ticker.changePercent >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                <span className="font-medium">{ticker.changePercent.toFixed(2)}%</span>
                              </div>
                            </div>
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

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Search Stocks</CardTitle>
                <CardDescription>Search for any stock ticker to view real-time data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter ticker symbol (e.g., AAPL, TSLA)..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  {results.length > 0 && (
                    <div className="space-y-2">
                      {results.map((result) => (
                        <div 
                          key={result.symbol}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedTicker(result.symbol)}
                        >
                          <div>
                            <div className="font-semibold">{result.symbol}</div>
                            <div className="text-sm text-muted-foreground">{result.name}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{result.exchange}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticker Detail Modal */}
        <TickerDetailModal 
          ticker={selectedTicker || ''} 
          isOpen={!!selectedTicker} 
          onClose={() => setSelectedTicker(null)} 
        />
      </div>
    </div>
  )
}
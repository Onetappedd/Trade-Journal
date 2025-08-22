'use client';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  Plus,
  Eye,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { fallbackMarketDataService } from '@/lib/fallback-market-data';

interface ExtendedTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  sector: string;
  yourTrades: number;
  yourPnL: number;
  watchlisted: boolean;
  high: number;
  low: number;
  open: number;
}

// Ticker Detail Modal Component
function TickerDetailModal({
  ticker,
  isOpen,
  onClose,
}: {
  ticker: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!ticker || !isOpen) return;

    const fetchSnapshot = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/market/snapshot-hybrid/${ticker}`);
        if (response.ok) {
          const data = await response.json();
          setSnapshot(data);
        }
      } catch (error) {
        console.error('Error fetching snapshot:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshot();
  }, [ticker, isOpen]);

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {ticker}
            <Badge variant="outline">Live Data</Badge>
          </AlertDialogTitle>
          <AlertDialogDescription>Real-time market data</AlertDialogDescription>
        </AlertDialogHeader>

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
                <p
                  className={`text-lg font-semibold ${snapshot.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {snapshot.changePercent >= 0 ? '+' : ''}
                  {snapshot.change?.toFixed(2)} ({snapshot.changePercent?.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume</p>
                <p className="text-lg font-semibold">
                  {((snapshot.volume || 0) / 1000000).toFixed(1)}M
                </p>
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
  );
}

export default function TrendingTickers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('changePercent');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<{
    gainers: any[];
    losers: any[];
    mostActive: any[];
  }>({ gainers: [], losers: [], mostActive: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch market data on client side only
  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/market/trending-hybrid');
        if (response.ok) {
          const data = await response.json();
          setMarketData(data);
        } else {
          // Use fallback data if API fails
          const fallbackData = await fallbackMarketDataService.getMarketMovers();
          setMarketData(fallbackData);
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
        // Use fallback data
        const fallbackData = await fallbackMarketDataService.getMarketMovers();
        setMarketData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();

    // Set up auto-refresh
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Convert market movers to extended tickers
  const allTickers: ExtendedTicker[] = useMemo(() => {
    const tickers: ExtendedTicker[] = [];

    // Add gainers
    marketData.gainers.forEach((mover) => {
      tickers.push({
        symbol: mover.symbol || mover.ticker,
        name: mover.name || mover.symbol || mover.ticker,
        price: mover.price || mover.value,
        change: mover.change || mover.change_amount,
        changePercent: mover.changePercent || mover.change_percentage,
        volume: mover.volume || 0,
        marketCap: mover.marketCap || 'N/A',
        sector: mover.sector || 'Unknown',
        yourTrades: 0,
        yourPnL: 0,
        watchlisted: false,
        high: mover.high || 0,
        low: mover.low || 0,
        open: mover.open || 0,
      });
    });

    // Add losers
    marketData.losers.forEach((mover) => {
      tickers.push({
        symbol: mover.symbol || mover.ticker,
        name: mover.name || mover.symbol || mover.ticker,
        price: mover.price || mover.value,
        change: mover.change || mover.change_amount,
        changePercent: mover.changePercent || mover.change_percentage,
        volume: mover.volume || 0,
        marketCap: mover.marketCap || 'N/A',
        sector: mover.sector || 'Unknown',
        yourTrades: 0,
        yourPnL: 0,
        watchlisted: false,
        high: mover.high || 0,
        low: mover.low || 0,
        open: mover.open || 0,
      });
    });

    // Add most active
    marketData.mostActive.forEach((mover) => {
      tickers.push({
        symbol: mover.symbol || mover.ticker,
        name: mover.name || mover.symbol || mover.ticker,
        price: mover.price || mover.value,
        change: mover.change || mover.change_amount,
        changePercent: mover.changePercent || mover.change_percentage,
        volume: mover.volume || 0,
        marketCap: mover.marketCap || 'N/A',
        sector: mover.sector || 'Unknown',
        yourTrades: 0,
        yourPnL: 0,
        watchlisted: false,
        high: mover.high || 0,
        low: mover.low || 0,
        open: mover.open || 0,
      });
    });

    // Remove duplicates and sort by absolute change percentage
    const uniqueTickers = Array.from(
      new Map(tickers.map((ticker) => [ticker.symbol, ticker])).values(),
    );

    return uniqueTickers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }, [marketData]);

  const filteredTickers = allTickers
    .filter((ticker) => {
      const matchesSearch =
        ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticker.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterBy === 'gainers') return matchesSearch && ticker.changePercent > 0;
      if (filterBy === 'losers') return matchesSearch && ticker.changePercent < 0;

      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'changePercent':
          return b.changePercent - a.changePercent;
        case 'volume':
          return b.volume - a.volume;
        case 'price':
          return b.price - a.price;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        default:
          return 0;
      }
    });

  const marketStats = {
    totalGainers: marketData.gainers.length,
    totalLosers: marketData.losers.length,
    avgChange:
      allTickers.length > 0
        ? allTickers.reduce((sum, t) => sum + t.changePercent, 0) / allTickers.length
        : 0,
    watchlistCount: 0,
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-600">Error loading market data: {error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trending Tickers</h1>
            <p className="text-muted-foreground">
              Live market data powered by Polygon.io & Finnhub • Updates every 30 seconds
            </p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
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
              <div
                className={`text-2xl font-bold ${marketStats.avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {marketStats.avgChange.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">Avg Change</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{allTickers.length}</div>
              <p className="text-xs text-muted-foreground">Total Tickers</p>
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
                  Real-time market data • Showing {filteredTickers.length} tickers
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
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTickers.map((ticker) => (
                          <TableRow key={ticker.symbol}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{ticker.symbol}</span>
                                <span className="text-sm text-muted-foreground">{ticker.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-lg font-semibold">
                                ${ticker.price.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`flex items-center gap-1 ${ticker.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {ticker.changePercent >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                <div>
                                  <div className="font-semibold">
                                    {ticker.changePercent.toFixed(2)}%
                                  </div>
                                  <div className="text-sm">
                                    {ticker.change >= 0 ? '+' : ''}
                                    {ticker.change.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {((ticker.volume || 0) / 1000000).toFixed(1)}M
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="text-green-600">H: ${ticker.high.toFixed(2)}</div>
                                <div className="text-red-600">L: ${ticker.low.toFixed(2)}</div>
                              </div>
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
                                <Button variant="ghost" size="sm">
                                  <Star className="h-4 w-4" />
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
        </Tabs>

        {/* Ticker Detail Modal */}
        <TickerDetailModal
          ticker={selectedTicker || ''}
          isOpen={!!selectedTicker}
          onClose={() => setSelectedTicker(null)}
        />
      </div>
    </div>
  );
}

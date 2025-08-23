'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { fetchJson } from '@/lib/fetchJson';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/format';
import { TickerDetailsDialog, type Ticker } from '@/components/trending/TickerDetailsDialog';
import {
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  Star,
  StarOff,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

type SortField = 'changePct' | 'price' | 'volume' | 'marketCap';
type SortOrder = 'asc' | 'desc';

export default function TrendingTickersPage() {
  const [rawData, setRawData] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('changePct');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Load watchlist from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('watchlist:v1');
    if (stored) {
      setWatchlist(JSON.parse(stored));
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchTickers();
  }, []);

  const fetchTickers = async () => {
    try {
      const data = await fetchJson<Ticker[]>('/api/trending');
      setRawData(data);
      if (refreshing) {
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      toast.error(`Failed to fetch trending tickers: ${error}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickers();
  };

  const toggleWatchlist = (symbol: string) => {
    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];
    
    setWatchlist(newWatchlist);
    localStorage.setItem('watchlist:v1', JSON.stringify(newWatchlist));
    
    if (newWatchlist.includes(symbol)) {
      toast.success(`${symbol} added to watchlist`);
    } else {
      toast.info(`${symbol} removed from watchlist`);
    }
  };

  // Filter, sort, and paginate data
  const processedData = useMemo(() => {
    let filtered = rawData;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = rawData.filter(
        t => t.symbol.toLowerCase().includes(query) || 
            t.name.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const diff = typeof aVal === 'number' && typeof bVal === 'number' 
        ? aVal - bVal 
        : String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? diff : -diff;
    });

    // Paginate
    const start = currentPage * pageSize;
    const paged = sorted.slice(start, start + pageSize);

    return {
      filtered,
      sorted,
      paged,
      totalPages: Math.ceil(sorted.length / pageSize),
    };
  }, [rawData, searchQuery, sortField, sortOrder, currentPage, pageSize]);

  const handleRowClick = (ticker: Ticker) => {
    setSelectedTicker(ticker);
    setDialogOpen(true);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, ticker: Ticker) => {
    if (e.key === 'Enter') {
      handleRowClick(ticker);
    }
  };

  const getTrendIcon = (changePct: number) => {
    if (changePct > 0) return <TrendingUp className="h-4 w-4" />;
    if (changePct < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getChangeColor = (changePct: number) => {
    if (changePct > 0) return 'text-green-600';
    if (changePct < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trending Tickers</h1>
          <p className="text-muted-foreground">
            Discover today's most active stocks and market movers
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by ticker or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            className="pl-10"
          />
        </div>
        
        <Select
          value={`${sortField}:${sortOrder}`}
          onValueChange={(value) => {
            const [field, order] = value.split(':') as [SortField, SortOrder];
            setSortField(field);
            setSortOrder(order);
            setCurrentPage(0);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="changePct:desc">% Change (High to Low)</SelectItem>
            <SelectItem value="changePct:asc">% Change (Low to High)</SelectItem>
            <SelectItem value="price:desc">Price (High to Low)</SelectItem>
            <SelectItem value="price:asc">Price (Low to High)</SelectItem>
            <SelectItem value="volume:desc">Volume (High to Low)</SelectItem>
            <SelectItem value="volume:asc">Volume (Low to High)</SelectItem>
            <SelectItem value="marketCap:desc">Market Cap (High to Low)</SelectItem>
            <SelectItem value="marketCap:asc">Market Cap (Low to High)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(0);
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">% Change</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Market Cap</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : processedData.paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No tickers found
                </TableCell>
              </TableRow>
            ) : (
              processedData.paged.map((ticker) => (
                <TableRow
                  key={ticker.symbol}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(ticker)}
                  onKeyDown={(e) => handleRowKeyDown(e, ticker)}
                  tabIndex={0}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {ticker.symbol}
                      {watchlist.includes(ticker.symbol) && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Watchlisted
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{ticker.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(ticker.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 font-medium ${getChangeColor(ticker.changePct)}`}>
                      {getTrendIcon(ticker.changePct)}
                      <span>{formatPercent(ticker.changePct)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(ticker.volume)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(ticker.marketCap)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(ticker);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(ticker.symbol);
                          }}
                        >
                          {watchlist.includes(ticker.symbol) ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove from Watchlist
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Add to Watchlist
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && processedData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, processedData.sorted.length)} of{' '}
            {processedData.sorted.length} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(processedData.totalPages - 1, p + 1))}
              disabled={currentPage >= processedData.totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <TickerDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticker={selectedTicker}
      />
    </div>
  );
}
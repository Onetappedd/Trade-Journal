'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApi } from '@/src/hooks/useApi';

interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  pnl?: number;
  opened_at: string;
  closed_at?: string;
  status: 'open' | 'closed';
  asset_type: string;
}

interface VirtualizedTradesTableProps {
  initialTrades?: Trade[];
  onTradeSelect?: (trade: Trade) => void;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    trades: Trade[];
    onTradeSelect?: (trade: Trade) => void;
  };
}

/**
 * Virtualized Trades Table
 * 
 * A high-performance trades table that uses virtualization for large datasets.
 * Only renders visible rows, keeping the UI responsive even with thousands of trades.
 * 
 * Features:
 * - Virtual scrolling for large datasets
 * - Server-side filtering and sorting
 * - Efficient rendering with react-window
 * - Minimal network payloads
 * - Responsive design
 */
export function VirtualizedTradesTable({
  initialTrades = [],
  onTradeSelect,
  showFilters = true,
  showPagination = true,
  pageSize = 50
}: VirtualizedTradesTableProps) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('opened_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    symbol: '',
    side: '',
    status: '',
    asset_type: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // API hook for fetching trades
  const { execute: fetchTrades } = useApi({
    onSuccess: (data) => {
      setTrades(data.trades || []);
      setTotalCount(data.totalCount || 0);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Failed to fetch trades:', error);
      setIsLoading(false);
    }
  });

  // Fetch trades with server-side filtering and sorting
  const loadTrades = useCallback(async (page = 1, newSortField?: string, newSortDirection?: string) => {
    setIsLoading(true);
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      sort: newSortField || sortField,
      direction: newSortDirection || sortDirection,
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
    });

    await fetchTrades(`/api/trades?${params.toString()}`);
  }, [fetchTrades, currentPage, pageSize, sortField, sortDirection, filters]);

  // Load initial data
  useEffect(() => {
    loadTrades(1);
  }, []);

  // Handle sorting
  const handleSort = useCallback((field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    loadTrades(1, field, newDirection);
  }, [sortField, sortDirection, loadTrades]);

  // Handle filtering
  const handleFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    // Debounce filter changes
    setTimeout(() => {
      loadTrades(1);
    }, 300);
  }, [loadTrades]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadTrades(page);
  }, [loadTrades]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  // List item component for virtualization
  const ListItem = useCallback(({ index, style, data }: ListItemProps) => {
    const trade = data.trades[index];
    if (!trade) return null;

    return (
      <div style={style} className="px-4 py-2 border-b border-slate-800/50">
        <div 
          className="flex items-center space-x-4 cursor-pointer hover:bg-slate-800/30 rounded p-2"
          onClick={() => data.onTradeSelect?.(trade)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-200">{trade.symbol}</span>
              <Badge 
                variant={trade.side === 'BUY' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {trade.side}
              </Badge>
              <Badge 
                variant={trade.status === 'open' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {trade.status}
              </Badge>
            </div>
            <div className="text-sm text-slate-400">
              {trade.quantity} @ ${trade.price.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            {trade.pnl !== undefined && (
              <div className={`text-sm font-medium ${
                trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${trade.pnl.toFixed(2)}
              </div>
            )}
            <div className="text-xs text-slate-500">
              {new Date(trade.opened_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  // Memoized list data
  const listData = useMemo(() => ({
    trades,
    onTradeSelect
  }), [trades, onTradeSelect]);

  return (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Trades ({totalCount.toLocaleString()})</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => loadTrades(currentPage)}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Symbol</label>
              <Input
                placeholder="Filter by symbol"
                value={filters.symbol}
                onChange={(e) => handleFilter('symbol', e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-slate-200"
              />
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Side</label>
              <Select value={filters.side} onValueChange={(value) => handleFilter('side', value)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="All sides" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sides</SelectItem>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilter('status', value)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Asset Type</label>
              <Select value={filters.asset_type} onValueChange={(value) => handleFilter('asset_type', value)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="option">Option</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Table Header */}
        <div className="flex items-center space-x-4 px-4 py-2 bg-slate-800/30 rounded text-sm text-slate-400">
          <div className="flex-1">
            <button
              onClick={() => handleSort('symbol')}
              className="flex items-center space-x-1 hover:text-slate-200"
            >
              <span>Symbol</span>
              {sortField === 'symbol' && (
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </button>
          </div>
          <div className="w-20">
            <button
              onClick={() => handleSort('side')}
              className="flex items-center space-x-1 hover:text-slate-200"
            >
              <span>Side</span>
              {sortField === 'side' && (
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </button>
          </div>
          <div className="w-24">
            <button
              onClick={() => handleSort('quantity')}
              className="flex items-center space-x-1 hover:text-slate-200"
            >
              <span>Qty</span>
              {sortField === 'quantity' && (
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </button>
          </div>
          <div className="w-24">
            <button
              onClick={() => handleSort('price')}
              className="flex items-center space-x-1 hover:text-slate-200"
            >
              <span>Price</span>
              {sortField === 'price' && (
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </button>
          </div>
          <div className="w-24">
            <button
              onClick={() => handleSort('pnl')}
              className="flex items-center space-x-1 hover:text-slate-200"
            >
              <span>P&L</span>
              {sortField === 'pnl' && (
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </button>
          </div>
          <div className="w-32">
            <button
              onClick={() => handleSort('opened_at')}
              className="flex items-center space-x-1 hover:text-slate-200"
            >
              <span>Date</span>
              {sortField === 'opened_at' && (
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Virtualized List */}
        <div className="border border-slate-800/50 rounded">
          {trades.length > 0 ? (
            <List
              height={400}
              itemCount={trades.length}
              itemSize={60}
              itemData={listData}
              overscanCount={5}
            >
              {ListItem}
            </List>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400">
              {isLoading ? 'Loading trades...' : 'No trades found'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Showing {startIndex + 1}-{endIndex} of {totalCount.toLocaleString()} trades
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

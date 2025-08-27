'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { 
  Star, 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown,
  ExternalLink,
  Plus,
  MessageSquare
} from 'lucide-react'
import type { ScannerFilters, SortConfig } from '@/hooks/useScannerState'
import { useScannerData } from '@/hooks/useScannerData'
import { useWatchlist } from '@/hooks/useWatchlist'
import { cn } from '@/lib/utils'

interface ScannerResultsProps {
  filters: ScannerFilters
  preset: string | null
  sortConfig: SortConfig[]
  visibleColumns: string[]
  selectedSymbol: string | null
  onSymbolSelect: (symbol: string) => void
}

interface ScannerResult {
  symbol: string
  name: string
  sector: string
  price: number
  change: number
  volume: number
  rvol: number
  week52High: number
  week52Low: number
  atrPercent: number
  rsi: number
  winRate?: number
  avgPnl?: number
  tradesCount?: number
  lastTraded?: string
  isWatchlisted: boolean
}

export function ScannerResults({
  filters,
  preset,
  sortConfig,
  visibleColumns,
  selectedSymbol,
  onSymbolSelect
}: ScannerResultsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: scannerData, loading, error } = useScannerData(filters, preset)
  const { addToWatchlist, removeFromWatchlist, watchlist } = useWatchlist()

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!scannerData) return []

    let filtered = scannerData.filter((item: ScannerResult) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!item.symbol.toLowerCase().includes(searchLower) && 
            !item.name.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Apply other filters
      if (filters.priceMin && item.price < filters.priceMin) return false
      if (filters.priceMax && item.price > filters.priceMax) return false
      if (filters.volumeMin && item.volume < filters.volumeMin) return false
      if (filters.rvolMin && item.rvol < filters.rvolMin) return false
      if (filters.changeMin && item.change < filters.changeMin) return false
      if (filters.changeMax && item.change > filters.changeMax) return false
      if (filters.rsiMin && item.rsi < filters.rsiMin) return false
      if (filters.rsiMax && item.rsi > filters.rsiMax) return false
      if (filters.atrPercentMin && item.atrPercent < filters.atrPercentMin) return false

      return true
    })

    // Apply sorting
    if (sortConfig.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of sortConfig) {
          const aVal = a[sort.id as keyof ScannerResult]
          const bVal = b[sort.id as keyof ScannerResult]
          
          // Handle undefined values
          if (aVal === undefined && bVal === undefined) continue
          if (aVal === undefined) return sort.desc ? -1 : 1
          if (bVal === undefined) return sort.desc ? 1 : -1
          
          if (aVal < bVal) return sort.desc ? 1 : -1
          if (aVal > bVal) return sort.desc ? -1 : 1
        }
        return 0
      })
    }

    return filtered
  }, [scannerData, searchTerm, filters, sortConfig])

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  })

  const handleSort = (columnId: string) => {
    const currentSort = sortConfig.find(s => s.id === columnId)
    const newSort: SortConfig = {
      id: columnId,
      desc: currentSort ? !currentSort.desc : false
    }
    
    // Remove existing sort for this column and add new one
    const updatedSort = sortConfig.filter(s => s.id !== columnId)
    updatedSort.unshift(newSort)
    
    // Limit to 3 sort columns
    if (updatedSort.length > 3) {
      updatedSort.splice(3)
    }
  }

  const handleWatchlistToggle = async (symbol: string) => {
    const isWatchlisted = watchlist.includes(symbol)
    if (isWatchlisted) {
      await removeFromWatchlist(symbol)
    } else {
      await addToWatchlist(symbol)
    }
  }

  const formatValue = (value: any, column: string) => {
    if (value === null || value === undefined) return '-'
    
    switch (column) {
      case 'price':
        return `$${value.toFixed(2)}`
      case 'change':
        const isPositive = value >= 0
        return (
          <span className={cn(
            'font-medium',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? '+' : ''}{value.toFixed(2)}%
          </span>
        )
      case 'volume':
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`
        }
        return value.toLocaleString()
      case 'rvol':
        return value.toFixed(1)
      case 'week52High':
      case 'week52Low':
        return `${value.toFixed(1)}%`
      case 'atrPercent':
        return `${value.toFixed(1)}%`
      case 'rsi':
        return value.toFixed(0)
      case 'winRate':
        return value ? `${(value * 100).toFixed(1)}%` : '-'
      case 'avgPnl':
        if (!value) return '-'
        const isPnlPositive = value >= 0
        return (
          <span className={cn(
            'font-medium',
            isPnlPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPnlPositive ? '+' : ''}${value.toFixed(2)}
          </span>
        )
      case 'tradesCount':
        return value || '-'
      case 'lastTraded':
        if (!value) return '-'
        const date = new Date(value)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
      default:
        return value
    }
  }

  const getColumnHeader = (column: string) => {
    const columnLabels: Record<string, string> = {
      symbol: 'Symbol',
      name: 'Name',
      sector: 'Sector',
      price: 'Price',
      change: '% Change',
      volume: 'Volume',
      rvol: 'RVOL',
      week52High: '52W High %',
      week52Low: '52W Low %',
      atrPercent: 'ATR %',
      rsi: 'RSI',
      winRate: 'Win Rate',
      avgPnl: 'Avg P&L',
      tradesCount: 'Trades',
      lastTraded: 'Last Traded'
    }
    return columnLabels[column] || column
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scanner results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading scanner results</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Controls */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Badge variant="secondary">
            {filteredData.length} results
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column} className="cursor-pointer hover:bg-muted/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort(column)}
                  >
                    {getColumnHeader(column)}
                    {sortConfig.find(s => s.id === column) && (
                      <span className="ml-1">
                        {sortConfig.find(s => s.id === column)?.desc ? '↓' : '↑'}
                      </span>
                    )}
                  </Button>
                </TableHead>
              ))}
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = filteredData[virtualRow.index]
              return (
                <TableRow
                  key={row.symbol}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    selectedSymbol === row.symbol && 'bg-muted'
                  )}
                  onClick={() => onSymbolSelect(row.symbol)}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {visibleColumns.map((column) => (
                    <TableCell key={column}>
                      {formatValue(row[column as keyof ScannerResult], column)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleWatchlistToggle(row.symbol)}>
                          <Star className="h-4 w-4 mr-2" />
                          {row.isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in Advanced Chart
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Trade
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && !loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No results found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search terms
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

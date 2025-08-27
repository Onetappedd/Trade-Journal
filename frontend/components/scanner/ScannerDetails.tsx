'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  X, 
  Star, 
  Plus, 
  MessageSquare,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  DollarSign,
  Target
} from 'lucide-react'
import { useSymbolStats } from '@/hooks/useSymbolStats'
import { useWatchlist } from '@/hooks/useWatchlist'
import { cn } from '@/lib/utils'

interface ScannerDetailsProps {
  symbol: string
  onClose: () => void
}

export function ScannerDetails({ symbol, onClose }: ScannerDetailsProps) {
  const { stats, loading } = useSymbolStats(symbol)
  const { addToWatchlist, removeFromWatchlist, isWatchlisted } = useWatchlist()
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)

  const handleWatchlistToggle = async () => {
    setIsAddingToWatchlist(true)
    try {
      if (isWatchlisted(symbol)) {
        await removeFromWatchlist(symbol)
      } else {
        await addToWatchlist(symbol)
      }
    } finally {
      setIsAddingToWatchlist(false)
    }
  }

  const handleNewTrade = () => {
    // Navigate to add trade page with symbol pre-filled
    window.open(`/dashboard/add-trade?symbol=${symbol}`, '_blank')
  }

  const handleAddNote = () => {
    // TODO: Implement add note functionality
    console.log('Add note for', symbol)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{symbol}</h2>
            <p className="text-sm text-muted-foreground">Symbol Details</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mini Chart Placeholder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Price Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chart placeholder</p>
                <p className="text-xs text-muted-foreground">TradingView widget will go here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Your Trading Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total P&L</span>
                  <span className={cn(
                    "font-medium",
                    stats.totalPnl >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(stats.totalPnl)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-medium">
                    {(stats.winRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg P&L per Trade</span>
                  <span className={cn(
                    "font-medium",
                    stats.avgPnl >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(stats.avgPnl)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Trades</span>
                  <span className="font-medium">{stats.tradesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Traded</span>
                  <span className="font-medium">{formatDate(stats.lastTraded)}</span>
                </div>
                {stats.topTags && stats.topTags.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Top Tags</span>
                    <div className="flex space-x-1">
                      {stats.topTags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">No trades yet</p>
                <p className="text-xs text-muted-foreground">Start trading this symbol to see your stats</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleWatchlistToggle}
                disabled={isAddingToWatchlist}
              >
                <Star className={cn(
                  "h-4 w-4 mr-2",
                  isWatchlisted(symbol) ? "fill-yellow-400 text-yellow-400" : ""
                )} />
                {isWatchlisted(symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleNewTrade}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Trade
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleAddNote}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Market Data Placeholder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Market Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="font-medium">$175.43</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today's Change</span>
                <span className="text-green-600 font-medium">+2.34%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Volume</span>
                <span className="font-medium">45.0M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Market Cap</span>
                <span className="font-medium">$2.7T</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

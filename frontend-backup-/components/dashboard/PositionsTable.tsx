'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  assetType: string;
}

interface PortfolioData {
  totalMarketValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  positions: Position[];
  lastUpdated: string;
  usingFallbackPrices: boolean;
}

export function PositionsTable() {
  const { session } = useAuth();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPortfolioData = async () => {
    if (!session) return;
    
    try {
      setIsRefreshing(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      };
      
      const response = await fetch('/api/portfolio-value', { headers });
      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPortfolioData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '' : '-';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
          <CardDescription>Loading real-time market values...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData || portfolioData.positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
          <CardDescription>No open positions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your open positions will appear here with real-time market values.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Open Positions</CardTitle>
            <CardDescription>
              {portfolioData.usingFallbackPrices
                ? 'Using entry prices (live prices unavailable)'
                : 'Real-time market values'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPortfolioData} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Entry Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Unrealized P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioData.positions.map((position) => (
                <TableRow key={position.symbol}>
                  <TableCell className="font-medium">{position.symbol}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {position.assetType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {position.quantity > 0 ? position.quantity : `(${Math.abs(position.quantity)})`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(position.entryPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(position.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(position.marketValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div
                        className={`flex items-center gap-1 ${
                          position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {position.unrealizedPnL >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="font-medium tabular-nums">
                          {formatCurrency(Math.abs(position.unrealizedPnL))}
                        </span>
                      </div>
                      <span
                        className={`text-xs tabular-nums ${
                          position.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatPercent(position.unrealizedPnLPercent)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Row */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Total ({portfolioData.positions.length} positions)
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Market Value</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(portfolioData.totalMarketValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                <div
                  className={`font-semibold tabular-nums ${
                    portfolioData.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(Math.abs(portfolioData.totalUnrealizedPnL))}
                  <span className="text-xs ml-1">
                    ({formatPercent(portfolioData.totalUnrealizedPnLPercent)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 text-xs text-muted-foreground text-right">
          Last updated: {new Date(portfolioData.lastUpdated).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

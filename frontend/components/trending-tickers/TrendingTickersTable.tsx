'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TrendingTickersTableProps {
  assetType: 'stocks' | 'etfs' | 'crypto';
  searchQuery: string;
}

const mockData = {
  stocks: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.43,
      change: 2.15,
      volume: '45.2M',
      marketCap: '2.75T',
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 378.85,
      change: -1.23,
      volume: '32.1M',
      marketCap: '2.81T',
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 142.56,
      change: 3.45,
      volume: '28.7M',
      marketCap: '1.78T',
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 145.86,
      change: -0.87,
      volume: '41.3M',
      marketCap: '1.51T',
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 248.42,
      change: 5.67,
      volume: '67.8M',
      marketCap: '789.2B',
    },
  ],
  etfs: [
    {
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF',
      price: 445.67,
      change: 1.23,
      volume: '78.5M',
      marketCap: '412.3B',
    },
    {
      symbol: 'QQQ',
      name: 'Invesco QQQ Trust',
      price: 378.92,
      change: 2.45,
      volume: '45.2M',
      marketCap: '198.7B',
    },
    {
      symbol: 'VTI',
      name: 'Vanguard Total Stock Market',
      price: 234.56,
      change: 0.87,
      volume: '23.1M',
      marketCap: '1.2T',
    },
  ],
  crypto: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.75,
      change: 3.45,
      volume: '2.1B',
      marketCap: '847.2B',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2567.89,
      change: -1.87,
      volume: '1.8B',
      marketCap: '308.5B',
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      price: 0.4523,
      change: 5.67,
      volume: '456.7M',
      marketCap: '15.9B',
    },
  ],
};

export function TrendingTickersTable({ assetType, searchQuery }: TrendingTickersTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const data = mockData[assetType].filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleRow = (symbol: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol);
    } else {
      newExpanded.add(symbol);
    }
    setExpandedRows(newExpanded);
  };

  const toggleWatchlist = (symbol: string) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(symbol)) {
      newWatchlist.delete(symbol);
    } else {
      newWatchlist.add(symbol);
    }
    setWatchlist(newWatchlist);
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <Collapsible key={item.symbol}>
                  <TableRow className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => toggleRow(item.symbol)}>
                          {expandedRows.has(item.symbol) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-semibold">{item.symbol}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      $
                      {assetType === 'crypto' ? item.price.toLocaleString() : item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={`flex items-center justify-end space-x-1 ${
                          item.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.change >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-mono">
                          {item.change >= 0 ? '+' : ''}
                          {item.change.toFixed(2)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.volume}</TableCell>
                    <TableCell className="text-right font-mono">{item.marketCap}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant={watchlist.has(item.symbol) ? 'default' : 'outline'}
                        onClick={() => toggleWatchlist(item.symbol)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {watchlist.has(item.symbol) ? 'Added' : 'Watch'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent>
                    <TableRow>
                      <TableCell colSpan={8} className="p-4 bg-muted/20">
                        <div className="flex items-center justify-center h-32 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-muted-foreground mb-2">📈</div>
                            <p className="text-sm text-muted-foreground">
                              Chart for {item.symbol} would go here
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <Card key={item.symbol} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg">{item.symbol}</span>
                  <Badge variant="secondary" className="text-xs">
                    {assetType.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{item.name}</p>
              </div>
              <Button
                size="sm"
                variant={watchlist.has(item.symbol) ? 'default' : 'outline'}
                onClick={() => toggleWatchlist(item.symbol)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-mono font-semibold">
                  ${assetType === 'crypto' ? item.price.toLocaleString() : item.price.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">24h Change</p>
                <div
                  className={`flex items-center space-x-1 ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {item.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-mono font-semibold">
                    {item.change >= 0 ? '+' : ''}
                    {item.change.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Volume</p>
                <p className="font-mono">{item.volume}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Market Cap</p>
                <p className="font-mono">{item.marketCap}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

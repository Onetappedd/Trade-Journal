'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';

const scanResults = [
  {
    symbol: 'NVDA',
    price: 485.2,
    change: 12.45,
    changePercent: 2.63,
    volume: 45000000,
    signal: 'Strong Buy',
  },
  {
    symbol: 'AMD',
    price: 142.8,
    change: -3.2,
    changePercent: -2.19,
    volume: 32000000,
    signal: 'Buy',
  },
  {
    symbol: 'INTC',
    price: 28.95,
    change: 0.85,
    changePercent: 3.02,
    volume: 28000000,
    signal: 'Hold',
  },
];

export function ScannerPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Market Scanner</h2>
        <Button>
          <Search className="mr-2 h-4 w-4" />
          Run Scan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Filters</CardTitle>
          <CardDescription>Configure your market scanning criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Price Range
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Volume
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Market Cap
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Technical Indicators
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Results</CardTitle>
          <CardDescription>Stocks matching your criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scanResults.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{stock.symbol}</h3>
                    <p className="text-sm text-muted-foreground">
                      Vol: {(stock.volume / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${stock.price}</div>
                  <div
                    className={`flex items-center text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {stock.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {stock.change >= 0 ? '+' : ''}
                    {stock.change} ({stock.changePercent >= 0 ? '+' : ''}
                    {stock.changePercent}%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      stock.signal === 'Strong Buy'
                        ? 'default'
                        : stock.signal === 'Buy'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {stock.signal}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

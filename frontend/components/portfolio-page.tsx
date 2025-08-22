'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PieChart,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

const mockPositions = [
  {
    symbol: 'AAPL',
    shares: 100,
    avgPrice: 175.5,
    currentPrice: 178.25,
    marketValue: 17825,
    unrealizedPL: 275,
    unrealizedPLPercent: 1.57,
    sector: 'Technology',
  },
  {
    symbol: 'TSLA',
    shares: 50,
    avgPrice: 245.3,
    currentPrice: 238.9,
    marketValue: 11945,
    unrealizedPL: -320,
    unrealizedPLPercent: -2.61,
    sector: 'Consumer Discretionary',
  },
  {
    symbol: 'MSFT',
    shares: 75,
    avgPrice: 378.9,
    currentPrice: 385.2,
    marketValue: 28890,
    unrealizedPL: 472.5,
    unrealizedPLPercent: 1.66,
    sector: 'Technology',
  },
  {
    symbol: 'GOOGL',
    shares: 25,
    avgPrice: 2750.0,
    currentPrice: 2789.45,
    marketValue: 69736.25,
    unrealizedPL: 986.25,
    unrealizedPLPercent: 1.43,
    sector: 'Communication Services',
  },
];

const sectorAllocation = [
  { sector: 'Technology', value: 46715, percentage: 36.4 },
  { sector: 'Communication Services', value: 69736.25, percentage: 54.3 },
  { sector: 'Consumer Discretionary', value: 11945, percentage: 9.3 },
];

export function PortfolioPage() {
  const totalValue = mockPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalUnrealizedPL = mockPositions.reduce((sum, pos) => sum + pos.unrealizedPL, 0);
  const totalUnrealizedPLPercent = (totalUnrealizedPL / (totalValue - totalUnrealizedPL)) * 100;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Live Portfolio</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Portfolio market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {totalUnrealizedPL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalUnrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalUnrealizedPLPercent >= 0 ? '+' : ''}
              {totalUnrealizedPLPercent.toFixed(2)}% today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPositions.length}</div>
            <p className="text-xs text-muted-foreground">Active holdings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sectors</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sectorAllocation.length}</div>
            <p className="text-xs text-muted-foreground">Diversification</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Current Positions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Positions</CardTitle>
            <CardDescription>Your active holdings and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Avg Price</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Market Value</TableHead>
                  <TableHead>Unrealized P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPositions.map((position) => (
                  <TableRow key={position.symbol}>
                    <TableCell className="font-medium">{position.symbol}</TableCell>
                    <TableCell>{position.shares}</TableCell>
                    <TableCell>${position.avgPrice.toFixed(2)}</TableCell>
                    <TableCell>${position.currentPrice.toFixed(2)}</TableCell>
                    <TableCell>${position.marketValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <div
                        className={position.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {position.unrealizedPL >= 0 ? '+' : ''}${position.unrealizedPL.toFixed(2)}
                        <div className="text-xs">
                          ({position.unrealizedPLPercent >= 0 ? '+' : ''}
                          {position.unrealizedPLPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
            <CardDescription>Portfolio diversification by sector</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectorAllocation.map((sector) => (
              <div key={sector.sector} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{sector.sector}</span>
                  <span className="text-sm text-muted-foreground">{sector.percentage}%</span>
                </div>
                <Progress value={sector.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  ${sector.value.toLocaleString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Historical performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Performance chart will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

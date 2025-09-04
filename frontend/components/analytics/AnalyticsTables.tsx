'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePnlByTag, usePnlBySymbol } from '@/hooks/useAnalytics';

export function AnalyticsTables() {
  const { data: tagData, isLoading: tagLoading } = usePnlByTag();
  const { data: symbolData, isLoading: symbolLoading } = usePnlBySymbol(15);

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US');
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Tag Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Tag</CardTitle>
          <CardDescription>P&L breakdown by trading tags</CardDescription>
        </CardHeader>
        <CardContent>
          {tagLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : tagData && tagData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">P.F.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagData.map((tag) => (
                  <TableRow key={tag.tag}>
                    <TableCell className="font-medium">{tag.tag}</TableCell>
                    <TableCell className="text-right">{formatNumber(tag.trades)}</TableCell>
                    <TableCell className={`text-right font-mono ${
                      tag.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(tag.pnl)}
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(tag.win_rate)}</TableCell>
                    <TableCell className="text-right">
                      {tag.profit_factor ? tag.profit_factor.toFixed(2) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No tag data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Symbol Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Symbols by P&L</CardTitle>
          <CardDescription>Performance breakdown by trading symbols</CardDescription>
        </CardHeader>
        <CardContent>
          {symbolLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : symbolData && symbolData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Avg Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {symbolData.map((symbol) => (
                  <TableRow key={symbol.symbol}>
                    <TableCell className="font-medium font-mono">{symbol.symbol}</TableCell>
                    <TableCell className="text-right">{formatNumber(symbol.trades)}</TableCell>
                    <TableCell className={`text-right font-mono ${
                      symbol.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(symbol.pnl)}
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(symbol.win_rate)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(symbol.avg_trade_size)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No symbol data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

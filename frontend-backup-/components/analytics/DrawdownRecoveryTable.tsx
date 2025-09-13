'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useDrawdownRecovery } from '@/hooks/useAnalytics';
import { format } from 'date-fns';

export function DrawdownRecoveryTable() {
  const { data, isLoading } = useDrawdownRecovery();

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusBadge = (recoveredOn: string | null, durationDays: number) => {
    if (recoveredOn) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Recovered
        </span>
      );
    }
    
    if (durationDays > 365) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Long-term
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Ongoing
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drawdown Recovery Analysis</CardTitle>
          <CardDescription>Loading drawdown data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drawdown Recovery Analysis</CardTitle>
          <CardDescription>No drawdown data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No drawdown data found. This requires closed trades with sufficient history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drawdown Recovery Analysis</CardTitle>
        <CardDescription>
          Top 10 deepest drawdowns with recovery time analysis. Shows how long it takes to recover from losses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Start Date</TableHead>
              <TableHead>Trough Date</TableHead>
              <TableHead>Recovery Date</TableHead>
              <TableHead className="text-right">Duration (Days)</TableHead>
              <TableHead className="text-right">Depth</TableHead>
              <TableHead className="text-right">Peak Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((drawdown, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {formatDate(drawdown.start_date)}
                </TableCell>
                <TableCell>
                  {formatDate(drawdown.trough_date)}
                </TableCell>
                <TableCell>
                  {drawdown.recovered_on ? formatDate(drawdown.recovered_on) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  {drawdown.duration_days}
                </TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {formatCurrency(drawdown.depth)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(drawdown.peak_value)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(drawdown.recovered_on, drawdown.duration_days)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Drawdowns:</span>
              <span className="ml-2 font-medium">{data.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Recovered:</span>
              <span className="ml-2 font-medium text-green-600">
                {data.filter(d => d.recovered_on).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Deepest:</span>
              <span className="ml-2 font-medium text-red-600">
                {formatCurrency(Math.max(...data.map(d => d.depth)))}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Recovery:</span>
              <span className="ml-2 font-medium">
                {Math.round(
                  data
                    .filter(d => d.recovered_on)
                    .reduce((sum, d) => sum + d.duration_days, 0) / 
                    data.filter(d => d.recovered_on).length
                ) || 0} days
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpectancyByBucket } from '@/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function ExpectancyChart() {
  const { data, isLoading } = useExpectancyByBucket();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expectancy by Bucket (R-multiple)</CardTitle>
          <CardDescription>Loading expectancy data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expectancy by Bucket (R-multiple)</CardTitle>
          <CardDescription>No expectancy data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No expectancy data found. This requires closed trades with risk information.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = data.map(item => ({
    bucket: item.bucket,
    expectancy: Number(item.expectancy),
    avgRMultiple: Number(item.avg_r_multiple),
    winRate: Number(item.win_rate),
    trades: item.trades,
  }));

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Trades: {data.trades}
          </p>
          <p className="text-sm">
            Expectancy: <span className={data.expectancy >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(data.expectancy)}
            </span>
          </p>
          <p className="text-sm">
            Avg R-multiple: <span className={data.avgRMultiple >= 0 ? 'text-green-600' : 'text-red-600'}>
              {data.avgRMultiple.toFixed(3)}
            </span>
          </p>
          <p className="text-sm">
            Win Rate: {formatPercent(data.winRate)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expectancy by Bucket (R-multiple)</CardTitle>
        <CardDescription>
          Risk-adjusted performance by trading bucket. Higher expectancy = better risk-adjusted returns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="bucket" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="expectancy" fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.expectancy >= 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Buckets:</span>
              <span className="ml-2 font-medium">{data.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Profitable:</span>
              <span className="ml-2 font-medium text-green-600">
                {data.filter(d => Number(d.expectancy) > 0).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Expectancy:</span>
              <span className={`ml-2 font-medium ${
                data.reduce((sum, d) => sum + Number(d.expectancy), 0) / data.length >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(data.reduce((sum, d) => sum + Number(d.expectancy), 0) / data.length)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Best Bucket:</span>
              <span className="ml-2 font-medium">
                {data[0]?.bucket || '—'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

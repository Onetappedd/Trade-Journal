'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import ChartFrame from '@/components/charts/ChartFrame';
import { DollarSign, Percent, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioData {
  date: string;
  value: number;
  percentChange: number;
  dollarChange: number;
}

interface PortfolioPerformanceProps {
  data: PortfolioData[];
  initialValue?: number;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, viewMode }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const isGain = data.dollarChange >= 0;

  return (
    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">
        {new Date(label).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
      <p className="text-lg font-semibold">
        $
        {data.value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <p
        className={cn(
          'text-sm font-medium',
          isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
        )}
      >
        {isGain ? '+' : ''}
        {viewMode === 'percent'
          ? `${data.percentChange.toFixed(2)}%`
          : `$${data.dollarChange.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
      </p>
    </div>
  );
};

export function PortfolioPerformance({ data, initialValue = 10000 }: PortfolioPerformanceProps) {
  const [viewMode, setViewMode] = useState<'percent' | 'dollar'>('percent');
  const [hoveredData, setHoveredData] = useState<PortfolioData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>(
    'ALL',
  );

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    const cutoffDate = new Date();

    switch (selectedPeriod) {
      case '1D':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '1W':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        return data;
    }

    return data.filter((d) => new Date(d.date) >= cutoffDate);
  }, [data, selectedPeriod]);

  // Calculate current performance
  const currentPerformance = useMemo(() => {
    if (filteredData.length === 0)
      return { value: initialValue, change: 0, percentChange: 0, isGain: true };

    const latest = filteredData[filteredData.length - 1];

    // Always compare to initial value to determine if we're in profit or loss overall
    const overallChange = latest.value - initialValue;
    const overallPercent = ((latest.value - initialValue) / initialValue) * 100;
    const overallIsGain = overallChange >= 0;

    // For period comparison (display purposes)
    const first = filteredData[0];
    const periodChange = latest.value - first.value;
    const periodPercent = ((latest.value - first.value) / first.value) * 100;

    // Use overall comparison for ALL time, period comparison for others
    const displayChange = selectedPeriod === 'ALL' ? overallChange : periodChange;
    const displayPercent = selectedPeriod === 'ALL' ? overallPercent : periodPercent;

    return {
      value: latest.value,
      change: displayChange,
      percentChange: displayPercent,
      isGain: overallIsGain, // Always use overall P&L for color
      overallChange,
      overallPercent,
    };
  }, [filteredData, initialValue, selectedPeriod]);

  // Determine chart color based on performance
  const chartColor = currentPerformance.isGain ? '#10b981' : '#ef4444';
  const gradientId = currentPerformance.isGain ? 'gainGradient' : 'lossGradient';

  // Format axis tick
  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    if (selectedPeriod === '1D') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (selectedPeriod === '1W') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatYAxisTick = (value: number) => {
    if (viewMode === 'percent') {
      return `${value.toFixed(1)}%`;
    } else {
      return `$${(value / 1000).toFixed(0)}k`;
    }
  };

  // Get chart data based on view mode
  const chartData = useMemo(() => {
    if (viewMode === 'percent') {
      return filteredData.map((d) => ({
        ...d,
        displayValue: d.percentChange,
      }));
    } else {
      return filteredData.map((d) => ({
        ...d,
        displayValue: d.value,
      }));
    }
  }, [filteredData, viewMode]);

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              $
              {currentPerformance.value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  currentPerformance.isGain
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {currentPerformance.isGain ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {currentPerformance.isGain ? '+' : ''}$
                  {Math.abs(currentPerformance.change).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-muted-foreground">
                  ({currentPerformance.percentChange >= 0 ? '+' : ''}
                  {currentPerformance.percentChange.toFixed(2)}%)
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {selectedPeriod === '1D'
                  ? 'Today'
                  : selectedPeriod === '1W'
                    ? 'Past Week'
                    : selectedPeriod === '1M'
                      ? 'Past Month'
                      : selectedPeriod === '3M'
                        ? 'Past 3 Months'
                        : selectedPeriod === '1Y'
                          ? 'Past Year'
                          : 'All Time'}
              </span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as 'percent' | 'dollar')}
            className="bg-muted/50 rounded-lg p-1"
          >
            <ToggleGroupItem
              value="percent"
              aria-label="Percent view"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              <Percent className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="dollar"
              aria-label="Dollar view"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              <DollarSign className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Time Period Selector */}
        <div className="flex items-center gap-1 px-6 pb-4">
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((period) => (
            <Button
              key={period}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                'h-8 px-3 font-medium transition-all',
                selectedPeriod === period
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {period}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <ChartFrame height={380}>
          {chartData.length > 0 ? (
            <AreaChart
              data={chartData.map(d => ({
                ...d,
                pos: Math.max(d.displayValue, 0),
                neg: Math.min(d.displayValue, 0),
              }))}
              margin={{ top: 16, right: 16, bottom: 8, left: 8 }}
              onMouseMove={(e) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setHoveredData(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
            >
              <CartesianGrid strokeOpacity={0.15} vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#888' }}
                tickFormatter={formatXAxisTick}
                interval="preserveStartEnd"
              />
              <YAxis hide={true} domain={['dataMin', 'dataMax']} />
              {/* Always render breakeven/zero line */}
              <ReferenceLine
                y={viewMode === 'dollar' ? initialValue : 0}
                stroke="currentColor"
                strokeOpacity={0.35}
              />
              <Tooltip content={<CustomTooltip viewMode={viewMode} />} cursor={false} />
              {/* Positive series (green) */}
              <Area
                type="monotone"
                dataKey="pos"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.15}
                dot={false}
                isAnimationActive={false}
              />
              {/* Negative series (red) */}
              <Area
                type="monotone"
                dataKey="neg"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.15}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </ChartFrame>
      </CardContent>
    </Card>
  );
}

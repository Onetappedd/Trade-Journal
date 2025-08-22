'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarData } from '@/lib/calendar-metrics';

interface PnLCalendarMonthlyProps {
  data: CalendarData;
}

export function PnLCalendarMonthly({ data }: PnLCalendarMonthlyProps) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [viewMode, setViewMode] = useState<'realized' | 'unrealized' | 'all'>('realized');

  // Calculate monthly aggregates
  const monthlyData = useMemo(() => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const aggregated = months.map((month, index) => {
      let realizedPnL = 0;
      let unrealizedPnL = 0;
      let tradeCount = 0;
      const trades: any[] = [];

      // Aggregate daily data for this month
      Object.entries(data.dailyData).forEach(([date, dayData]) => {
        const dateObj = new Date(date);
        if (dateObj.getFullYear() === selectedYear && dateObj.getMonth() === index) {
          realizedPnL += dayData.realizedPnL;
          unrealizedPnL += dayData.unrealizedPnL;
          tradeCount += dayData.tradeCount;
          trades.push(...dayData.trades);
        }
      });

      return {
        month,
        monthIndex: index,
        realizedPnL,
        unrealizedPnL,
        totalPnL: realizedPnL + unrealizedPnL,
        tradeCount,
        trades,
      };
    });

    return aggregated;
  }, [data.dailyData, selectedYear]);

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    Object.keys(data.dailyData).forEach((date) => {
      years.add(new Date(date).getFullYear());
    });
    // Add current year if not present
    years.add(currentDate.getFullYear());
    // Add previous year for comparison
    years.add(currentDate.getFullYear() - 1);
    return Array.from(years).sort((a, b) => b - a);
  }, [data.dailyData]);

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPnLValue = (month: any) => {
    switch (viewMode) {
      case 'realized':
        return month.realizedPnL;
      case 'unrealized':
        return month.unrealizedPnL;
      case 'all':
        return month.totalPnL;
      default:
        return month.realizedPnL;
    }
  };

  const getColorClass = (pnl: number, isCurrentMonth: boolean = false) => {
    if (pnl > 0) {
      // Profit - Green shades
      return cn(
        'text-green-900 dark:text-green-100',
        pnl <= 500 &&
          'bg-green-100 hover:bg-green-200 dark:bg-green-950/50 dark:hover:bg-green-900/50',
        pnl > 500 &&
          pnl <= 2000 &&
          'bg-green-200 hover:bg-green-300 dark:bg-green-900/60 dark:hover:bg-green-800/60',
        pnl > 2000 &&
          pnl <= 5000 &&
          'bg-green-300 hover:bg-green-400 dark:bg-green-800/70 dark:hover:bg-green-700/70',
        pnl > 5000 &&
          'bg-green-400 hover:bg-green-500 dark:bg-green-700/80 dark:hover:bg-green-600/80',
        isCurrentMonth && 'ring-2 ring-blue-500 dark:ring-blue-400',
      );
    } else if (pnl < 0) {
      // Loss - Red shades
      return cn(
        'text-red-900 dark:text-red-100',
        pnl >= -500 && 'bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/50',
        pnl < -500 &&
          pnl >= -2000 &&
          'bg-red-200 hover:bg-red-300 dark:bg-red-900/60 dark:hover:bg-red-800/60',
        pnl < -2000 &&
          pnl >= -5000 &&
          'bg-red-300 hover:bg-red-400 dark:bg-red-800/70 dark:hover:bg-red-700/70',
        pnl < -5000 && 'bg-red-400 hover:bg-red-500 dark:bg-red-700/80 dark:hover:bg-red-600/80',
        isCurrentMonth && 'ring-2 ring-blue-500 dark:ring-blue-400',
      );
    } else {
      // No trades or break-even
      return cn(
        'bg-gray-50 hover:bg-gray-100 text-gray-600',
        'dark:bg-gray-900/30 dark:hover:bg-gray-800/40 dark:text-gray-400',
        isCurrentMonth && 'ring-2 ring-blue-500 dark:ring-blue-400',
      );
    }
  };

  const isCurrentMonth = (monthIndex: number) => {
    return selectedYear === currentDate.getFullYear() && monthIndex === currentDate.getMonth();
  };

  // Calculate year statistics
  const yearStats = useMemo(() => {
    const yearTotal = monthlyData.reduce((sum, m) => sum + m.realizedPnL, 0);
    const profitableMonths = monthlyData.filter((m) => m.realizedPnL > 0).length;
    const losingMonths = monthlyData.filter((m) => m.realizedPnL < 0).length;
    const bestMonth = monthlyData.reduce((best, m) =>
      m.realizedPnL > best.realizedPnL ? m : best,
    );
    const worstMonth = monthlyData.reduce((worst, m) =>
      m.realizedPnL < worst.realizedPnL ? m : worst,
    );

    return {
      total: yearTotal,
      profitableMonths,
      losingMonths,
      bestMonth,
      worstMonth,
    };
  }, [monthlyData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Monthly P&L Overview
            </CardTitle>
            <CardDescription>Year-at-a-glance profit and loss by month</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realized">Realized</SelectItem>
                <SelectItem value="unrealized">Unrealized</SelectItem>
                <SelectItem value="all">All P&L</SelectItem>
              </SelectContent>
            </Select>

            {/* Year Selector */}
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Year Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Year Total</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  yearStats.total >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {formatCurrency(yearStats.total)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Best Month</p>
              <p className="text-lg font-semibold text-green-600">
                {yearStats.bestMonth.month.substring(0, 3)}:{' '}
                {formatCurrency(yearStats.bestMonth.realizedPnL)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Worst Month</p>
              <p className="text-lg font-semibold text-red-600">
                {yearStats.worstMonth.month.substring(0, 3)}:{' '}
                {formatCurrency(yearStats.worstMonth.realizedPnL)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-lg font-semibold">
                {yearStats.profitableMonths}/{yearStats.profitableMonths + yearStats.losingMonths}{' '}
                months
              </p>
            </div>
          </div>

          {/* Monthly Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {monthlyData.map((month) => {
              const pnl = getPnLValue(month);
              const isCurrent = isCurrentMonth(month.monthIndex);

              return (
                <TooltipProvider key={month.monthIndex}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'p-4 rounded-lg cursor-pointer transition-all',
                          'flex flex-col items-center justify-center gap-2',
                          'min-h-[100px]',
                          getColorClass(pnl, isCurrent),
                        )}
                      >
                        <span className="text-sm font-medium">{month.month.substring(0, 3)}</span>
                        {month.tradeCount > 0 ? (
                          <>
                            <span className="text-lg font-bold">
                              {formatCurrency(pnl).replace(/\.\d{2}$/, '')}
                            </span>
                            <span className="text-xs opacity-75">{month.tradeCount} trades</span>
                          </>
                        ) : (
                          <span className="text-xs opacity-50">No trades</span>
                        )}
                      </div>
                    </TooltipTrigger>

                    <TooltipContent className="w-72 p-3">
                      <div className="space-y-2">
                        <div className="font-semibold">
                          {month.month} {selectedYear}
                        </div>

                        {month.tradeCount > 0 ? (
                          <>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Realized P&L:</span>
                                <span
                                  className={
                                    month.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                  }
                                >
                                  {formatCurrency(month.realizedPnL)}
                                </span>
                              </div>
                              {month.unrealizedPnL !== 0 && (
                                <div className="flex justify-between">
                                  <span>Unrealized P&L:</span>
                                  <span
                                    className={
                                      month.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                    }
                                  >
                                    {formatCurrency(month.unrealizedPnL)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-1 border-t">
                                <span>Total:</span>
                                <span
                                  className={
                                    month.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                  }
                                >
                                  {formatCurrency(month.totalPnL)}
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 border-t">
                              <div className="text-xs text-muted-foreground">
                                Total Trades: {month.tradeCount}
                              </div>
                              {/* Show top trades */}
                              <div className="mt-2 space-y-1">
                                <div className="text-xs font-semibold">Top Trades:</div>
                                {month.trades
                                  .sort((a: any, b: any) => Math.abs(b.pnl) - Math.abs(a.pnl))
                                  .slice(0, 3)
                                  .map((trade: any, i: number) => (
                                    <div key={i} className="text-xs flex justify-between">
                                      <span>{trade.symbol}</span>
                                      <span
                                        className={
                                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                        }
                                      >
                                        {formatCurrency(trade.pnl)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No trading activity in {month.month}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-300 dark:bg-green-800/70 rounded" />
                <span className="text-xs text-muted-foreground">Profitable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-300 dark:bg-red-800/70 rounded" />
                <span className="text-xs text-muted-foreground">Loss</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-900/30 rounded" />
                <span className="text-xs text-muted-foreground">No trades</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>{yearStats.profitableMonths} profitable months</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span>{yearStats.losingMonths} losing months</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

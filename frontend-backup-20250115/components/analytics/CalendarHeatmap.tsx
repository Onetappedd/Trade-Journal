'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface DailyPnlData {
  day: string;
  pnl: number;
  trades: number;
}

interface CalendarHeatmapProps {
  data: DailyPnlData[];
  isLoading?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export function CalendarHeatmap({ data, isLoading, startDate, endDate }: CalendarHeatmapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily P&L Heatmap</CardTitle>
          <CardDescription>Loading calendar data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
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
          <CardTitle>Daily P&L Heatmap</CardTitle>
          <CardDescription>No trading data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No trades found in the selected date range
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create a map of day -> P&L for quick lookup
  const dayMap = new Map<string, number>();
  data.forEach(item => {
    dayMap.set(item.day, item.pnl);
  });

  // Generate calendar grid
  const start = startDate || new Date(data[0]?.day || new Date());
  const end = endDate || new Date(data[data.length - 1]?.day || new Date());
  
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Group by weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach(day => {
    currentWeek.push(day);
    if (day.getDay() === 6) { // Saturday
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColorClass = (pnl: number | undefined) => {
    if (pnl === undefined) return 'bg-gray-100 dark:bg-gray-800';
    if (pnl > 0) {
      if (pnl > 1000) return 'bg-green-600';
      if (pnl > 500) return 'bg-green-500';
      if (pnl > 100) return 'bg-green-400';
      return 'bg-green-300';
    } else {
      if (pnl < -1000) return 'bg-red-600';
      if (pnl < -500) return 'bg-red-500';
      if (pnl < -100) return 'bg-red-400';
      return 'bg-red-300';
    }
  };

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily P&L Heatmap</CardTitle>
        <CardDescription>
          Daily trading performance visualization. Green = profit, Red = loss
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span>Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span>High Profit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-300 rounded"></div>
              <span>Low Profit</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <span>No Trades</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-300 rounded"></div>
              <span>Low Loss</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>High Loss</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-6 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const pnl = dayMap.get(dayKey);
                  const hasData = pnl !== undefined;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`
                        h-8 w-8 rounded-sm border border-gray-200 dark:border-gray-700
                        flex items-center justify-center text-xs font-mono
                        cursor-pointer hover:scale-110 transition-transform
                        ${getColorClass(pnl)}
                        ${hasData ? 'text-white' : 'text-gray-400'}
                      `}
                      title={hasData ? `${format(day, 'MMM dd, yyyy')}: ${formatCurrency(pnl!)}` : format(day, 'MMM dd, yyyy')}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Trading Days:</span>
                <span className="ml-2 font-medium">{data.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Profitable Days:</span>
                <span className="ml-2 font-medium text-green-600">
                  {data.filter(d => d.pnl > 0).length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Losing Days:</span>
                <span className="ml-2 font-medium text-red-600">
                  {data.filter(d => d.pnl < 0).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

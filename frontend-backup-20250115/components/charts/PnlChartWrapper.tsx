'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParentSize } from '@visx/responsive';
import PnlAreaChart from './PnlAreaChart';
import { RangeFilter } from './RangeFilter';
import { PnlSummaryBar } from './PnlSummaryBar';
import { usePnlData, type GenericTrade, type PnlDataResult } from '@/hooks/usePnlData';

interface PnlChartWrapperProps {
  trades: GenericTrade[];
  title: string;
  description: string;
  className?: string;
  chartHeight?: number;
  variant?: 'dashboard' | 'analytics';
  showSummaryBar?: boolean;
  showTradeCounts?: boolean;
}

export function PnlChartWrapper({
  trades,
  title,
  description,
  className = '',
  chartHeight = 300,
  variant = 'dashboard',
  showSummaryBar = true,
  showTradeCounts = true,
}: PnlChartWrapperProps) {
  // Use the shared hook for consistent data preparation
  const pnlData: PnlDataResult = usePnlData(trades);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {description}
              {pnlData.fallbackUsed && (
                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                  (showing total P&L due to limited realized data)
                </span>
              )}
            </CardDescription>
          </div>
          <RangeFilter availableDataPoints={pnlData.totalDataPoints} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          {showSummaryBar && (
            <PnlSummaryBar 
              summary={pnlData.summary} 
              variant={variant}
              showTradeCounts={showTradeCounts}
            />
          )}

          {/* Chart */}
          <div className={`w-full`} style={{ height: chartHeight }}>
            <ParentSize>
              {({ width, height }) => (
                <PnlAreaChart
                  data={pnlData.filteredData}
                  width={width}
                  height={height}
                  margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                  mode={pnlData.mode}
                  fallbackUsed={pnlData.fallbackUsed}
                />
              )}
            </ParentSize>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

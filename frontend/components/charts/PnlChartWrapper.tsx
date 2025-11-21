'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParentSize } from '@visx/responsive';
import PnlAreaChart from './PnlAreaChart';
import { RangeFilter } from './RangeFilter';
import { PnlSummaryBar } from './PnlSummaryBar';
import { usePnlData, type GenericTrade, type PnlDataResult } from '@/hooks/usePnlData';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface BenchmarkData {
  spy?: Array<{ date: string; value: number }>;
  qqq?: Array<{ date: string; value: number }>;
}

interface PnlChartWrapperProps {
  trades: GenericTrade[];
  title: string;
  description: string;
  className?: string;
  chartHeight?: number;
  variant?: 'dashboard' | 'analytics';
  showSummaryBar?: boolean;
  showTradeCounts?: boolean;
  benchmarks?: BenchmarkData;
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
  benchmarks,
}: PnlChartWrapperProps) {
  // Use the shared hook for consistent data preparation
  const pnlData: PnlDataResult = usePnlData(trades);
  
  // State for benchmark toggles
  const [showSpy, setShowSpy] = React.useState(false);
  const [showQqq, setShowQqq] = React.useState(false);
  // State for dollar/percentage toggle
  const [showPercentage, setShowPercentage] = React.useState(false);

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
          <div className="flex items-center gap-4">
            {/* Dollar/Percentage Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPercentage(false)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  !showPercentage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                $
              </button>
              <button
                onClick={() => setShowPercentage(true)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  showPercentage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                %
              </button>
            </div>
            {/* Benchmark Toggles */}
            {benchmarks && (benchmarks.spy || benchmarks.qqq) && (
              <div className="flex items-center gap-3">
                {benchmarks.spy && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="show-spy"
                      checked={showSpy}
                      onCheckedChange={(checked) => setShowSpy(checked === true)}
                    />
                    <Label htmlFor="show-spy" className="text-sm cursor-pointer">
                      SPY
                    </Label>
                  </div>
                )}
                {benchmarks.qqq && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="show-qqq"
                      checked={showQqq}
                      onCheckedChange={(checked) => setShowQqq(checked === true)}
                    />
                    <Label htmlFor="show-qqq" className="text-sm cursor-pointer">
                      QQQ
                    </Label>
                  </div>
                )}
              </div>
            )}
            <RangeFilter availableDataPoints={pnlData.totalDataPoints} />
          </div>
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
                  benchmarks={benchmarks}
                  showSpy={showSpy}
                  showQqq={showQqq}
                  showPercentage={showPercentage}
                  initialValue={pnlData.filteredData.length > 0 ? pnlData.filteredData[0].value : 10000}
                />
              )}
            </ParentSize>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

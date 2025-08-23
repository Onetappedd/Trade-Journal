'use client';

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface DataPoint {
  date: string;
  value: number;
  pnl?: number;
}

interface ProfessionalEquityChartProps {
  data: DataPoint[];
  initialValue?: number;
  title?: string;
  subtitle?: string;
  height?: number;
  showTimeframeToggle?: boolean;
  className?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, viewMode, initialValue }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value;
    const pnl = data.pnl || (value - (initialValue || 10000));
    const pnlPercent = ((pnl / (initialValue || 10000)) * 100);
    
    return (
      <div className="bg-black/90 border border-gray-700 rounded-lg p-3 shadow-lg backdrop-blur-sm">
        <p className="text-gray-300 text-sm font-medium">{label}</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Value:</span>
            <span className={`text-sm font-semibold ${value >= (initialValue || 10000) ? 'text-green-400' : 'text-red-400'}`}>
              {viewMode === 'dollar' ? `$${value.toLocaleString()}` : `${pnlPercent.toFixed(2)}%`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">P&L:</span>
            <span className={`text-sm font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}{viewMode === 'dollar' ? `$${pnl.toLocaleString()}` : `${pnlPercent.toFixed(2)}%`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ProfessionalEquityChart({
  data,
  initialValue = 10000,
  title = "Portfolio Performance",
  subtitle = "Your trading performance over time",
  height = 400,
  showTimeframeToggle = true,
  className = "",
}: ProfessionalEquityChartProps) {
  const [viewMode, setViewMode] = useState<'dollar' | 'percent'>('dollar');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');

  // Transform data for the selected view mode
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate placeholder data if no real data
      const placeholderData = [];
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        placeholderData.push({
          date: date.toISOString().split('T')[0],
          value: initialValue + (Math.random() - 0.5) * 2000, // Random variation
          pnl: (Math.random() - 0.5) * 2000,
        });
      }
      return placeholderData;
    }

    return data.map(point => ({
      ...point,
      pnl: point.pnl || (point.value - initialValue),
      displayValue: viewMode === 'dollar' ? point.value : ((point.value - initialValue) / initialValue) * 100,
    }));
  }, [data, viewMode, initialValue]);

  // Calculate performance metrics
  const metrics = useMemo(() => {
    if (chartData.length === 0) return { totalReturn: 0, totalReturnPercent: 0, isPositive: true };
    
    const firstValue = chartData[0]?.value || initialValue;
    const lastValue = chartData[chartData.length - 1]?.value || initialValue;
    const totalReturn = lastValue - firstValue;
    const totalReturnPercent = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      totalReturn,
      totalReturnPercent,
      isPositive: totalReturn >= 0,
    };
  }, [chartData, initialValue]);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (!chartData.length) return chartData;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
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
      default:
        return chartData;
    }
    
    return chartData.filter(point => new Date(point.date) >= cutoffDate);
  }, [chartData, timeframe]);

  return (
    <Card className={`bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-lg font-semibold">{title}</CardTitle>
            <p className="text-gray-400 text-sm">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'dollar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('dollar')}
                className={`h-8 px-3 text-xs ${viewMode === 'dollar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <DollarSign className="w-3 h-3 mr-1" />
                $
              </Button>
              <Button
                variant={viewMode === 'percent' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('percent')}
                className={`h-8 px-3 text-xs ${viewMode === 'percent' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Percent className="w-3 h-3 mr-1" />
                %
              </Button>
            </div>

            {/* Timeframe Toggle */}
            {showTimeframeToggle && (
              <div className="flex bg-gray-800 rounded-lg p-1">
                {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((tf) => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeframe(tf)}
                    className={`h-8 px-2 text-xs ${timeframe === tf ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {tf}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            {metrics.isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-medium ${metrics.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.isPositive ? '+' : ''}{viewMode === 'dollar' ? `$${metrics.totalReturn.toLocaleString()}` : `${metrics.totalReturnPercent.toFixed(2)}%`}
            </span>
          </div>
          <span className="text-gray-500 text-sm">
            {viewMode === 'dollar' ? `$${chartData[chartData.length - 1]?.value?.toLocaleString() || initialValue.toLocaleString()}` : `${metrics.totalReturnPercent.toFixed(2)}%`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <defs>
                {/* Green gradient for positive performance */}
                <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                
                {/* Red gradient for negative performance */}
                <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
                
                {/* Neutral gradient for mixed performance */}
                <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6b7280" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#6b7280" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                strokeOpacity={0.3}
                vertical={false}
              />
              
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  switch (timeframe) {
                    case '1D':
                      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    case '1W':
                    case '1M':
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    case '3M':
                    case '1Y':
                    case 'ALL':
                      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    default:
                      return value;
                  }
                }}
                interval="preserveStartEnd"
              />
              
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(value) => {
                  if (viewMode === 'dollar') {
                    return `$${(value / 1000).toFixed(0)}k`;
                  } else {
                    return `${value.toFixed(1)}%`;
                  }
                }}
                domain={['auto', 'auto']}
              />

              {/* Reference line for breakeven */}
              <ReferenceLine
                y={viewMode === 'dollar' ? initialValue : 0}
                stroke="#6b7280"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />

              <Tooltip
                content={<CustomTooltip viewMode={viewMode} initialValue={initialValue} />}
                cursor={false}
              />

              {/* Main area chart */}
              <Area
                type="monotone"
                dataKey="displayValue"
                stroke={metrics.isPositive ? "#10b981" : "#ef4444"}
                strokeWidth={2}
                fill={metrics.isPositive ? "url(#positiveGradient)" : "url(#negativeGradient)"}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: metrics.isPositive ? "#10b981" : "#ef4444",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

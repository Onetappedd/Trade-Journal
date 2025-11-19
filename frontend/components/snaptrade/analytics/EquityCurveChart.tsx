/**
 * Equity Curve Chart Component
 * Displays total account value over time
 * 
 * Usage:
 * <EquityCurveChart userId={user.id} days={30} />
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  totalValue: number;
}

interface EquityCurveProps {
  userId: string;
  days?: 7 | 30 | 90 | 365;
  className?: string;
}

export default function EquityCurveChart({ 
  userId, 
  days = 30,
  className 
}: EquityCurveProps) {
  const [data, setData] = useState<{
    dataPoints: DataPoint[];
    currentValue: number;
    startValue: number;
    change: number;
    changePercent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/snaptrade/analytics/equity-curve?userId=${userId}&days=${days}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to load equity curve:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.dataPoints.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
          <CardDescription>
            Total account value over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available yet. Connect a broker to start tracking.
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change >= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Equity Curve</CardTitle>
            <CardDescription>
              Last {days} days
            </CardDescription>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${data.currentValue.toLocaleString('en-US', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositive ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? "+" : ""}
              ${Math.abs(data.change).toLocaleString('en-US', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
              {" "}
              ({isPositive ? "+" : ""}{data.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <SimpleLineChart 
          data={data.dataPoints}
          isPositive={isPositive}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Simple SVG line chart
 * Replace with Recharts/Chart.js for production
 */
function SimpleLineChart({ 
  data, 
  isPositive 
}: { 
  data: DataPoint[]; 
  isPositive: boolean;
}) {
  if (data.length === 0) return null;

  const width = 800;
  const height = 200;
  const padding = 20;

  // Find min/max values
  const values = data.map(d => d.totalValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Generate SVG path
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.totalValue - minValue) / valueRange) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto"
        style={{ minHeight: '200px' }}
      >
        {/* Grid lines */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.2" />
            <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - 2 * padding);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          );
        })}

        {/* Area under the curve */}
        <path
          d={`${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill="url(#lineGradient)"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((d.totalValue - minValue) / valueRange) * (height - 2 * padding);
          
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={isPositive ? "#10b981" : "#ef4444"}
              className="hover:r-5 transition-all cursor-pointer"
            >
              <title>
                {new Date(d.date).toLocaleDateString()}: 
                ${d.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </title>
            </circle>
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-5">
        <span>{new Date(data[0].date).toLocaleDateString()}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

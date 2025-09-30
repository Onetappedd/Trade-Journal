/**
 * Allocation Pie Chart Component
 * Shows portfolio breakdown by asset type
 * 
 * Usage:
 * <AllocationPieChart userId={user.id} />
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AllocationItem {
  name: string;
  value: number;
  percentage: number;
}

interface Position {
  symbol: string;
  name: string;
  assetType: string;
  value: number;
  quantity: number;
  percentage: number;
  costBasis: number;
  unrealizedPnL: number;
}

interface AllocationProps {
  userId: string;
  className?: string;
}

export default function AllocationPieChart({ 
  userId,
  className 
}: AllocationProps) {
  const [data, setData] = useState<{
    byAssetType: AllocationItem[];
    byPosition: Position[];
    totalValue: number;
    positionCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/snaptrade/analytics/allocation?userId=${userId}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to load allocation:", error);
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

  if (!data || data.byAssetType.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Allocation</CardTitle>
          <CardDescription>
            Portfolio breakdown by asset type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No positions found. Start trading to see your allocation.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Allocation</CardTitle>
        <CardDescription>
          {data.positionCount} positions • ${data.totalValue.toLocaleString('en-US', { 
            minimumFractionDigits: 2 
          })} total
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Asset Type Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">By Asset Type</h4>
          <SimplePieChart data={data.byAssetType} />
        </div>

        {/* Top Positions */}
        <div>
          <h4 className="text-sm font-medium mb-3">Top Positions</h4>
          <div className="space-y-2">
            {data.byPosition.slice(0, 5).map((pos, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1">
                  <div className="font-medium">{pos.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {pos.quantity.toFixed(2)} shares • {pos.assetType}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${pos.value.toLocaleString('en-US', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </div>
                  <div className={cn(
                    "text-xs",
                    pos.unrealizedPnL >= 0 
                      ? "text-emerald-600 dark:text-emerald-500" 
                      : "text-red-600 dark:text-red-500"
                  )}>
                    {pos.unrealizedPnL >= 0 ? "+" : ""}
                    ${Math.abs(pos.unrealizedPnL).toLocaleString('en-US', { 
                      minimumFractionDigits: 2 
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple Donut Chart
 * Replace with Recharts/Chart.js for production
 */
function SimplePieChart({ data }: { data: AllocationItem[] }) {
  const colors = [
    "#10b981", // emerald
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
  ];

  let currentAngle = 0;

  return (
    <div className="space-y-3">
      {/* Donut chart */}
      <div className="flex justify-center">
        <svg 
          viewBox="0 0 200 200" 
          className="w-48 h-48"
        >
          {data.map((item, i) => {
            const percentage = item.percentage / 100;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            currentAngle += angle;

            // Convert to radians
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);

            // Calculate path for donut segment
            const innerRadius = 60;
            const outerRadius = 90;

            const x1 = 100 + outerRadius * Math.cos(startRad);
            const y1 = 100 + outerRadius * Math.sin(startRad);
            const x2 = 100 + outerRadius * Math.cos(endRad);
            const y2 = 100 + outerRadius * Math.sin(endRad);
            const x3 = 100 + innerRadius * Math.cos(endRad);
            const y3 = 100 + innerRadius * Math.sin(endRad);
            const x4 = 100 + innerRadius * Math.cos(startRad);
            const y4 = 100 + innerRadius * Math.sin(startRad);

            const largeArc = angle > 180 ? 1 : 0;

            const pathD = `
              M ${x1} ${y1}
              A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
              L ${x3} ${y3}
              A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
              Z
            `;

            return (
              <path
                key={i}
                d={pathD}
                fill={colors[i % colors.length]}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <title>
                  {item.name}: ${item.value.toLocaleString('en-US', { 
                    minimumFractionDigits: 2 
                  })} ({item.percentage.toFixed(1)}%)
                </title>
              </path>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.percentage.toFixed(1)}% • ${item.value.toLocaleString('en-US', { 
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0 
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Performance Metrics Component
 * Shows win rate, R:R, P&L statistics
 * 
 * Usage:
 * <PerformanceMetrics userId={user.id} days={90} />
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Award, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceData {
  winRate: number;
  avgRR: number;
  totalPnL: number;
  trades: number;
  wins: number;
  losses: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  totalWins: number;
  totalLosses: number;
}

interface PerformanceMetricsProps {
  userId: string;
  days?: 30 | 90 | 365;
  className?: string;
}

export default function PerformanceMetrics({ 
  userId, 
  days = 90,
  className 
}: PerformanceMetricsProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/snaptrade/analytics/performance?userId=${userId}&days=${days}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to load performance metrics:", error);
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.trades === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>
            Last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No completed trades found in the last {days} days.
          </div>
        </CardContent>
      </Card>
    );
  }

  const isProfitable = data.totalPnL >= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Last {days} days • {data.trades} trades
            </CardDescription>
          </div>
          
          <Badge 
            variant={isProfitable ? "default" : "destructive"}
            className="text-base px-3 py-1"
          >
            {isProfitable ? "+" : ""}
            ${Math.abs(data.totalPnL).toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Win Rate */}
          <MetricCard
            icon={Target}
            label="Win Rate"
            value={`${data.winRate.toFixed(1)}%`}
            subValue={`${data.wins}W / ${data.losses}L`}
            color={data.winRate >= 50 ? "emerald" : "amber"}
          />

          {/* Average R:R */}
          <MetricCard
            icon={Award}
            label="Avg R:R"
            value={data.avgRR.toFixed(2)}
            subValue={data.avgRR >= 2 ? "Excellent" : data.avgRR >= 1.5 ? "Good" : "Fair"}
            color={data.avgRR >= 2 ? "emerald" : data.avgRR >= 1.5 ? "blue" : "amber"}
          />

          {/* Profit Factor */}
          <MetricCard
            icon={TrendingUp}
            label="Profit Factor"
            value={data.profitFactor.toFixed(2)}
            subValue={data.profitFactor >= 2 ? "Strong" : data.profitFactor >= 1.5 ? "Good" : "Weak"}
            color={data.profitFactor >= 2 ? "emerald" : data.profitFactor >= 1.5 ? "blue" : "amber"}
          />

          {/* Average Win */}
          <MetricCard
            icon={DollarSign}
            label="Avg Win"
            value={`$${data.avgWin.toFixed(2)}`}
            subValue={`Avg Loss: $${Math.abs(data.avgLoss).toFixed(2)}`}
            color="blue"
          />
        </div>

        {/* Detailed Stats */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Largest Win</div>
            <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-500">
              +${data.largestWin.toLocaleString('en-US', { 
                minimumFractionDigits: 2 
              })}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">Largest Loss</div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-500">
              ${data.largestLoss.toLocaleString('en-US', { 
                minimumFractionDigits: 2 
              })}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Total Wins</div>
            <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-500">
              +${data.totalWins.toLocaleString('en-US', { 
                minimumFractionDigits: 2 
              })}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Total Losses</div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-500">
              -${data.totalLosses.toLocaleString('en-US', { 
                minimumFractionDigits: 2 
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue: string;
  color: "emerald" | "blue" | "amber" | "red";
}

function MetricCard({ icon: Icon, label, value, subValue, color }: MetricCardProps) {
  const colorClasses = {
    emerald: "text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20",
    blue: "text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-900/20",
    amber: "text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/20",
    red: "text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/20"
  };

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-2 rounded-full", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{subValue}</div>
    </div>
  );
}

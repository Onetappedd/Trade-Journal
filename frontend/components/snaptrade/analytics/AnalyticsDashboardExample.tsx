/**
 * Analytics Dashboard Example
 * Combines equity curve, allocation, and performance metrics
 * 
 * This is a reference implementation showing how to use the analytics components
 * 
 * Usage:
 * <AnalyticsDashboardExample userId={user.id} />
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import EquityCurveChart from "./EquityCurveChart";
import AllocationPieChart from "./AllocationPieChart";
import PerformanceMetrics from "./PerformanceMetrics";
import { Calendar, TrendingUp, PieChart, Award } from "lucide-react";

interface AnalyticsDashboardProps {
  userId: string;
}

export default function AnalyticsDashboardExample({ userId }: AnalyticsDashboardProps) {
  const [timePeriod, setTimePeriod] = useState<7 | 30 | 90 | 365>(30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Performance insights from your broker connections
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {[
              { label: "1W", value: 7 },
              { label: "1M", value: 30 },
              { label: "3M", value: 90 },
              { label: "1Y", value: 365 }
            ].map(({ label, value }) => (
              <Button
                key={value}
                variant={timePeriod === value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimePeriod(value as any)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Equity Curve - Full Width */}
        <div className="md:col-span-2">
          <EquityCurveChart 
            userId={userId} 
            days={timePeriod}
          />
        </div>

        {/* Allocation */}
        <AllocationPieChart userId={userId} />

        {/* Performance Metrics */}
        <PerformanceMetrics 
          userId={userId}
          days={timePeriod === 7 ? 30 : timePeriod} // Minimum 30 days for stats
        />
      </div>

      {/* Detailed Views (Optional Tabs) */}
      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="allocation">
            <PieChart className="h-4 w-4 mr-2" />
            Allocation
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Award className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <EquityCurveChart userId={userId} days={timePeriod} />
            
            <div className="grid md:grid-cols-2 gap-6">
              <AllocationPieChart userId={userId} />
              <PerformanceMetrics userId={userId} days={timePeriod === 7 ? 30 : timePeriod} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="allocation" className="mt-6">
          <div className="grid gap-6">
            <AllocationPieChart userId={userId} />
            
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">About Allocation</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Your portfolio allocation shows how your assets are distributed across
                  different types (stocks, options, ETFs, etc.).
                </p>
                <p>
                  <strong>Diversification</strong> helps reduce risk by spreading investments
                  across multiple assets and sectors.
                </p>
                <p>
                  💡 <strong>Tip:</strong> Most financial advisors recommend having no more
                  than 5-10% of your portfolio in any single position.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid gap-6">
            <PerformanceMetrics userId={userId} days={timePeriod === 7 ? 30 : timePeriod} />
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* Metric Explanations */}
              <MetricExplanation
                title="Win Rate"
                description="Percentage of trades that were profitable. A 50%+ win rate is generally good, but remember that a lower win rate can still be profitable with good risk management."
                benchmark="50%+"
              />
              
              <MetricExplanation
                title="Average R:R"
                description="Risk-to-Reward ratio shows how much you make on winners vs. lose on losers. An R:R of 2:1 means you make $2 for every $1 you risk."
                benchmark="2:1+"
              />
              
              <MetricExplanation
                title="Profit Factor"
                description="Total wins divided by total losses. A profit factor above 2.0 indicates a very profitable system. 1.5+ is good, below 1.0 means you're losing money."
                benchmark="1.5+"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-600 dark:text-blue-400 mt-0.5">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Analytics powered by SnapTrade
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Your data syncs automatically once per day. Manual refresh available for instant updates.
              All calculations are based on actual trade data from your connected brokers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricExplanation({
  title,
  description,
  benchmark
}: {
  title: string;
  description: string;
  benchmark: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground mb-3">
        {description}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Benchmark:</span>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
          {benchmark}
        </span>
      </div>
    </div>
  );
}

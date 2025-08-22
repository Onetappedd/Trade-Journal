'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardStatsProps {
  stats: {
    totalValue: number;
    totalPnL: number;
    winRate: number;
    activePositions: number;
    todayPnL: number;
    weekPnL: number;
    monthPnL: number;
  };
}

interface PortfolioData {
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  positions: any[];
  lastUpdated: string;
  usingFallbackPrices: boolean;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPortfolioValue = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/portfolio-value');
      if (response.ok) {
        const data = await response.json();
        setPortfolioData(data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio value:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolioValue();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPortfolioValue, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number, showSign: boolean = false) => {
    const prefix = showSign && value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeType = (value: number) => (value >= 0 ? 'positive' : 'negative');

  // Use real portfolio value if available, otherwise fall back to stats
  const displayValue = portfolioData?.totalMarketValue || stats.totalValue;
  const unrealizedPnL = portfolioData?.totalUnrealizedPnL || 0;
  const unrealizedPnLPercent = portfolioData?.totalUnrealizedPnLPercent || 0;

  const statCards = [
    {
      title: 'Total Portfolio Value',
      value: isLoading ? null : formatCurrency(displayValue),
      change: portfolioData ? (
        <div className="flex items-center gap-1">
          <span className={unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(unrealizedPnL, true)} ({formatPercent(Math.abs(unrealizedPnLPercent))})
          </span>
          {portfolioData.usingFallbackPrices && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Using entry prices (live prices unavailable)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ) : (
        formatCurrency(stats.monthPnL, true)
      ),
      changeType: portfolioData ? getChangeType(unrealizedPnL) : getChangeType(stats.monthPnL),
      icon: DollarSign,
      changeLabel: portfolioData ? 'unrealized P&L' : 'from last month',
      showRefresh: true,
    },
    {
      title: 'Total P&L',
      value: formatCurrency(stats.totalPnL, true),
      change: formatCurrency(stats.weekPnL, true),
      changeType: getChangeType(stats.weekPnL),
      icon: stats.totalPnL >= 0 ? TrendingUp : TrendingDown,
      changeLabel: 'this week',
    },
    {
      title: 'Win Rate',
      value: formatPercent(stats.winRate),
      change: formatCurrency(stats.todayPnL, true),
      changeType: getChangeType(stats.todayPnL),
      icon: Activity,
      changeLabel: "today's P&L",
    },
    {
      title: 'Active Positions',
      value: portfolioData
        ? portfolioData.positions.length.toString()
        : stats.activePositions.toString(),
      change:
        portfolioData && portfolioData.positions.length > 0
          ? `${portfolioData.positions.length} open`
          : stats.activePositions > 0
            ? 'Open'
            : 'No positions',
      changeType: 'neutral' as const,
      icon: Activity,
      changeLabel: '',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className="flex items-center gap-2">
              {stat.showRefresh && (
                <button
                  onClick={fetchPortfolioValue}
                  disabled={isRefreshing}
                  className="hover:bg-muted rounded p-1 transition-colors"
                  aria-label="Refresh portfolio value"
                >
                  <RefreshCw
                    className={`h-3 w-3 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              )}
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {stat.value === null ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <div className="text-2xl font-bold">{stat.value}</div>
            )}
            <p
              className={`text-xs ${
                stat.changeType === 'positive'
                  ? 'text-green-600'
                  : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-muted-foreground'
              }`}
            >
              {typeof stat.change === 'string' ? stat.change : stat.change} {stat.changeLabel}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

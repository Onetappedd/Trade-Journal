'use client';
import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { chartTheme } from '@/lib/chart-theme';
import { useAnalyticsFiltersStore } from '@/store/analytics-filters';
import { useEquityCurve } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

export function EquityCurveChart() {
  const [percent, setPercent] = useState(false);
  const theme = chartTheme();
  const filters = useAnalyticsFiltersStore();
  const { data, isLoading, error } = useEquityCurve();

  // Transform data for percent toggle
  const chartData = useMemo(() => {
    if (!percent || !data?.length) return data || [];
    const base = data[0]?.equity || 1;
    return data.map((d) => ({ ...d, equity: ((d.equity - base) / base) * 100 }));
  }, [percent, data]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center mb-2">
          <span className="tk-heading text-base mr-4">Equity Curve</span>
          <Skeleton className="h-6 w-12 ml-auto" />
        </div>
        <Skeleton className="w-full h-60" />
      </div>
    );
  }

  // Show error state
  if (error || !data?.length) {
    return (
      <div className="w-full">
        <div className="flex items-center mb-2">
          <span className="tk-heading text-base mr-4">Equity Curve</span>
        </div>
        <div className="h-60 flex items-center justify-center text-muted-foreground">
          {error ? 'Failed to load equity data' : 'No equity data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center mb-2">
        <span className="tk-heading text-base mr-4">Equity Curve</span>
        <button
          className={`tk-chip ml-auto text-xs ${percent ? 'ring-1 ring-[hsl(var(--primary))] text-[hsl(var(--foreground))]' : ''}`}
          onClick={() => setPercent((p) => !p)}
        >
          {percent ? '%' : '$'}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tick={{ fill: theme.axis, fontSize: 12 }}
            axisLine={{ stroke: theme.axis, strokeWidth: 1 }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: theme.axis, fontSize: 12 }}
            axisLine={{ stroke: theme.axis, strokeWidth: 1 }}
            tickLine={false}
            width={60}
            domain={['auto', 'auto']}
            tickFormatter={(v) => (percent ? `${v.toFixed(1)}%` : `$${v.toLocaleString()}`)}
          />
          <CartesianGrid stroke={theme.grid} strokeOpacity={0.25} vertical={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div
                  className="tk-card p-2 border border-[hsl(var(--border))] shadow-lg"
                  style={{ background: theme.bg, color: theme.fg }}
                >
                  <div className="text-xs mb-1">{label}</div>
                  <div className="font-bold text-sm">
                    {percent ? `${d.equity.toFixed(2)}%` : `$${d.equity.toLocaleString()}`}
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={theme.primary}
            strokeWidth={2}
            fill="url(#equityGradient)"
            dot={false}
            activeDot={{ r: 4, fill: theme.primary, stroke: theme.bg, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

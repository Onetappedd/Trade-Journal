'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PortfolioDataPoint {
  date: string;
  value: number;
  dollarChange: number;
  percentChange: number;
  pos: number;
  neg: number;
}

interface EquityAnalyticsChartProps {
  data: PortfolioDataPoint[];
  initialCapital: number;
}

export function EquityAnalyticsChart({ data, initialCapital }: EquityAnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No equity data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 16, right: 16, bottom: 8, left: 8 }}
      >
        <CartesianGrid strokeOpacity={0.15} vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          hide={false}
          domain={['auto', 'auto']}
          width={62}
          tickFormatter={v => Math.round(Number(v)).toString()}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.35} />
        <RTooltip
          contentStyle={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        />
        <Area type="monotone" dataKey="pos" stroke="hsl(142.1 76.2% 36.3%)" fill="hsl(142.1 76.2% 36.3%)" fillOpacity={0.15} dot={false} isAnimationActive={false} />
        <Area type="monotone" dataKey="neg" stroke="hsl(0 84.2% 60.2%)" fill="hsl(0 84.2% 60.2%)" fillOpacity={0.15} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

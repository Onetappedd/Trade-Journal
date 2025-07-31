"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Area } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useTheme } from "next-themes";
import { useMemo } from "react";

interface EquityCurveChartProps {
  data: { date: string; cumulativePnl: number; dailyPnl: number }[];
  loading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const { cumulativePnl, dailyPnl } = payload[0].payload;
  return (
    <div className="bg-white dark:bg-background rounded-lg shadow-lg p-4 border border-gray-200 dark:border-slate-700 min-w-[180px]">
      <div className="font-semibold text-sm mb-1">{label}</div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <span>Cumulative P&amp;L:</span>
          <span className={cumulativePnl >= 0 ? "text-green-600" : "text-red-500"}>${cumulativePnl.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Daily P&amp;L:</span>
          <span className={dailyPnl >= 0 ? "text-green-600" : "text-red-500"}>${dailyPnl.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export function EquityCurveChart({ data, loading }: EquityCurveChartProps) {
  const { theme } = useTheme();
  const profitColor = "#22c55e"; // green-500
  const lossColor = "#ef4444"; // red-500
  const gridColor = theme === "dark" ? "#334155" : "#e5e7eb";

  // Determine if the curve is overall positive or negative for line color
  const lineColor = useMemo(() => {
    if (!data || data.length === 0) return profitColor;
    return data[data.length - 1].cumulativePnl >= 0 ? profitColor : lossColor;
  }, [data]);

  return (
    <Card className="w-full h-[300px] md:h-[400px] lg:h-[500px]">
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        {loading ? (
          <Skeleton className="w-full h-full rounded" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pnl-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={profitColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={profitColor} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="drawdown-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lossColor} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={lossColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#64748b" }}
                minTickGap={20}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#e5e7eb", fillOpacity: 0.2 }} />
              <ReferenceLine y={0} stroke={gridColor} strokeDasharray="2 2" />
              {/* Area fill for profit/drawdown */}
              <Area
                type="monotone"
                dataKey="cumulativePnl"
                stroke={undefined}
                fill="url(#pnl-gradient)"
                isAnimationActive={false}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="cumulativePnl"
                stroke={lineColor}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(" ");
}

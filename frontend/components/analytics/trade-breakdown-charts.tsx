"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import * as React from "react";

interface DistributionBin {
  range: string;
  count: number;
}

interface TradeBreakdownChartsProps {
  rrDistribution: DistributionBin[];
  maeDistribution: DistributionBin[];
  mfeDistribution: DistributionBin[];
  loading?: boolean;
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const { range, count } = payload[0].payload;
  return (
    <div className="bg-white dark:bg-background rounded-lg shadow-lg p-4 border border-gray-200 dark:border-slate-700 min-w-[140px]">
      <div className="font-semibold text-sm mb-1">{label}</div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <span>Range:</span>
          <span>{range}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Count:</span>
          <span>{count}</span>
        </div>
      </div>
    </div>
  );
}

const barColors = ["#22c55e", "#3b82f6", "#f59e42", "#ef4444", "#a21caf", "#eab308", "#0ea5e9"];

export function TradeBreakdownCharts({ rrDistribution, maeDistribution, mfeDistribution, loading }: TradeBreakdownChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
      {/* R:R Distribution */}
      <Card className="p-6 shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle>R:R Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] md:h-[300px]">
          {loading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rrDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#e5e7eb", fillOpacity: 0.2 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {rrDistribution.map((_, idx) => (
                    <Cell key={idx} fill={barColors[idx % barColors.length]} className="transition-all duration-150 hover:scale-105 hover:stroke-2 hover:stroke-primary" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      {/* MAE Distribution */}
      <Card className="p-6 shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle>MAE Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] md:h-[300px]">
          {loading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maeDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#e5e7eb", fillOpacity: 0.2 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {maeDistribution.map((_, idx) => (
                    <Cell key={idx} fill={barColors[(idx + 2) % barColors.length]} className="transition-all duration-150 hover:scale-105 hover:stroke-2 hover:stroke-primary" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      {/* MFE Distribution */}
      <Card className="p-6 shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle>MFE Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] md:h-[300px]">
          {loading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mfeDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#e5e7eb", fillOpacity: 0.2 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {mfeDistribution.map((_, idx) => (
                    <Cell key={idx} fill={barColors[(idx + 4) % barColors.length]} className="transition-all duration-150 hover:scale-105 hover:stroke-2 hover:stroke-primary" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

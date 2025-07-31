"use client";
import * as React from "react";
import { Tooltip as RechartsTooltip } from "recharts";

export function ChartContainer({ children, className = "", config }: { children: React.ReactNode; className?: string; config?: any }) {
  return <div className={`w-full ${className}`}>{children}</div>;
}

export function ChartTooltip({ content, ...props }: any) {
  return <RechartsTooltip {...props} content={content} />;
}

export function ChartTooltipContent({ active, payload, label, hideLabel = false, labelFormatter, indicator }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      {!hideLabel && (
        <div className="mb-1 font-medium">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          {indicator === "dot" && (
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
          )}
          <span>{entry.name}:</span>
          <span className="font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartLegend({ content }: { content: React.ReactNode }) {
  return <>{content}</>;
}

export function ChartLegendContent() {
  // Placeholder for custom legend content
  return null;
}

export type ChartConfig = Record<string, { label: string; color?: string }>;

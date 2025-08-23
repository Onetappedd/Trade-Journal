"use client";
import React from "react";
import { TradeFilters } from '@/types/trade';

interface Props { 
  filters: TradeFilters; 
}

export function CalendarHeatmap({ filters }: Props) {
  // Plug recharts or hand-draw heat grid here
  return (
    <div className="rounded border bg-background p-4 min-h-[160px] flex flex-col items-center">
      <span className="text-muted-foreground">P&L Calendar Heatmap (placeholder)</span>
    </div>
  );
}

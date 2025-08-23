"use client";
import React from "react";
import { TradeFilters } from '@/types/trade';

interface Props { 
  filters: TradeFilters; 
}

export function EquityCurve({ filters }: Props) {
  // Plug recharts LineChart and toggles here
  return (
    <div className="rounded border bg-background p-4 min-h-[200px] flex flex-col items-center">
      <span className="text-muted-foreground">Equity Curve (placeholder)</span>
    </div>
  );
}

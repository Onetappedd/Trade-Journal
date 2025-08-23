"use client";
import React from "react";
import { TradeFilters } from '@/types/trade';

interface Props { 
  filters: TradeFilters; 
}

export function SummaryHeader({ filters }: Props) {
  // KPIs will be displayed here (WinRate, ProfitFactor, AvgWin, AvgLoss, Expectancy, Sharpe)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 py-4">
      {/* Map over stat defs later */}
      {["Win Rate","Profit Factor","Avg Win","Avg Loss","Expectancy","Sharpe"].map(stat => (
        <div className="bg-muted rounded p-4 h-[72px] flex items-center justify-center" key={stat}>{stat}</div>
      ))}
    </div>
  );
}

"use client";
import React from "react";
import { TradeFilters, FiltersSetter } from '@/types/trade';
import { cn } from '@/lib/utils';

export interface FiltersBarProps {
  filters: TradeFilters;
  onChange: FiltersSetter | ((next: TradeFilters) => void);
  small?: boolean;
  className?: string;
}

export function FiltersBar({ filters, onChange, small = false, className }: FiltersBarProps) {
  // Helper to invoke onChange whether it's a setter or a simple function
  const apply = (next: TradeFilters | ((prev: TradeFilters) => TradeFilters)) => {
    // If it's a React state setter
    if (typeof onChange === 'function' && (onChange as any).length !== undefined) {
      try { (onChange as FiltersSetter)(next as any); return; } catch {}
    }
    // If it's a plain function expecting the next object
    const nextValue = typeof next === 'function' ? (next as any)(filters) : next;
    (onChange as (n: TradeFilters) => void)(nextValue);
  };

  // Scaffolding only: build out filter fields, datepickers, tag selects, etc. later
  return (
    <div className={cn(
      'flex flex-col md:flex-row gap-4 md:items-end mb-4',
      small ? 'gap-2 md:gap-3' : undefined,
      className
    )}>
      {/* TODO: Search input, asset type, side, date range, strategy, tags, save view, results */}
      <div className="flex-1">[Filters coming soon]</div>
    </div>
  );
}

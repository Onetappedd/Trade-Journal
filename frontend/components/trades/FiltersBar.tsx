"use client";
import React from "react";

export function FiltersBar({ filters, onChange }: {
  filters: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}) {
  // Scaffolding only: build out filter fields, datepickers, tag selects, etc. later
  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-end mb-4">
      {/* TODO: Search input, asset type, side, date range, strategy, tags, save view, results */}
      <div className="flex-1">[Filters coming soon]</div>
    </div>
  );
}

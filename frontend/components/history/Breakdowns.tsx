"use client";
import React from "react";
export function Breakdowns({ filters, onFilter }: { filters: any; onFilter: (next: any) => void }) {
  // Plug recharts pie/bar and top symbols table here
  return (
    <div className="rounded border bg-background p-4 min-h-[200px] flex flex-col items-center">
      <span className="text-muted-foreground">Breakdowns (Asset Type, Strategy, DOW, Hour, Top Symbols)</span>
    </div>
  );
}

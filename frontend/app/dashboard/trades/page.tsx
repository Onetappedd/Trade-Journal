"use client";

import { useState } from "react";
import { FiltersBar } from "@/components/trades/FiltersBar";
import { TradeTable } from "@/components/trades/TradeTable";
import { TradeDetailsDrawer } from "@/components/trades/TradeDetailsDrawer";
import { Trade } from "@/lib/trades";

export default function TradesPage() {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [filters, setFilters] = useState({}); // Controlled via FiltersBar

  return (
    <div className="max-w-7xl mx-auto flex-1 space-y-6 p-4 md:p-8 pt-6">
      <h1 className="text-2xl font-bold mb-4">View Trades</h1>
      <FiltersBar filters={filters} onChange={setFilters} />
      <TradeTable filters={filters} onRowClick={setSelectedTrade} />
      <TradeDetailsDrawer trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { TradesTable } from "@/components/trades/TradesTable";
import { TradesToolbar, TradeFilters } from "@/components/trades/TradesToolbar";
import { TradesSkeleton } from "@/components/trades/TradesSkeleton";
import { TradeDetailsDrawer } from "@/components/trades/TradeDetailsDrawer";
import { useTrades } from "@/hooks/useTrades";
import { Trade } from "@/lib/domain/trades";
import { mapExistingTradeToDomain } from "@/lib/data-mapping";
import { statusOf, calcPnL } from "@/lib/domain/trades";

export default function TradesPage() {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [filters, setFilters] = useState<TradeFilters>({});
  const [page, setPage] = useState(1);

  // Fetch trades using existing hook
  const { data: rawTrades, total, isLoading, error } = useTrades({ ...filters }, { page });

  // Map to domain format and apply calculations
  const trades = useMemo(() => {
    return rawTrades.map(trade => {
      const domainTrade = mapExistingTradeToDomain(trade);
      return {
        ...domainTrade,
        _status: statusOf(domainTrade),
        _pnl: calcPnL(domainTrade),
      };
    });
  }, [rawTrades]);

  // Apply client-side filtering
  const filteredTrades = useMemo(() => {
    let filtered = trades;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(searchLower) ||
        trade.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Asset type filter
    if (filters.assetType && filters.assetType.length > 0) {
      filtered = filtered.filter(trade => 
        filters.assetType!.includes(trade.asset_type)
      );
    }

    // Side filter
    if (filters.side && filters.side.length > 0) {
      filtered = filtered.filter(trade => 
        filters.side!.includes(trade.side)
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(trade => 
        filters.status!.includes(statusOf(trade))
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(trade => 
        trade.opened_at >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(trade => 
        trade.opened_at <= filters.dateTo!
      );
    }

    return filtered;
  }, [trades, filters]);

  const handleFiltersChange = (newFilters: TradeFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Trades</h2>
          <p className="text-muted-foreground">Failed to load trades. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">View Trades</h1>
      </div>
      
      {isLoading ? (
        <TradesSkeleton />
      ) : (
        <>
          <TradesToolbar 
            data={filteredTrades} 
            onFiltersChange={handleFiltersChange} 
          />
          
          <div className="rounded-2xl border bg-card">
            <TradesTable 
              data={filteredTrades} 
              onRowClick={setSelectedTrade} 
            />
          </div>
        </>
      )}
      
      <TradeDetailsDrawer 
        trade={selectedTrade} 
        onClose={() => setSelectedTrade(null)} 
      />
    </div>
  );
}

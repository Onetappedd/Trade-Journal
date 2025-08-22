"use client";

import React from "react";
import { useUserTrades } from "./useUserTrades";

const assetTypes = ["", "stock", "option", "future", "crypto"];
const statusTypes = ["", "open", "closed", "pending"];

type Filters = Partial<{
  asset_type: string;
  status: string;
  symbol: string;
}>;

export default function TradeTable() {
  const [filters, setFilters] = React.useState<Filters>({});
  const { data: trades, error, isLoading, mutate, authLoading } = useUserTrades({ filters });

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSymbolInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, symbol: e.target.value }));
  };

  // example handlers (wire these to your existing UI)
  const handleAfterMutate = async () => {
    try {
      await mutate();
    } catch (e) {
      console.error("mutate failed", e);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse h-10 bg-muted rounded mb-2" />
        <div className="animate-pulse h-10 bg-muted rounded mb-2" />
        <div className="animate-pulse h-10 bg-muted rounded" />
      </div>
    );
  }

  if (error) {
    console.error("[TradeTable] load error", error);
    return (
      <div className="p-4 text-sm text-red-600 border border-red-500/30 bg-red-500/10 rounded">
        Failed to load trades.
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="p-6 text-muted-foreground">
        No trades found.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filter UI */}
      <div className="flex flex-wrap gap-2 p-2 mb-4">
        <select name="asset_type" value={filters.asset_type || ""} onChange={handleFilter} className="border rounded p-1">
          {assetTypes.map((v) => (
            <option key={v} value={v}>
              {v ? v.charAt(0).toUpperCase() + v.slice(1) : "All Types"}
            </option>
          ))}
        </select>
        <select name="status" value={filters.status || ""} onChange={handleFilter} className="border rounded p-1">
          {statusTypes.map((v) => (
            <option key={v} value={v}>
              {v ? v.charAt(0).toUpperCase() + v.slice(1) : "All Statuses"}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="symbol"
          autoComplete="off"
          placeholder="Symbol"
          value={filters.symbol || ""}
          onChange={handleSymbolInput}
          className="border rounded p-1"
        />
        {/* Add reset button if needed */}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">Symbol</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Side</th>
            <th className="text-left p-2">Qty</th>
            <th className="text-left p-2">Entry</th>
            <th className="text-left p-2">Exit</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t: any) => (
            <tr key={t.id} className="border-t">
              <td className="p-2 flex items-center gap-2">
                {t.symbol}
                {t.asset_type && (
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                    {t.asset_type}
                  </span>
                )}
              </td>
              <td className="p-2">{t.asset_type}</td>
              <td className="p-2">{t.side}</td>
              <td className="p-2">{t.quantity}</td>
              <td className="p-2">{t.entry_price}</td>
              <td className="p-2">{t.exit_price ?? "-"}</td>
              <td className="p-2">{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

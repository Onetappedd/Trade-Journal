"use client";

import React from "react";
import { useUserTrades, Trade } from "./useUserTrades";

export default function TradeTable() {
  const [symbol, setSymbol] = React.useState("");
  const [assetType, setAssetType] = React.useState<string | undefined>();
  const [status, setStatus] = React.useState<string | undefined>();

  const { data: trades, error, isLoading, authLoading } = useUserTrades({
    filters: { symbol: symbol || undefined, instrument_type: assetType as any, status: status as any },
  });

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
    return <div className="p-4 text-sm text-red-600 border border-red-500/30 bg-red-500/10 rounded">Failed to load trades.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          className="px-3 py-2 border rounded bg-background"
          placeholder="Filter symbol…"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <select
          className="px-3 py-2 border rounded bg-background"
          value={assetType ?? ""}
          onChange={(e) => setAssetType(e.target.value || undefined)}
        >
          <option value="">All assets</option>
          <option value="stock">Stock</option>
          <option value="option">Option</option>
          <option value="future">Future</option>
          <option value="crypto">Crypto</option>
        </select>
        <select
          className="px-3 py-2 border rounded bg-background"
          value={status ?? ""}
          onChange={(e) => setStatus(e.target.value || undefined)}
        >
          <option value="">All status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {(!trades || trades.length === 0) ? (
        <div className="p-6 text-muted-foreground">No trades match your filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Symbol</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Side</th>
                <th className="text-left p-2">Qty</th>
                <th className="text-left p-2">Entry</th>
                <th className="text-left p-2">Exit</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Entry Date</th>
                <th className="text-left p-2">Exit Date</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t: Trade) => (
                <tr key={t.id} className="border-b hover:bg-muted/40">
                  <td className="p-2">{t.symbol}</td>
                  <td className="p-2 capitalize">{t.asset_type}</td>
                  <td className="p-2 capitalize">{t.side}</td>
                  <td className="p-2">{t.quantity}</td>
                  <td className="p-2">{t.entry_price}</td>
                  <td className="p-2">{t.exit_price ?? "-"}</td>
                  <td className="p-2 capitalize">{t.status}</td>
                  <td className="p-2">{t.entry_date ? new Date(t.entry_date).toLocaleDateString() : "-"}</td>
                  <td className="p-2">{t.exit_date ? new Date(t.exit_date).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

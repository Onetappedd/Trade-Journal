"use client";

import React, { useMemo } from "react";
import { useUserTrades } from "./useUserTrades";

export default function TradeStats() {
  const { data: trades, error, isLoading, authLoading } = useUserTrades();

  if (authLoading || isLoading) {
    return <div className="p-4">Loading stats…</div>;
  }

  if (error) {
    console.error("[TradeStats] load error", error);
    return <div className="p-4 text-red-600">Failed to load stats.</div>;
  }

  const totals = useMemo(() => {
    if (!trades?.length) return { count: 0, wins: 0, losses: 0, pnl: 0 };
    let wins = 0, losses = 0, pnl = 0;
    for (const t of trades) {
      const entry = Number(t.entry_price ?? 0) * Number(t.quantity ?? 0);
      const exit = Number(t.exit_price ?? 0) * Number(t.quantity ?? 0);
      const tradePnl = (t.status === "closed") ? (exit - entry) : 0;
      pnl += tradePnl;
      if (tradePnl > 0) wins++; else if (tradePnl < 0) losses++;
    }
    return { count: trades.length, wins, losses, pnl };
  }, [trades]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded border">Trades: {totals.count}</div>
      <div className="p-4 rounded border">PnL: {totals.pnl.toFixed(2)}</div>
      <div className="p-4 rounded border">Wins: {totals.wins}</div>
      <div className="p-4 rounded border">Losses: {totals.losses}</div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { DataTable } from "@/components/trades/DataTable";
// Adjust or change the Trade type if your table expects something else

type Trade = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  pnl?: number;
  fees?: number;
  assetClass?: "STOCK" | "OPTIONS" | "FUTURES" | "CRYPTO";
  executedAt: string;
  // ...other fields used by the table/UI
};

export default function TradesPage() {
  const [items, setItems] = useState<Trade[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trades?limit=100`, { cache: "no-store" });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg?.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setItems(data.items ?? []);
      } catch (e: any) {
        console.error("[trades page] load error", e);
        toast.error(`Failed to load trades: ${e.message ?? "Unknown error"}`);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-4">
      {loading
        ? "Loading\u2026"
        : items && items.length
        ? <DataTable data={items} isLoading={false} />
        : "No trades found"}
    </div>
  );
}

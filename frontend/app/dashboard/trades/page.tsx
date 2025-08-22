"use client";
import { useEffect, useState, useMemo } from "react";
import { toast } from "@/components/ui/sonner";

type Trade = {
  id: string;
  symbol: string;
  assetType: "stock" | "option" | "future" | "crypto";
  side: "buy" | "sell";
  quantity: number;
  price: number;
  executedAt: string;
};

export default function TradesPage() {
  const [rows, setRows] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", "100");
    if (cursor) p.set("cursor", cursor);
    return p;
  }, [cursor]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades?${params.toString()}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      setRows((prev) => (cursor ? [...prev, ...body.items] : body.items));
      setCursor(body.nextCursor ?? null);
    } catch (e: any) {
      console.error("[trades page] load error", e);
      setError(e?.message || "Failed to load trades");
      toast.error(e?.message || "Failed to load trades");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  return (
    <div className="space-y-4">
      {/* header + filters */}
      {error ? (
        <div className="text-sm text-red-500">Failed to load trades.</div>
      ) : null}
      {/* your table using rows */}
      {!loading && !rows.length && !error ? (
        <div className="text-sm text-muted-foreground">No trades yet.</div>
      ) : null}
      {/* load more button if cursor */}
      {cursor && (
        <button onClick={() => load()} className="btn">Load More</button>
      )}
    </div>
  );
}

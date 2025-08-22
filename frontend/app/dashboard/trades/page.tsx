"use client";
import { useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { toast } from "@/components/ui/sonner";
import { DataTable } from "@/components/trades/DataTable";
import type { Trade } from "@/lib/server/trades";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
};

export default function TradesPage() {
  const getKey = (pageIndex: number, prev: any) => {
    if (prev && prev.nextCursor === null) return null; // reached end
    const cursor = pageIndex === 0 ? "" : (prev?.nextCursor ?? "");
    const limit = 100;
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    if (cursor) qs.set("cursor", cursor);
    return `/api/trades?${qs.toString()}`;
  };

  const { data, error, size, setSize, isLoading } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const items: Trade[] =
    data?.flatMap((d: any) => Array.isArray(d?.items) ? d.items : []) ?? [];

  useEffect(() => {
    if (error) toast.error("Failed to load trades");
  }, [error]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Trades</h1>
      <DataTable
        data={items}
        onLoadMore={() => setSize(size + 1)}
        isLoading={isLoading}
        hasMore={data?.[data.length - 1]?.nextCursor ?? null}
      />
    </div>
  );
}

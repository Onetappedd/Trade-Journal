"use client";

import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  side: "long" | "short" | "buy" | "sell";
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  status: "open" | "closed" | "partial";
  asset_type: "stock" | "option" | "future" | "crypto";
  entry_date: string | null;
  exit_date: string | null;
  [k: string]: any;
};

type Filters = Partial<{
  asset_type: Trade["asset_type"];
  status: Trade["status"];
  symbol: string;
}>;

export function useUserTrades(opts?: { filters?: Filters; refreshInterval?: number }) {
  const { user, loading: authLoading } = useAuth();
  const filters = opts?.filters ?? {};
  const key = !authLoading && user ? ["user-trades", user.id, JSON.stringify(filters)] : null;

  const fetcher = async (_: string, userId: string, filtersJson: string) => {
    const supabase = createClient();
    const f: Filters = JSON.parse(filtersJson);
    let q = supabase.from("trades").select("*").eq("user_id", userId).order("entry_date", { ascending: false });

    if (f.asset_type) q = q.eq("asset_type", f.asset_type);
    if (f.status) q = q.eq("status", f.status);
    if (f.symbol) q = q.ilike("symbol", `%${f.symbol}%`);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Trade[];
  };

  const swr = useSWR(key, fetcher, {
    refreshInterval: opts?.refreshInterval ?? 0,
    revalidateOnFocus: true,
  });

  return { ...swr, authLoading };
}

"use client";

import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  instrument_type: string;
  qty_opened: number;
  qty_closed: number | null;
  avg_open_price: number;
  avg_close_price: number | null;
  opened_at: string;
  closed_at: string | null;
  status: string;
  fees: number | null;
  realized_pnl: number | null;
  created_at: string | null;
  updated_at: string | null;
  group_key: string;
  ingestion_run_id: string | null;
  row_hash: string | null;
  legs: any | null;
  [k: string]: any;
};

type Filters = Partial<{
  instrument_type: Trade["instrument_type"];
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
    let q = supabase.from("trades").select("*").eq("user_id", userId).order("opened_at", { ascending: false });

    if (f.instrument_type) q = q.eq("instrument_type", f.instrument_type);
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

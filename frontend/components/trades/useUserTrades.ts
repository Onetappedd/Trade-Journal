"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

type Filters = Partial<{
  asset_type: string;
  status: string;
  symbol: string;
}>;

export function useUserTrades(opts?: { refreshInterval?: number; filters?: Filters }) {
  const { user, loading: authLoading } = useAuth();

  const key = !authLoading && user ? ["user-trades", user.id, opts?.filters ?? {}] : null;

  const fetcher = async (_key: string, userId: string, filters: Filters) => {
    const supabase = createClient();
    let q = supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false });

    if (filters?.asset_type) q = q.eq("asset_type", filters.asset_type);
    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.symbol) q = q.ilike("symbol", `%${filters.symbol}%`);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  };

  const swr = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: opts?.refreshInterval ?? 0,
  });

  return { ...swr, authLoading };
}

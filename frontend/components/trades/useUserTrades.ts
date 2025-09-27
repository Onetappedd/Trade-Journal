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
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No session found');
    }

    const f: Filters = JSON.parse(filtersJson);
    
    // Build query parameters
    const params = new URLSearchParams();
    if (f.instrument_type) params.set('asset', f.instrument_type);
    if (f.symbol) params.set('symbol', f.symbol);
    params.set('limit', '100'); // Add pagination limit
    params.set('offset', '0');

    const response = await fetch(`/api/trades?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trades: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  };

  const swr = useSWR(key, fetcher, {
    refreshInterval: opts?.refreshInterval ?? 0,
    revalidateOnFocus: true,
  });

  return { ...swr, authLoading };
}

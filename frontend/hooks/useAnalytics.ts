// frontend/hooks/useAnalytics.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function useUserMetrics() {
  return useQuery({
    queryKey: ['analytics','metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_metrics');
      if (error) throw error;
      // returns single row or null
      return Array.isArray(data) ? data[0] : data;
    },
    refetchOnWindowFocus: false,
  });
}

export function useMonthlyPnl() {
  return useQuery({
    queryKey: ['analytics','monthlyPnl'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_monthly_pnl');
      if (error) throw error;
      return data as Array<{ month: string; pnl: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function useDrawdownSeries() {
  return useQuery({
    queryKey: ['analytics','drawdownSeries'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_drawdown_series');
      if (error) throw error;
      return data as Array<{ t: string; equity: number; drawdown: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function useEquityCurve() {
  // If you already expose get_equity_curve RPC, keep this hook too
  return useQuery({
    queryKey: ['analytics','equityCurve'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_equity_curve');
      if (error) throw error;
      return data as Array<{ day: string; equity: number; drawdown: number; daily_return: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

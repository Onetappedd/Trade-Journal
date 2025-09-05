// frontend/hooks/useAnalytics.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Define the type for user metrics
export interface UserMetrics {
  win_rate: number | null;
  profit_factor: number | null;
  expectancy: number | null;
  max_drawdown_abs: number | null;
  sharpe: number | null;
}

export function useUserMetrics() {
  return useQuery({
    queryKey: ['analytics','metrics'],
    queryFn: async (): Promise<UserMetrics | null> => {
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

// C6: Tag-level P&L aggregates
export function usePnlByTag() {
  return useQuery({
    queryKey: ['analytics', 'pnlByTag'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pnl_by_tag');
      if (error) throw error;
      return data as Array<{ tag: string; trades: number; pnl: number; win_rate: number; profit_factor: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

// C6: Symbol-level P&L aggregates
export function usePnlBySymbol(limit: number = 20) {
  return useQuery({
    queryKey: ['analytics', 'pnlBySymbol', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pnl_by_symbol');
      if (error) throw error;
      // Apply limit on the client side if the RPC doesn't support it
      const results = data as Array<{ symbol: string; trades: number; pnl: number; win_rate: number; profit_factor: number; avg_trade_size: number }>;
      return results.slice(0, limit);
    },
    refetchOnWindowFocus: false,
  });
}

// C7: Expectancy by bucket (R-multiple)
export function useExpectancyByBucket() {
  return useQuery({
    queryKey: ['analytics', 'expectancyByBucket'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_expectancy_by_bucket');
      if (error) throw error;
      return data as Array<{ bucket: string; trades: number; avg_r_multiple: number; expectancy: number; win_rate: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

// C8: Daily P&L for calendar heatmap
export function useDailyPnl(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'dailyPnl', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_pnl');
      if (error) throw error;
      // Apply date filtering on the client side if the RPC doesn't support it
      const results = data as Array<{ day: string; pnl: number; trades: number }>;
      if (startDate || endDate) {
        return results.filter(item => {
          const itemDate = new Date(item.day);
          if (startDate && itemDate < new Date(startDate)) return false;
          if (endDate && itemDate > new Date(endDate)) return false;
          return true;
        });
      }
      return results;
    },
    refetchOnWindowFocus: false,
  });
}

// C9: Drawdown recovery analysis
export function useDrawdownRecovery() {
  return useQuery({
    queryKey: ['analytics', 'drawdownRecovery'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_drawdown_recovery');
      if (error) throw error;
      return data as Array<{ start_date: string; trough_date: string; recovered_on: string; duration_days: number; depth: number; peak_value: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

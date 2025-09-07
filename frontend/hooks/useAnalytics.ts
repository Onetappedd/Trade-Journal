"use client";

import { useQuery } from '@tanstack/react-query';

// TODO: This file needs to be updated to work with the new database schema
// All RPC functions are currently missing from the database

export interface UserMetrics {
  total_trades: number | null;
  win_rate: number | null;
  profit_factor: number | null;
  avg_win: number | null;
  avg_loss: number | null;
  largest_win: number | null;
  largest_loss: number | null;
  max_drawdown_abs: number | null;
  sharpe: number | null;
}

export function useUserMetrics() {
  return useQuery({
    queryKey: ['analytics','metrics'],
    queryFn: async (): Promise<UserMetrics | null> => {
      // TODO: Implement get_user_metrics function in database
      return null;
    },
    refetchOnWindowFocus: false,
  });
}

export function useMonthlyPnl() {
  return useQuery({
    queryKey: ['analytics','monthlyPnl'],
    queryFn: async () => {
      // TODO: Implement get_monthly_pnl function in database
      return [] as Array<{ month: string; pnl: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function useDrawdownSeries() {
  return useQuery({
    queryKey: ['analytics','drawdownSeries'],
    queryFn: async () => {
      // TODO: Implement get_drawdown_series function in database
      return [] as Array<{ t: string; equity: number; drawdown: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function useEquityCurve() {
  return useQuery({
    queryKey: ['analytics','equityCurve'],
    queryFn: async () => {
      // TODO: Implement get_equity_curve function in database
      return [] as Array<{ day: string; equity: number; drawdown: number; daily_return: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function usePnlByTag() {
  return useQuery({
    queryKey: ['analytics', 'pnlByTag'],
    queryFn: async () => {
      // TODO: Implement get_pnl_by_tag function in database
      return [] as Array<{ tag: string; trades: number; pnl: number; win_rate: number; profit_factor: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function usePnlBySymbol(limit?: number) {
  return useQuery({
    queryKey: ['analytics', 'pnlBySymbol', limit],
    queryFn: async () => {
      // TODO: Implement get_pnl_by_symbol function in database
      return [] as Array<{ symbol: string; trades: number; pnl: number; win_rate: number; profit_factor: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function useExpectancyByBucket() {
  return useQuery({
    queryKey: ['analytics', 'expectancyByBucket'],
    queryFn: async () => {
      // TODO: Implement get_expectancy_by_bucket function in database
      return [] as Array<{ bucket: string; trades: number; avg_r_multiple: number; expectancy: number; win_rate: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function useDailyPnl(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'dailyPnl', startDate, endDate],
    queryFn: async () => {
      // TODO: Implement get_daily_pnl function in database
      return [] as Array<{ date: string; pnl: number; cumulative_pnl: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

export function useDrawdownRecovery() {
  return useQuery({
    queryKey: ['analytics', 'drawdownRecovery'],
    queryFn: async () => {
      // TODO: Implement get_drawdown_recovery function in database
      return [] as Array<{ start_date: string; trough_date: string; recovered_on: string; duration_days: number; depth: number; peak_value: number }>;
    },
    refetchOnWindowFocus: false,
  });
}

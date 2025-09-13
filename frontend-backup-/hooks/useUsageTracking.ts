import { useQuery } from '@tanstack/react-query';
import { getUserUsageSummary, getUserUsagePeriod } from '@/lib/usage-tracking';

export interface UsageSummary {
  kind: string;
  count: number;
  last_used: string;
}

export interface UsagePeriod {
  kind: string;
  count: number;
  total_cost_estimate: number;
}

/**
 * Hook to get current month usage summary
 */
export function useUsageSummary() {
  return useQuery({
    queryKey: ['usage-summary'],
    queryFn: getUserUsageSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get usage for a specific period
 */
export function useUsagePeriod(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['usage-period', startDate, endDate],
    queryFn: () => getUserUsagePeriod(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Hook to get current month usage with cost estimates
 */
export function useCurrentMonthUsage() {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = endOfMonth.toISOString().split('T')[0];
  
  return useUsagePeriod(startDate, endDate);
}

/**
 * Hook to get last 3 months usage for trend analysis
 */
export function useLastThreeMonthsUsage() {
  const currentDate = new Date();
  const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
  
  const startDate = threeMonthsAgo.toISOString().split('T')[0];
  const endDate = currentDate.toISOString().split('T')[0];
  
  return useUsagePeriod(startDate, endDate);
}

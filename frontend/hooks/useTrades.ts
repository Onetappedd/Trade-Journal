import useSWR from 'swr';
import qs from 'query-string';
import type { TradeListParams, TradeListResult } from '@/lib/trades';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch trades.');
  return res.json();
});

export function useTrades(params: Omit<TradeListParams, 'userId'>, {
  page = 1,
  pageSize = 50,
  enabled = true,
} = {}) {
  const query = {
    ...params,
    page,
    pageSize
  };
  const url = '/api/trades?' + qs.stringify(query, { arrayFormat: 'comma' });
  const { data, error, isLoading, mutate } = useSWR<TradeListResult>(enabled ? url : null, fetcher, { revalidateOnFocus: true });
  return {
    data: data?.rows || [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    isLoading,
    error,
    mutate, // for refetch
  };
}

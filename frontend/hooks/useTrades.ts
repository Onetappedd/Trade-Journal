import useSWR from 'swr';
import type { TradeListParams, TradeListResult } from '@/lib/trades';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch trades.');
  return res.json();
});

function toQuery(params: Record<string, any>) {
  const qp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      v.forEach((val) => qp.append(k, val));
    } else if (v != null && v !== "") {
      qp.set(k, String(v));
    }
  }
  return qp.toString();
}

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
  const url = '/api/trades?' + toQuery(query);
  const { data, error, isLoading, mutate } = useSWR<TradeListResult>(enabled ? url : null, fetcher, { revalidateOnFocus: true });
  return {
    data: data?.rows || [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    isLoading,
    error,
    mutate,
  };
}

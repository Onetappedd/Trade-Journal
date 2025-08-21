import useSWR from 'swr';
import { TrendingPayloadSchema, TrendingRow } from './market-schemas';

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
  } finally {
    clearTimeout(t);
  }
}

export async function getTrendingRows(): Promise<TrendingRow[]> {
  try {
    const res = await fetchWithTimeout('/api/market/trending');
    const json = res.ok
      ? await res.json()
      : await (await fetchWithTimeout('/api/market/trending-hybrid')).json();
    const parsed = TrendingPayloadSchema.safeParse(json);
    if (!parsed.success) return [];
    if (!parsed.data.ok) return [];
    return Array.isArray(parsed.data.data) ? parsed.data.data : [];
  } catch {
    return [];
  }
}

export function useTrendingTickers() {
  const { data, error, isLoading, mutate } = useSWR('trending-rows', getTrendingRows, {
    fallbackData: [],
    revalidateOnFocus: true,
  });
  const rows = Array.isArray(data) ? data : [];
  return { rows, error, isLoading, refresh: mutate };
}

import useSWR from 'swr';
import { TrendingRow, parseTrendingPayload } from './market-schemas';

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
    if (!res.ok) {
      // try backup route if present
      const res2 = await fetchWithTimeout('/api/market/trending-hybrid');
      const json2 = await res2.json().catch(() => ({}));
      return parseTrendingPayload(json2);
    }
    const json = await res.json().catch(() => ({}));
    return parseTrendingPayload(json);
  } catch {
    return [];
  }
}

export function useTrendingTickers() {
  const { data, error, isLoading, mutate } = useSWR<TrendingRow[]>(
    'trending-rows',
    getTrendingRows,
    { fallbackData: [] }
  );
  const rows: TrendingRow[] = Array.isArray(data) ? data : [];
  return { rows, error, isLoading, refresh: mutate };
}

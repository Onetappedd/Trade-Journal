import { AnalyticsFilters } from './analytics-contracts';

export async function callAnalytics<T = any>(
  path: string,
  payload: any,
  opts?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/analytics/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    ...opts,
  });
  if (res.status === 401) {
    // Optionally trigger session refresh logic here
    throw new Error('Session expired');
  }
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

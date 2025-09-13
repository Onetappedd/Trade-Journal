import { getSupabaseBrowserClient } from './supabase-browser';

export class UnauthenticatedError extends Error {
  constructor() {
    super('User is not authenticated');
    this.name = 'UnauthenticatedError';
  }
}

export async function invokeEdge(path: string, body: unknown) {
  const supabase = getSupabaseBrowserClient();
  const start = Date.now();
  let status = 0;
  let res, data;
  let session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new UnauthenticatedError();
  try {
    res = await supabase.functions.invoke(path, { body: body as any });
    status = res.error ? 400 : 200;
    data = res.data;
    if (status === 401) {
      await supabase.auth.refreshSession();
      session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new UnauthenticatedError();
      res = await supabase.functions.invoke(path, { body: body as any });
      status = res.error ? 400 : 200;
      data = res.data;
    }
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[invokeEdge]`, path, 'status:', status, 'duration:', Date.now() - start, 'ms');
    }
    if (status >= 400)
      throw new Error(data?.message || res.error?.message || 'Edge function error');
    return data;
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[invokeEdge]`, path, 'status:', status, 'error:', err);
    }
    throw Object.assign(new Error(err?.message || 'Edge function error'), { status });
  }
}

export const analyticsEquityCurve = (payload: any) =>
  invokeEdge('super-function/analytics/equity-curve', payload);
export const analyticsMonthlyPnl = (payload: any) =>
  invokeEdge('super-function/analytics/monthly-pnl', payload);
export const analyticsCards = (payload: any) =>
  invokeEdge('super-function/analytics/cards', payload);
export const analyticsCosts = (payload: any) =>
  invokeEdge('super-function/analytics/costs', payload);
export const analyticsTrades = (payload: any) =>
  invokeEdge('super-function/analytics/trades', payload);

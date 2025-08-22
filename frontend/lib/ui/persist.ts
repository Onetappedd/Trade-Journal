import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored != null) return JSON.parse(stored) as T;
    } catch {}
    return initial;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  const reset = useCallback(() => setState(initial), [initial]);
  return [state, setState, reset] as [T, typeof setState, typeof reset];
}

// Keeps a filter state (object) in sync with URL query params (Next.js/app router style)
export function useSyncedQueryParams<T extends object>(defaults: T): [T, (s: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<T>(() => {
    const params: Record<string, any> = {};
    if (typeof window === 'undefined' || !searchParams) return defaults;
    for (const [key, value] of (searchParams as any).entries()) {
      params[key] = value;
    }
    return { ...defaults, ...params };
  });
  useEffect(() => {
    if (!searchParams) return;
    const params: Record<string, any> = {};
    for (const [key, value] of (searchParams as any).entries()) {
      params[key] = value;
    }
    setState((prev) => ({ ...prev, ...params }));
  }, [searchParams]);
  const setAndPush = (next: T) => {
    setState(next);
    const qp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v != null && v !== "") qp.set(k, String(v));
    });
    router.replace("?" + qp.toString(), { scroll: false });
  };
  return [state, setAndPush];
}

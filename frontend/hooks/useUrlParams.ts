'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export function useUrlParams() {
  const searchParams = useSearchParams();
  
  return useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    return {
      get: (key: string) => params.get(key),
      getAll: (key: string) => params.getAll(key),
      has: (key: string) => params.has(key),
      toString: () => params.toString(),
    };
  }, [searchParams]);
}

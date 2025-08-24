'use client';

import { useMemo } from 'react';
import type { Trade } from '@/lib/domain/pnl';
import { buildCumulativeSeries, type PnlPoint } from '@/lib/domain/pnl';

export type RangeKey = '1D'|'1W'|'1M'|'3M'|'YTD'|'1Y'|'ALL';

export function usePnlSeries(
  trades: Trade[], 
  range: RangeKey='ALL', 
  mode: 'total'|'realized'='total'
) {
  const all = useMemo(() => buildCumulativeSeries(trades, mode), [trades, mode]);
  
  const filtered: PnlPoint[] = useMemo(() => {
    if (!all.length) return all;
    
    const end = all[all.length-1].t;
    const start = (() => {
      const d = new Date(end);
      switch(range){
        case '1D': 
          d.setDate(d.getDate()-1); 
          return d;
        case '1W': 
          d.setDate(d.getDate()-7); 
          return d;
        case '1M': 
          d.setMonth(d.getMonth()-1); 
          return d;
        case '3M': 
          d.setMonth(d.getMonth()-3); 
          return d;
        case 'YTD': 
          return new Date(end.getFullYear(),0,1);
        case '1Y': 
          d.setFullYear(d.getFullYear()-1); 
          return d;
        default: 
          return new Date(0);
      }
    })();
    
    return all.filter(p => p.t >= start);
  }, [all, range]);
  
  return filtered;
}

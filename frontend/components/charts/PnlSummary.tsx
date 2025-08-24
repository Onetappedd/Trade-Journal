'use client';

import type { Trade } from '@/lib/domain/pnl';
import { tradePnl } from '@/lib/domain/pnl';

interface PnlSummaryProps {
  trades: Trade[];
  className?: string;
}

export function PnlSummary({ trades, className = '' }: PnlSummaryProps) {
  let realized = 0, unrealized = 0;
  
  for (const t of trades) {
    const p = tradePnl(t);
    realized += p.realized;
    unrealized += p.unrealized;
  }
  
  const total = realized + unrealized;
  
  const usd = (n: number) => n.toLocaleString('en-US', {
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 2
  });
  
  const getColorClass = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <div className="rounded-2xl border p-3 bg-card">
        <div className="text-xs text-muted-foreground">Total P&L</div>
        <div className={`text-lg font-semibold tabular-nums ${getColorClass(total)}`}>
          {usd(total)}
        </div>
      </div>
      <div className="rounded-2xl border p-3 bg-card">
        <div className="text-xs text-muted-foreground">Realized</div>
        <div className={`text-lg font-semibold tabular-nums ${getColorClass(realized)}`}>
          {usd(realized)}
        </div>
      </div>
      <div className="rounded-2xl border p-3 bg-card">
        <div className="text-xs text-muted-foreground">Unrealized</div>
        <div className={`text-lg font-semibold tabular-nums ${getColorClass(unrealized)}`}>
          {usd(unrealized)}
        </div>
      </div>
    </div>
  );
}

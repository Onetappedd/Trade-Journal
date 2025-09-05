'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserMetrics, type UserMetrics } from '@/hooks/useAnalytics';

function MetricsStrip() {
  const { data, isLoading } = useUserMetrics();
  
  const Metric = ({ label, value }: { label: string; value: string }) => (
    <Card className="p-4 flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold">
        {isLoading ? <Skeleton className="h-6 w-16" /> : (value || '—')}
      </span>
    </Card>
  );
  
  const fmt = (n?: number|null, kind: 'num'|'pct' = 'num') =>
    (n === null || n === undefined || Number.isNaN(n)) ? '' :
    (kind === 'pct' ? `${Number(n).toFixed(1)}%` : Number(n).toFixed(2));

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      <Metric label="Win Rate"       value={fmt(data?.win_rate, 'pct')} />
      <Metric label="Profit Factor"  value={fmt(data?.profit_factor)} />
      <Metric label="Expectancy"     value={fmt(data?.expectancy)} />
      <Metric label="Max Drawdown"   value={fmt(data?.max_drawdown_abs)} />
      <Metric label="Sharpe"         value={fmt(data?.sharpe)} />
    </div>
  );
}

export { MetricsStrip };

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { type PnlSummary } from '@/hooks/usePnlData';

interface PnlSummaryBarProps {
  summary: PnlSummary;
  className?: string;
  showTradeCounts?: boolean;
  variant?: 'dashboard' | 'analytics';
}

export function PnlSummaryBar({ 
  summary, 
  className = '', 
  showTradeCounts = true,
  variant = 'dashboard' 
}: PnlSummaryBarProps) {
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatCurrency(value)}`;
  };

  const getChangeLabel = () => {
    return variant === 'dashboard' ? "Today's Change" : "Latest Change";
  };

  const getTradeCountLabel = () => {
    return variant === 'dashboard' ? "Total Trades" : "Total Trades";
  };

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {/* Total P&L */}
      <div className="text-center">
        <div className="text-2xl font-bold">
          {formatCurrency(summary.totalPnl)}
        </div>
        <div className="text-sm text-muted-foreground">Total P&L</div>
        {showTradeCounts && (
          <div className="text-xs text-muted-foreground mt-1">
            {summary.realizedPnl >= 0 ? '+' : ''}{formatCurrency(summary.realizedPnl)} realized
            {summary.unrealizedPnl !== 0 && (
              <span className="ml-1">
                {summary.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(summary.unrealizedPnl)} unrealized
              </span>
            )}
          </div>
        )}
      </div>

      {/* Change */}
      <div className="text-center">
        <div className={`text-2xl font-bold ${summary.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatChange(summary.change)}
        </div>
        <div className="text-sm text-muted-foreground">{getChangeLabel()}</div>
        {showTradeCounts && (
          <div className="text-xs text-muted-foreground mt-1">
            {summary.closedTrades} closed, {summary.openTrades} open
          </div>
        )}
      </div>

      {/* Trade Count */}
      <div className="text-center">
        <div className="text-2xl font-bold">
          {summary.totalTrades}
        </div>
        <div className="text-sm text-muted-foreground">{getTradeCountLabel()}</div>
        {showTradeCounts && (
          <div className="text-xs text-muted-foreground mt-1">
            {summary.closedTrades} closed • {summary.openTrades} open
          </div>
        )}
      </div>
    </div>
  );
}

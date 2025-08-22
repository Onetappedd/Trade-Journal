'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Trade {
  id: string;
  symbol: string;
  entry_date: string;
  exit_date?: string | null;
  pnl: number;
  asset_type?: string;
  option_type?: string | null;
  strike?: number | null;
  expiration?: string | null;
}

interface TopTradesProps {
  bestTrades: Trade[];
  worstTrades: Trade[];
}

export function TopTrades({ bestTrades, worstTrades }: TopTradesProps) {
  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateDuration = (entry: string, exit?: string | null) => {
    if (!exit) return 'Open';
    const entryDate = new Date(entry);
    const exitDate = new Date(exit);
    const days = Math.round((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  // Use placeholder if no trades
  const displayBestTrades =
    bestTrades.length > 0
      ? bestTrades
      : [{ id: '1', symbol: 'No trades', entry_date: new Date().toISOString(), pnl: 0 }];

  const displayWorstTrades =
    worstTrades.length > 0
      ? worstTrades
      : [{ id: '1', symbol: 'No trades', entry_date: new Date().toISOString(), pnl: 0 }];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Best Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayBestTrades.map((trade, index) => (
              <div key={trade.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                  <div>
                    <div className="font-medium">
                      {trade.symbol}
                      {trade.asset_type === 'option' && trade.strike && trade.expiration && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {trade.option_type?.toUpperCase()} {trade.strike} @{' '}
                          {new Date(trade.expiration).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(trade.entry_date).toLocaleDateString()} •{' '}
                      {calculateDuration(trade.entry_date, trade.exit_date)}
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  {formatCurrency(trade.pnl)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Worst Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayWorstTrades.map((trade, index) => (
              <div key={trade.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                  <div>
                    <div className="font-medium">
                      {trade.symbol}
                      {trade.asset_type === 'option' && trade.strike && trade.expiration && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {trade.option_type?.toUpperCase()} {trade.strike} @{' '}
                          {new Date(trade.expiration).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(trade.entry_date).toLocaleDateString()} •{' '}
                      {calculateDuration(trade.entry_date, trade.exit_date)}
                    </div>
                  </div>
                </div>
                <Badge variant="destructive">{formatCurrency(trade.pnl)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

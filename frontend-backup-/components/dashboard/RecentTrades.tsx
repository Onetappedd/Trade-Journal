'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Trade {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  entry_date: string;
  exit_price?: number | null;
  exit_date?: string | null;
  status?: string;
  pnl: number;
  asset_type?: string;
}

interface RecentTradesProps {
  trades: Trade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  // Show placeholder if no trades
  const displayTrades =
    trades.length > 0
      ? trades
      : [
          {
            id: 'placeholder-1',
            symbol: 'No trades yet',
            side: 'buy',
            quantity: 0,
            entry_price: 0,
            entry_date: new Date().toISOString(),
            status: 'open',
            pnl: 0,
          },
        ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Trades</CardTitle>
        <Link href="/dashboard/trades">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayTrades.map((trade) => {
            const statusNorm = (trade.status || '').toLowerCase();
            const closedByFields =
              Boolean(trade.exit_date) &&
              trade.exit_price !== null &&
              trade.exit_price !== undefined;
            const isClosed = statusNorm === 'closed' || statusNorm === 'expired' || closedByFields;
            const isExpired = statusNorm === 'expired';
            const multiplier = trade.asset_type === 'option' ? 100 : 1;
            let pnlValue = trade.pnl;
            if (isClosed && (!pnlValue || pnlValue === 0)) {
              if (trade.exit_price !== null && trade.exit_price !== undefined) {
                pnlValue =
                  trade.side?.toLowerCase() === 'buy'
                    ? (trade.exit_price - trade.entry_price) * trade.quantity * multiplier
                    : (trade.entry_price - trade.exit_price) * trade.quantity * multiplier;
              }
            }
            const pnlClass = pnlValue >= 0 ? 'text-green-600' : 'text-red-600';
            const dateDisplay = new Date(
              isClosed && trade.exit_date ? trade.exit_date! : trade.entry_date,
            ).toLocaleDateString();

            return (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{trade.symbol}</div>
                    {trade.quantity > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {trade.side.charAt(0).toUpperCase() + trade.side.slice(1)} {trade.quantity}{' '}
                        @ ${trade.entry_price.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`font-medium ${pnlClass}`}>
                      {pnlValue !== 0 && (pnlValue >= 0 ? '+' : '')}
                      {pnlValue !== 0 ? `${Math.abs(pnlValue).toFixed(2)}` : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">{dateDisplay}</div>
                  </div>
                  <Badge
                    variant={isClosed ? (isExpired ? 'destructive' : 'default') : 'destructive'}
                  >
                    {isClosed ? (isExpired ? 'Expired' : 'Closed') : 'Open'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

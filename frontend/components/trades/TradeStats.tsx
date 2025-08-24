'use client';

import * as React from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculatePositions } from '@/lib/position-tracker';

export function TradeStats() {
  const { user } = useAuth();

  const fetcher = async () => {
    if (!user) return null;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const { data: trades, isLoading } = useSWR(
    user ? ['user-trades-stats', user.id] : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
    },
  );

  if (isLoading) return <div>Loading stats...</div>;
  if (!trades || trades.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Trade Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No trades yet.</div>
        </CardContent>
      </Card>
    );
  }

  // Use position tracking to calculate proper P&L
  const { stats, positions, closedTrades } = calculatePositions(trades);

  // Format currency values
  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '' : '-';
    return `${prefix}$${Math.abs(value).toFixed(2)}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Trade Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Trades</p>
            <p className="font-bold text-lg tabular-nums">{stats.totalTrades}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Win Rate</p>
            <p
              className={`font-bold text-lg tabular-nums ${stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}
            >
              {stats.winRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total P&L</p>
            <p
              className={`font-bold text-lg tabular-nums ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(stats.totalPnL)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg P&L</p>
            <p
              className={`font-bold text-lg tabular-nums ${closedTrades.length > 0 && stats.totalPnL / closedTrades.length >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {closedTrades.length > 0
                ? formatCurrency(stats.totalPnL / closedTrades.length)
                : '$0.00'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Best Trade</p>
            <p className="font-bold text-lg text-green-600 tabular-nums">
              {formatCurrency(stats.bestTrade)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Worst Trade</p>
            <p className="font-bold text-lg text-red-600 tabular-nums">
              {formatCurrency(stats.worstTrade)}
            </p>
          </div>
        </div>

        {/* Show open positions if any */}
        {positions.some((p) => p.openQuantity > 0) && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Open Positions</h4>
            <div className="space-y-2">
              {positions
                .filter((p) => p.openQuantity > 0)
                .map((position, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{position.symbol}</span>
                      {position.option_type && (
                        <Badge variant="outline" className="text-xs">
                          {position.option_type.toUpperCase()} ${position.strike_price}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {position.openQuantity} @ ${position.avgEntryPrice.toFixed(2)}
                      </span>
                      {position.closedPnL !== 0 && (
                        <Badge variant={position.closedPnL >= 0 ? 'default' : 'destructive'}>
                          Realized: {formatCurrency(position.closedPnL)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

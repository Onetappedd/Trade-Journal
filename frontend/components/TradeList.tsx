'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  entry_date: string;
  exit_date: string | null;
  asset_type: 'stock' | 'option' | 'crypto' | 'forex';
  strategy: string | null;
  notes: string | null;
  fees: number | null;
  pnl: number | null;
  created_at: string;
}

interface TradeListProps {
  limit?: number;
  showHeader?: boolean;
}

export default function TradeList({ limit, showHeader = true }: TradeListProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePnL = (trade: Trade) => {
    if (!trade.exit_price) return null;
    const pnl =
      trade.side === 'buy'
        ? (trade.exit_price - trade.entry_price) * trade.quantity
        : (trade.entry_price - trade.exit_price) * trade.quantity;
    return pnl - (trade.fees || 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>{showHeader && <CardTitle>Recent Trades</CardTitle>}</CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Your latest trading activity</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {trades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No trades found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => {
                  const pnl = calculatePnL(trade);
                  return (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                          {trade.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.quantity.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(trade.entry_price)}</TableCell>
                      <TableCell>{format(new Date(trade.entry_date), 'MMM dd')}</TableCell>
                      <TableCell>
                        {pnl !== null ? (
                          <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(pnl)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.exit_price ? 'default' : 'secondary'}>
                          {trade.exit_price ? 'Closed' : 'Open'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

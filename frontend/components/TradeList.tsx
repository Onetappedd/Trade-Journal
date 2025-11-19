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
  instrument_type: string;
  qty_opened: number;
  qty_closed: number | null;
  avg_open_price: number;
  avg_close_price: number | null;
  opened_at: string;
  closed_at: string | null;
  status: string;
  fees: number | null;
  realized_pnl: number | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  group_key: string;
  ingestion_run_id: string | null;
  row_hash: string | null;
  legs: any | null;
}

interface TradeListProps {
  limit?: number;
  showHeader?: boolean;
}

export default function TradeList({ limit, showHeader = true }: TradeListProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchTrades();
  }, [limit]);

  const calculatePnL = (trade: Trade) => {
    if (!trade.avg_close_price) return null;
    const pnl = (trade.avg_close_price - trade.avg_open_price) * trade.qty_opened;
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
                        <Badge variant={trade.instrument_type === 'stock' ? 'default' : 'secondary'}>
                          {trade.instrument_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.qty_opened.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(trade.avg_open_price)}</TableCell>
                      <TableCell>{format(new Date(trade.opened_at), 'MMM dd')}</TableCell>
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
                        <Badge variant={trade.status === 'closed' ? 'default' : 'secondary'}>
                          {trade.status === 'closed' ? 'Closed' : 'Open'}
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

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// Database row type for trades
type DbTrade = Database['public']['Tables']['trades']['Row'];

type Trade = {
  id: string;
  date: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  pnl: number;
  holdingPeriod: number;
  taxType: 'SHORT' | 'LONG';
};

type SortField = keyof Trade;
type SortDirection = 'asc' | 'desc';

export function RealizedTradesTable() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    let cancelled = false;

    async function fetchClosedTrades() {
      try {
        setLoading(true);
        setError(null);
        const supabase = createSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          if (!cancelled) {
            setTrades([]);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('trades')
          .select(
            'id, symbol, qty_opened, avg_open_price, avg_close_price, opened_at, closed_at, status, realized_pnl',
          )
          .eq('user_id', user.id)
          .eq('status', 'closed')
          .order('closed_at', { ascending: false });

        if (error) throw error;

        const mapped: Trade[] = (data as DbTrade[]).map((t) => {
          const entryDate = t.opened_at ? new Date(t.opened_at) : null;
          const exitDate = t.closed_at ? new Date(t.closed_at) : null;
          const holdingDays =
            entryDate && exitDate
              ? Math.max(
                  0,
                  Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)),
                )
              : 0;

          // Prefer stored pnl if present; otherwise compute
          const computedPnL =
            t.avg_close_price != null && t.avg_open_price != null && t.qty_opened != null
              ? (t.avg_close_price - t.avg_open_price) * t.qty_opened
              : 0;

          return {
            id: t.id,
            date: t.closed_at || t.opened_at,
            symbol: t.symbol,
            type: 'SELL' as Trade['type'], // All realized trades are sells
            quantity: t.qty_opened,
            price: t.avg_close_price ?? t.avg_open_price ?? 0,
            pnl: t.realized_pnl ?? computedPnL,
            holdingPeriod: holdingDays,
            taxType: holdingDays > 365 ? 'LONG' : 'SHORT',
          };
        });

        if (!cancelled) setTrades(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load realized trades');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchClosedTrades();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTrades = useMemo(() => {
    const rows = [...trades];
    rows.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === 'date') {
        const aTime = new Date(aValue as string).getTime();
        const bTime = new Date(bValue as string).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
    return rows;
  }, [trades, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realized Trades</CardTitle>
        <CardDescription>
          All closed positions with tax implications for the current year
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('date')}
                    className="h-auto p-0 font-semibold"
                  >
                    Date <SortIcon field="date" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('symbol')}
                    className="h-auto p-0 font-semibold"
                  >
                    Symbol <SortIcon field="symbol" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('quantity')}
                    className="h-auto p-0 font-semibold"
                  >
                    Quantity <SortIcon field="quantity" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('price')}
                    className="h-auto p-0 font-semibold"
                  >
                    Price <SortIcon field="price" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('pnl')}
                    className="h-auto p-0 font-semibold"
                  >
                    P&L <SortIcon field="pnl" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('holdingPeriod')}
                    className="h-auto p-0 font-semibold"
                  >
                    Holding Period <SortIcon field="holdingPeriod" />
                  </Button>
                </TableHead>
                <TableHead>Tax Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                    Loading realized trades...
                  </TableCell>
                </TableRow>
              ) : sortedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                    No realized trades yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{trade.quantity}</TableCell>
                    <TableCell className="text-right">${trade.price.toFixed(2)}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      ${Math.abs(trade.pnl).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{trade.holdingPeriod} days</TableCell>
                    <TableCell>
                      <Badge variant={trade.taxType === 'LONG' ? 'default' : 'destructive'}>
                        {trade.taxType}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

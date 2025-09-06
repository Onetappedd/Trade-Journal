'use client';
export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  exit_price?: number;
  pnl: number;
  date: string;
  status: 'open' | 'closed';
  notes?: string;
}

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([
    {
      id: '1',
      symbol: 'AAPL',
      side: 'buy',
      quantity: 100,
      entry_price: 175.5,
      exit_price: 184.0,
      pnl: 850.0,
      date: '2024-01-15',
      status: 'closed',
      notes: 'Strong earnings momentum',
    },
    {
      id: '2',
      symbol: 'TSLA',
      side: 'sell',
      quantity: 50,
      entry_price: 245.3,
      exit_price: 238.9,
      pnl: -320.0,
      date: '2024-01-14',
      status: 'closed',
      notes: 'Cut losses early',
    },
    {
      id: '3',
      symbol: 'NVDA',
      side: 'buy',
      quantity: 25,
      entry_price: 520.75,
      pnl: 0,
      date: '2024-01-13',
      status: 'open',
      notes: 'AI sector play',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');


  const filteredTrades = trades.filter(
    (trade) =>
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteTrade = useCallback(
    (tradeId: string) => {
      setTrades((prev) => prev.filter((trade) => trade.id !== tradeId));
      toast.success('The trade has been successfully removed.');
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
          <p className="text-muted-foreground">View and manage all your trades</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/import/manual">
            <Plus className="mr-2 h-4 w-4" />
            Add Trade
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Trades List */}
      <div className="space-y-4">
        {filteredTrades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No trades found</p>
              <Button asChild>
                <Link href="/dashboard/add-trade">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Trade
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTrades.map((trade) => (
            <Card key={trade.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <CardTitle className="text-xl">{trade.symbol}</CardTitle>
                    <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                      {trade.side.toUpperCase()}
                    </Badge>
                    <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'}>
                      {trade.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteTrade(trade.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {new Date(trade.date).toLocaleDateString()} • {trade.quantity} shares
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entry Price</p>
                    <p className="text-lg font-semibold">${trade.entry_price}</p>
                  </div>
                  {trade.exit_price && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Exit Price</p>
                      <p className="text-lg font-semibold">${trade.exit_price}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">P&L</p>
                    <p
                      className={`text-lg font-semibold ${
                        trade.pnl > 0
                          ? 'text-green-600'
                          : trade.pnl < 0
                            ? 'text-red-600'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {trade.pnl === 0 ? '—' : `$${trade.pnl.toLocaleString()}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                    <p className="text-lg font-semibold">{trade.quantity}</p>
                  </div>
                </div>
                {trade.notes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{trade.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

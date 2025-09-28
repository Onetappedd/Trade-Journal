'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  pnl: number;
  opened_at: string;
  closed_at?: string;
  asset_type: string;
}

export default function TradesClient() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [sideFilter, setSideFilter] = useState<string>('all');

  const supabase = createSupabaseClient();

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }

      const response = await fetch('/api/trades', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
        setFilteredTrades(data.trades || []);
      } else {
        console.error('Failed to fetch trades');
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    let filtered = trades;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply asset filter
    if (assetFilter !== 'all') {
      filtered = filtered.filter(trade => trade.asset_type === assetFilter);
    }

    // Apply side filter
    if (sideFilter !== 'all') {
      filtered = filtered.filter(trade => trade.side === sideFilter);
    }

    setFilteredTrades(filtered);
  }, [trades, searchTerm, assetFilter, sideFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-emerald-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const getSideColor = (side: string) => {
    return side === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
          <p className="text-muted-foreground">
            View and manage your trading history
          </p>
        </div>
        <Button onClick={fetchTrades} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="option">Option</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sideFilter} onValueChange={setSideFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sides</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>
            Showing {filteredTrades.length} of {trades.length} trades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trades found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge className={getSideColor(trade.side)}>
                        {trade.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell>{formatCurrency(trade.price)}</TableCell>
                    <TableCell className={getPnlColor(trade.pnl)}>
                      {formatCurrency(trade.pnl)}
                    </TableCell>
                    <TableCell>{formatDate(trade.opened_at)}</TableCell>
                    <TableCell>
                      {trade.closed_at ? formatDate(trade.closed_at) : 'Open'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


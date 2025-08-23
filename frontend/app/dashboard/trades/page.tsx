'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ASSET_TYPES } from '@/lib/enums';
import { TradeRow, TradesResponse } from '@/types/trade';
import { toast } from 'sonner';

function formatDuration(ms: number) {
  if (ms < 0) ms = 0;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

const normalizeAsset = (asset: string) => {
  const lower = asset.toLowerCase().trim();
  if (lower === 'options') return 'option';
  if (ASSET_TYPES.includes(lower as any)) return lower;
  return 'all';
};

export default function TradesPage() {
  const [rows, setRows] = useState<TradeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState({
    symbol: '',
    asset: 'all',
    from: null as string | null,
    to: null as string | null,
    page: 1,
    limit: 100,
  });

  useEffect(() => {
    fetchTrades();
  }, [q.symbol, q.asset, q.from, q.to, q.page]);

  async function fetchTrades() {
    setLoading(true);
    setError(null);
    try {
      const ps = new URLSearchParams({
        limit: String(q.limit),
        offset: String((q.page - 1) * q.limit),
      });
      if (q.symbol.trim()) ps.set('symbol', q.symbol.trim());
      const normalizedAsset = normalizeAsset(q.asset);
      if (normalizedAsset !== 'all') ps.set('asset', normalizedAsset);
      if (q.from) ps.set('from', q.from);
      if (q.to) ps.set('to', q.to);

      const res = await fetch(`/api/trades?${ps.toString()}`, { cache: 'no-store' });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to load trades');
      }

      const data: TradesResponse = await res.json();
      setRows(data.items);
      setTotal(data.total ?? data.items.length);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load trades', { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const pnlColor = (pnl: number | null) => {
    if (pnl === null || pnl === 0) return '';
    return pnl > 0 ? 'text-green-600' : 'text-red-600';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading trades...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-600">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">Error loading trades</p>
          <p className="text-sm mb-4">{error}</p>
          <Button onClick={fetchTrades}>Retry</Button>
        </div>
      );
    }

    if (total === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No trades yet</p>
          <Link href="/dashboard/add-trade">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Trade
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Entry Price</TableHead>
              <TableHead>Exit Price</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead>Exit Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const duration = formatDuration(
                new Date(row.exit_date ?? Date.now()).getTime() - new Date(row.entry_date).getTime()
              );
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.symbol}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {row.asset_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.side === 'buy' ? 'default' : 'secondary'}>
                      {row.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.quantity.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(row.entry_price)}</TableCell>
                  <TableCell>{formatCurrency(row.exit_price)}</TableCell>
                  <TableCell>{format(new Date(row.entry_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{row.exit_date ? format(new Date(row.exit_date), 'MMM dd, yyyy') : '-'}</TableCell>
                  <TableCell>{duration}</TableCell>
                  <TableCell>{formatCurrency(row.fees)}</TableCell>
                  <TableCell className={pnlColor(row.pnl)}>
                    {formatCurrency(row.pnl ?? 0)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Trade History</h1>
          <p className="text-muted-foreground">Track and analyze your trading performance</p>
        </div>
        <Link href="/dashboard/add-trade">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Trade
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol..."
                  value={q.symbol}
                  onChange={(e) => setQ(prev => ({ ...prev, symbol: e.target.value, page: 1 }))}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={q.asset}
              onValueChange={(value) => setQ(prev => ({ ...prev, asset: value, page: 1 }))}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {ASSET_TYPES.map((asset) => (
                  <SelectItem key={asset} value={asset} className="capitalize">
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* TODO: Add date filters */}
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Trade History</CardTitle>
            <Badge variant="secondary">{total} results</Badge>
          </div>
          <CardDescription>
            {q.asset !== 'all' && `Filtered by asset type: ${q.asset}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

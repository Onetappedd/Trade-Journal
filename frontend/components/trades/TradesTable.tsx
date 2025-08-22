'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data
const trades = [
  {
    id: 1,
    symbol: 'AAPL',
    assetType: 'Stock',
    side: 'Buy',
    quantity: 100,
    entryPrice: 150.25,
    exitPrice: 155.8,
    entryDate: '2024-01-15',
    exitDate: '2024-01-20',
    pnl: 555.0,
    tags: ['Tech', 'Long-term'],
    notes: 'Strong earnings expected',
    status: 'Closed',
  },
  {
    id: 2,
    symbol: 'TSLA',
    assetType: 'Stock',
    side: 'Sell',
    quantity: 50,
    entryPrice: 220.0,
    exitPrice: null,
    entryDate: '2024-01-18',
    exitDate: null,
    pnl: -125.5,
    tags: ['EV', 'Volatile'],
    notes: 'Short position on overvaluation',
    status: 'Open',
  },
  {
    id: 3,
    symbol: 'MSFT',
    assetType: 'Stock',
    side: 'Buy',
    quantity: 75,
    entryPrice: 380.5,
    exitPrice: 385.25,
    entryDate: '2024-01-10',
    exitDate: '2024-01-25',
    pnl: 356.25,
    tags: ['Tech', 'Dividend'],
    notes: 'Cloud growth story',
    status: 'Closed',
  },
];

export function TradesTable() {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('symbol')}>
                    Symbol <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('entryPrice')}>
                    Entry Price <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Exit Price</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('entryDate')}>
                    Entry Date <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Exit Date</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('pnl')}>
                    P&L <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>{trade.assetType}</TableCell>
                  <TableCell>
                    <Badge variant={trade.side === 'Buy' ? 'default' : 'secondary'}>
                      {trade.side}
                    </Badge>
                  </TableCell>
                  <TableCell>{trade.quantity}</TableCell>
                  <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                  <TableCell>{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}</TableCell>
                  <TableCell>{trade.entryDate}</TableCell>
                  <TableCell>{trade.exitDate || '-'}</TableCell>
                  <TableCell>
                    <span className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${trade.pnl.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {trade.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.status === 'Open' ? 'destructive' : 'default'}>
                      {trade.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

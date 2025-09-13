import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

// Mock data - in real app this would come from props or API
const trades = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  symbol: ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX'][i % 8],
  assetType: ['Stock', 'Option', 'ETF'][i % 3],
  side: i % 2 === 0 ? 'Buy' : 'Sell',
  quantity: Math.floor(Math.random() * 1000) + 1,
  entryPrice: Math.random() * 500 + 50,
  exitPrice: i % 3 === 0 ? Math.random() * 500 + 50 : null,
  entryDate: new Date(2024, 0, 1 + (i % 365)).toISOString().split('T')[0],
  exitDate: i % 3 === 0 ? new Date(2024, 0, 1 + (i % 365)).toISOString().split('T')[0] : null,
  pnl: i % 3 === 0 ? (Math.random() - 0.5) * 2000 : (Math.random() - 0.5) * 500,
  tags: [['Tech', 'Long-term'], ['EV', 'Volatile'], ['Cloud', 'Growth']][i % 3],
  notes: `Trade note ${i + 1}`,
  status: i % 3 === 0 ? 'Closed' : 'Open',
}));

interface VirtualizedTradesTableProps {
  data?: typeof trades;
  height?: number;
}

export function VirtualizedTradesTable({ data = trades, height = 600 }: VirtualizedTradesTableProps) {
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

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortField as keyof typeof a];
      const bValue = b[sortField as keyof typeof b];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
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
  }, [data, sortField, sortDirection]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5, // Number of items to render outside of the visible area
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Trades ({sortedData.length.toLocaleString()})</CardTitle>
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
          </Table>
          
          {/* Virtualized table body */}
          <div 
            ref={parentRef}
            className="overflow-auto"
            style={{ height }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const trade = sortedData[virtualRow.index];
                return (
                  <div
                    key={trade.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>{trade.assetType}</TableCell>
                      <TableCell>
                        <Badge variant={trade.side === 'Buy' ? 'default' : 'secondary'}>
                          {trade.side}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.quantity.toLocaleString()}</TableCell>
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TradeGroup } from '@/lib/trade-calculations';

interface PositionsTableProps {
  positions: TradeGroup[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const pnlColor = (pnl: number) => {
    if (pnl === 0) return '';
    return pnl > 0 ? 'text-green-600' : 'text-red-600';
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionDescription = (position: TradeGroup) => {
    if (position.asset_type === 'option' && (position.strike_price || position.expiration_date)) {
      return `${position.underlying || position.symbol} ${position.strike_price || ''} ${position.option_type?.toUpperCase() || ''} ${position.expiration_date || ''}`;
    }
    return position.symbol;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Avg Entry</TableHead>
                <TableHead>Avg Exit</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead>Realized P&L</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={`${position.symbol}_${position.strike_price}_${position.expiration_date}_${position.option_type}`}>
                  <TableCell className="font-medium">
                    {getPositionDescription(position)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {position.asset_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{position.remainingQuantity.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(position.averageEntryPrice)}</TableCell>
                  <TableCell>{formatCurrency(position.averageExitPrice)}</TableCell>
                  <TableCell>{formatCurrency(position.totalFees)}</TableCell>
                  <TableCell className={pnlColor(position.realizedPnL)}>
                    {formatCurrency(position.realizedPnL)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor(position.status)}>
                      {position.status}
                    </Badge>
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

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdjustedExecutions, formatAdjustedValue } from '@/lib/reports/useAdjustedExecutions';
import { Execution } from '@/lib/reports/useAdjustedExecutions';

// Sample execution data for demo
const sampleExecutions: Execution[] = [
  {
    id: '1',
    symbol: 'AAPL',
    instrument_type: 'equity',
    side: 'buy',
    quantity: 100,
    price: 500.00, // Pre-split price
    timestamp: '2020-08-15T10:30:00Z',
    fees: 1.00,
    currency: 'USD',
    venue: 'NASDAQ'
  },
  {
    id: '2',
    symbol: 'AAPL',
    instrument_type: 'equity',
    side: 'sell',
    quantity: 100,
    price: 520.00, // Pre-split price
    timestamp: '2020-09-15T14:45:00Z',
    fees: 1.00,
    currency: 'USD',
    venue: 'NASDAQ'
  },
  {
    id: '3',
    symbol: 'TSLA',
    instrument_type: 'equity',
    side: 'buy',
    quantity: 50,
    price: 900.00, // Pre-split price
    timestamp: '2022-08-10T09:15:00Z',
    fees: 1.50,
    currency: 'USD',
    venue: 'NASDAQ'
  },
  {
    id: '4',
    symbol: 'TSLA',
    instrument_type: 'equity',
    side: 'sell',
    quantity: 50,
    price: 950.00, // Pre-split price
    timestamp: '2022-09-10T16:00:00Z',
    fees: 1.50,
    currency: 'USD',
    venue: 'NASDAQ'
  },
  {
    id: '5',
    symbol: 'MSFT',
    instrument_type: 'equity',
    side: 'buy',
    quantity: 200,
    price: 300.00, // No split
    timestamp: '2023-01-15T11:00:00Z',
    fees: 2.00,
    currency: 'USD',
    venue: 'NASDAQ'
  },
  {
    id: '6',
    symbol: 'SPY240216C00450000',
    instrument_type: 'option',
    side: 'buy',
    quantity: 1,
    price: 5.00, // Options not adjusted
    timestamp: '2024-01-17T10:00:00Z',
    fees: 2.00,
    currency: 'USD',
    venue: 'ARCA'
  }
];

export function DemoAdjustment() {
  const [enableAdjustments, setEnableAdjustments] = useState(true);
  const [adjustmentDirection, setAdjustmentDirection] = useState<'forward' | 'backward'>('forward');

  const { adjustedExecutions, summary } = useAdjustedExecutions(sampleExecutions, {
    enableAdjustments,
    adjustmentDirection
  });

  const handleSyncCorporateActions = async () => {
    try {
      const response = await fetch('/api/corporate-actions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Corporate actions synced:', result);
        alert(`Synced ${result.synced} corporate actions`);
      } else {
        console.error('Failed to sync corporate actions');
        alert('Failed to sync corporate actions');
      }
    } catch (error) {
      console.error('Error syncing corporate actions:', error);
      alert('Error syncing corporate actions');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Corporate Actions Adjustment Demo</CardTitle>
          <CardDescription>
            Demonstrates split-adjusted display values for equity executions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="adjustments"
                  checked={enableAdjustments}
                  onCheckedChange={setEnableAdjustments}
                />
                <Label htmlFor="adjustments">Enable Adjustments</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label>Direction:</Label>
                <Button
                  variant={adjustmentDirection === 'forward' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAdjustmentDirection('forward')}
                >
                  Forward
                </Button>
                <Button
                  variant={adjustmentDirection === 'backward' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAdjustmentDirection('backward')}
                >
                  Backward
                </Button>
              </div>
            </div>

            <Button onClick={handleSyncCorporateActions} variant="outline">
              Sync Corporate Actions
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summary.totalExecutions}</div>
                <p className="text-xs text-muted-foreground">Total Executions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summary.adjustedExecutions}</div>
                <p className="text-xs text-muted-foreground">Adjusted Executions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summary.symbolsWithAdjustments.length}</div>
                <p className="text-xs text-muted-foreground">Symbols with Adjustments</p>
              </CardContent>
            </Card>
          </div>

          {summary.symbolsWithAdjustments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium">Adjusted Symbols:</span>
              {summary.symbolsWithAdjustments.map(symbol => (
                <Badge key={symbol} variant="secondary">
                  {symbol}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
          <CardDescription>
            Original vs. adjusted values for each execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>Adjusted Price</TableHead>
                <TableHead>Original Qty</TableHead>
                <TableHead>Adjusted Qty</TableHead>
                <TableHead>Split Factor</TableHead>
                <TableHead>Adjusted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustedExecutions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell className="font-medium">{execution.symbol}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{execution.instrument_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={execution.side === 'buy' ? 'default' : 'secondary'}>
                      {execution.side}
                    </Badge>
                  </TableCell>
                  <TableCell>${execution.originalPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    {formatAdjustedValue(execution.originalPrice, execution.adjustedPrice, 'price')}
                  </TableCell>
                  <TableCell>{execution.originalQuantity.toLocaleString()}</TableCell>
                  <TableCell>
                    {formatAdjustedValue(execution.originalQuantity, execution.adjustedQuantity, 'quantity')}
                  </TableCell>
                  <TableCell>{execution.splitFactor}</TableCell>
                  <TableCell>
                    {execution.hasAdjustments ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Explanation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">How Split Adjustments Work:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>AAPL:</strong> 4:1 split on 2020-08-31 - prices divided by 4, quantities multiplied by 4</li>
              <li><strong>TSLA:</strong> 3:1 split on 2022-08-25 - prices divided by 3, quantities multiplied by 3</li>
              <li><strong>MSFT:</strong> No splits - no adjustments applied</li>
              <li><strong>Options:</strong> Not adjusted (they're already derivative instruments)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Display Indicators:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Values with <code>*</code> indicate split-adjusted amounts</li>
              <li>Original values are preserved for reference</li>
              <li>P&L calculations use adjusted values for consistency</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

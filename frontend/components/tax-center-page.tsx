'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Receipt, Download, FileText, DollarSign, TrendingUp } from 'lucide-react';

const taxSummary = {
  totalRealizedGains: 15678.9,
  totalRealizedLosses: -3456.78,
  netRealizedGains: 12222.12,
  shortTermGains: 8765.43,
  longTermGains: 6913.47,
  washSales: 234.56,
  taxableEvents: 89,
};

const monthlyTaxData = [
  { month: 'Jan 2024', realizedPL: 2345.67, shortTerm: 1234.56, longTerm: 1111.11, washSales: 0 },
  { month: 'Dec 2023', realizedPL: 1876.43, shortTerm: 876.43, longTerm: 1000.0, washSales: 45.67 },
  { month: 'Nov 2023', realizedPL: 3421.89, shortTerm: 2000.0, longTerm: 1421.89, washSales: 0 },
  {
    month: 'Oct 2023',
    realizedPL: -567.23,
    shortTerm: -300.0,
    longTerm: -267.23,
    washSales: 123.45,
  },
  { month: 'Sep 2023', realizedPL: 2987.45, shortTerm: 1500.0, longTerm: 1487.45, washSales: 0 },
];

const washSaleTransactions = [
  {
    symbol: 'AAPL',
    sellDate: '2024-01-15',
    buyDate: '2024-01-20',
    loss: -234.56,
    adjustment: 234.56,
  },
  {
    symbol: 'TSLA',
    sellDate: '2023-12-28',
    buyDate: '2024-01-05',
    loss: -456.78,
    adjustment: 456.78,
  },
];

export function TaxCenterPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tax Center</h2>
        <div className="flex items-center space-x-2">
          <Select defaultValue="2024">
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export 1099
          </Button>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Realized Gains</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${taxSummary.netRealizedGains.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Subject to capital gains tax</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Short-Term Gains</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${taxSummary.shortTermGains.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Taxed as ordinary income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long-Term Gains</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${taxSummary.longTermGains.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Preferential tax rates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wash Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${taxSummary.washSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Disallowed losses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Tax Summary</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
          <TabsTrigger value="wash-sales">Wash Sales</TabsTrigger>
          <TabsTrigger value="documents">Tax Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Capital Gains Breakdown</CardTitle>
                <CardDescription>Realized gains and losses for tax year 2024</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Realized Gains</span>
                    <span className="text-green-600 font-medium">
                      +${taxSummary.totalRealizedGains.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Realized Losses</span>
                    <span className="text-red-600 font-medium">
                      ${taxSummary.totalRealizedLosses.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Net Capital Gains</span>
                    <span className="text-green-600 font-bold">
                      +${taxSummary.netRealizedGains.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Implications</CardTitle>
                <CardDescription>Estimated tax impact based on current gains</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Short-term (ordinary rates)
                    </span>
                    <span className="font-medium">
                      ${taxSummary.shortTermGains.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Long-term (preferential rates)
                    </span>
                    <span className="font-medium">
                      ${taxSummary.longTermGains.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Wash sale adjustments</span>
                    <span className="font-medium text-yellow-600">
                      ${taxSummary.washSales.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Estimated tax liability (22% bracket):
                  </p>
                  <p className="text-lg font-bold">$2,688.87</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Tax Summary</CardTitle>
              <CardDescription>Realized gains and losses by month</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Realized P&L</TableHead>
                    <TableHead>Short-Term</TableHead>
                    <TableHead>Long-Term</TableHead>
                    <TableHead>Wash Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyTaxData.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell
                        className={month.realizedPL >= 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {month.realizedPL >= 0 ? '+' : ''}${month.realizedPL.toFixed(2)}
                      </TableCell>
                      <TableCell>${month.shortTerm.toFixed(2)}</TableCell>
                      <TableCell>${month.longTerm.toFixed(2)}</TableCell>
                      <TableCell className={month.washSales > 0 ? 'text-yellow-600' : ''}>
                        ${month.washSales.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wash-sales">
          <Card>
            <CardHeader>
              <CardTitle>Wash Sale Transactions</CardTitle>
              <CardDescription>Transactions subject to wash sale rules</CardDescription>
            </CardHeader>
            <CardContent>
              {washSaleTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Sell Date</TableHead>
                      <TableHead>Repurchase Date</TableHead>
                      <TableHead>Disallowed Loss</TableHead>
                      <TableHead>Cost Basis Adjustment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {washSaleTransactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{transaction.symbol}</TableCell>
                        <TableCell>{transaction.sellDate}</TableCell>
                        <TableCell>{transaction.buyDate}</TableCell>
                        <TableCell className="text-red-600">
                          ${transaction.loss.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-yellow-600">
                          +${transaction.adjustment.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No wash sale transactions found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>Download your tax-related documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Form 1099-B (Consolidated)', year: '2024', status: 'Available' },
                  { name: 'Schedule D Worksheet', year: '2024', status: 'Available' },
                  { name: 'Wash Sale Report', year: '2024', status: 'Available' },
                  { name: 'Form 1099-B (Consolidated)', year: '2023', status: 'Available' },
                ].map((document, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-muted-foreground">Tax Year {document.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-green-600">
                        {document.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

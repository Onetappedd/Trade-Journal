'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard, Download, Calendar } from 'lucide-react';

const billingHistory = [
  { id: 'INV-001', date: '2024-01-01', amount: '$29.99', status: 'Paid', downloadUrl: '#' },
  { id: 'INV-002', date: '2023-12-01', amount: '$29.99', status: 'Paid', downloadUrl: '#' },
  { id: 'INV-003', date: '2023-11-01', amount: '$29.99', status: 'Paid', downloadUrl: '#' },
  { id: 'INV-004', date: '2023-10-01', amount: '$29.99', status: 'Paid', downloadUrl: '#' },
];

export function BillingSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Manage your subscription and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg">Pro Plan</span>
                <Badge>Active</Badge>
              </div>
              <p className="text-muted-foreground">
                Advanced trading analytics and unlimited trades
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Next billing: February 1, 2024</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">$29.99</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline">Change Plan</Button>
            <Button variant="outline">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">•••• •••• •••• 4242</div>
                <div className="text-sm text-muted-foreground">Expires 12/25</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </div>
          </div>

          <Button variant="outline">
            <CreditCard className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Download your invoices and view payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

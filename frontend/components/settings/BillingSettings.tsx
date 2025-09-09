'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

export function BillingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing & Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Current Plan</h3>
              <p className="text-sm text-muted-foreground">
                Free Plan - 100 trades per month
              </p>
            </div>
            <Badge variant="secondary">Free</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Usage This Month</h3>
              <p className="text-sm text-muted-foreground">
                0 / 100 trades used
              </p>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Available Plans</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium">Pro Plan</h5>
                <Badge variant="default">Popular</Badge>
              </div>
              <p className="text-2xl font-bold">$20<span className="text-sm font-normal">/month</span></p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Unlimited trades</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
                <li>• API access</li>
              </ul>
              <Button className="w-full mt-4">Upgrade to Pro</Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium">Annual Pro</h5>
                <Badge variant="secondary">Save 20%</Badge>
              </div>
              <p className="text-2xl font-bold">$16<span className="text-sm font-normal">/month</span></p>
              <p className="text-sm text-muted-foreground">Billed annually ($192/year)</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• All Pro features</li>
                <li>• 20% savings</li>
                <li>• Priority support</li>
                <li>• Early access to features</li>
              </ul>
              <Button className="w-full mt-4">Upgrade to Annual</Button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Payment Method</h4>
          <p className="text-sm text-muted-foreground mb-3">
            No payment method on file. Add a payment method to upgrade your plan.
          </p>
          <Button size="sm" variant="outline">
            Add Payment Method
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';

export function TradingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trading Preferences
        </CardTitle>
        <CardDescription>
          Configure your trading preferences and risk management settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-import">Auto-import trades</Label>
              <p className="text-sm text-muted-foreground">
                Automatically import trades from connected brokers
              </p>
            </div>
            <Switch id="auto-import" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="risk-alerts">Risk alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when portfolio risk exceeds limits
              </p>
            </div>
            <Switch id="risk-alerts" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pnl-alerts">P&L alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified of significant profit/loss changes
              </p>
            </div>
            <Switch id="pnl-alerts" defaultChecked />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="default-timezone">Default Timezone</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="est">Eastern Time</SelectItem>
                <SelectItem value="cst">Central Time</SelectItem>
                <SelectItem value="mst">Mountain Time</SelectItem>
                <SelectItem value="pst">Pacific Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="currency">Default Currency</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
                <SelectItem value="cad">CAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button>Save Settings</Button>
      </CardContent>
    </Card>
  );
}
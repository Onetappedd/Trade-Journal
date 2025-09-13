'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'lucide-react';

export function IntegrationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Broker Integrations
        </CardTitle>
        <CardDescription>
          Connect your trading accounts for automatic trade import
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Interactive Brokers</h3>
              <p className="text-sm text-muted-foreground">
                Connect your IBKR account for automatic trade import
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not Connected</Badge>
              <Button size="sm">Connect</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">TD Ameritrade</h3>
              <p className="text-sm text-muted-foreground">
                Import trades from your TD Ameritrade account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not Connected</Badge>
              <Button size="sm">Connect</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">E*TRADE</h3>
              <p className="text-sm text-muted-foreground">
                Sync your E*TRADE trading data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not Connected</Badge>
              <Button size="sm">Connect</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Fidelity</h3>
              <p className="text-sm text-muted-foreground">
                Import trades from Fidelity accounts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not Connected</Badge>
              <Button size="sm">Connect</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Robinhood</h3>
              <p className="text-sm text-muted-foreground">
                Connect your Robinhood account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not Connected</Badge>
              <Button size="sm">Connect</Button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Need help connecting?</h4>
          <p className="text-sm text-blue-700 mb-3">
            Check our documentation for step-by-step instructions on connecting your broker accounts.
          </p>
          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            View Documentation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
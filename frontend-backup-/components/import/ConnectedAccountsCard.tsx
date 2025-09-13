'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isFeatureEnabled } from '@/lib/config/flags';
import { Settings, Link, Link2Off, RefreshCw } from 'lucide-react';

const BROKERS = [
  { id: 'ibkr', name: 'Interactive Brokers', logo: 'IBKR' },
  { id: 'tradier', name: 'Tradier', logo: 'Tradier' },
  { id: 'alpaca', name: 'Alpaca', logo: 'Alpaca' },
  { id: 'tastytrade', name: 'TastyTrade', logo: 'TastyTrade' },
  { id: 'tradovate', name: 'Tradovate', logo: 'Tradovate' },
];

export function ConnectedAccountsCard() {
  const brokerApisEnabled = isFeatureEnabled('BROKER_APIS_ENABLED');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Connected Accounts
        </CardTitle>
        <CardDescription>
          Connect your broker accounts to automatically import trades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!brokerApisEnabled && (
          <Alert>
            <AlertDescription>
              Broker connections are currently disabled. Enable them in{' '}
              <Button variant="link" className="p-0 h-auto">
                Settings → Environment
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3">
          {BROKERS.map((broker) => (
            <div
              key={broker.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-sm font-medium">
                  {broker.logo}
                </div>
                <div>
                  <p className="font-medium">{broker.name}</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Coming Soon</Badge>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!brokerApisEnabled}
                        className="h-8 w-8 p-0"
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {brokerApisEnabled 
                        ? `Connect ${broker.name} account`
                        : 'Enable broker APIs in Settings → Environment'
                      }
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            disabled={!brokerApisEnabled}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Connections
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

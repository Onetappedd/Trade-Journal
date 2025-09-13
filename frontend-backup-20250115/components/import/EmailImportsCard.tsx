'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { isFeatureEnabled } from '@/lib/config/flags';
import { Mail, Copy, ExternalLink, AlertTriangle } from 'lucide-react';

export function EmailImportsCard() {
  const [userId] = useState('user123'); // TODO: Get from auth context
  const emailApisEnabled = isFeatureEnabled('INBOUND_EMAIL_ENABLED');

  const forwardingAddress = `${userId}@placeholder.mail`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(forwardingAddress);
      toast.success('Address copied', {
        description: 'Email forwarding address copied to clipboard'
      });
    } catch (error) {
      toast.error('Copy failed', {
        description: 'Failed to copy address to clipboard'
      });
    }
  };

  const getStatusBadge = () => {
    if (emailApisEnabled) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Disabled</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Imports
        </CardTitle>
        <CardDescription>
          Forward trade confirmations to automatically import trades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!emailApisEnabled && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Email imports are disabled until domain is configured. 
              Contact support to set up your forwarding domain.
            </AlertDescription>
          </Alert>
        )}

        {/* Forwarding Address */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Forwarding Address</label>
            {getStatusBadge()}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={forwardingAddress}
              readOnly
              className="font-mono text-sm"
              disabled={!emailApisEnabled}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              disabled={!emailApisEnabled}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Forward trade confirmations from your broker to this address
          </p>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Setup Instructions</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                1
              </span>
              <span>Add this address to your broker's email forwarding settings</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                2
              </span>
              <span>Forward a test trade confirmation to verify setup</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                3
              </span>
              <span>Check the import history below for processed trades</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full"
            disabled={!emailApisEnabled}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Setup Guide
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            disabled={!emailApisEnabled}
          >
            <Mail className="h-4 w-4 mr-2" />
            Test Forwarding
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

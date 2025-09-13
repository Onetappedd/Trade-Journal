'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';

export function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="trade-alerts">Trade alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when trades are executed
              </p>
            </div>
            <Switch id="trade-alerts" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="portfolio-alerts">Portfolio alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified of portfolio changes
              </p>
            </div>
            <Switch id="portfolio-alerts" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="market-alerts">Market alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified of market movements
              </p>
            </div>
            <Switch id="market-alerts" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-reports">Weekly reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly performance reports
              </p>
            </div>
            <Switch id="weekly-reports" defaultChecked />
          </div>
        </div>

        <Button>Save Preferences</Button>
      </CardContent>
    </Card>
  );
}
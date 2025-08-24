'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Smartphone, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Trade Executed Successfully',
    message: 'Your buy order for 100 shares of AAPL has been filled at $185.50',
    time: '2 minutes ago',
    read: false,
  },
  {
    id: 2,
    type: 'info',
    title: 'Market Alert',
    message: 'TSLA has moved 5% in the last hour',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    type: 'warning',
    title: 'Risk Management Alert',
    message: 'Your portfolio is approaching the daily loss limit',
    time: '3 hours ago',
    read: true,
  },
  {
    id: 4,
    type: 'success',
    title: 'Monthly Report Ready',
    message: 'Your trading performance report for March is now available',
    time: '1 day ago',
    read: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">
          Manage your notification preferences and view recent alerts
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified about trading activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="trade-notifications">Trade Executions</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when trades are executed
                    </p>
                  </div>
                </div>
                <Switch id="trade-notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="risk-alerts">Risk Management Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerts for risk thresholds and limits
                    </p>
                  </div>
                </div>
                <Switch id="risk-alerts" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                </div>
                <Switch id="email-notifications" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                </div>
                <Switch id="push-notifications" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Your latest alerts and updates</CardDescription>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Mark All as Read
              </Button>
              <Button variant="outline" size="sm">
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg ${!notification.read ? 'bg-muted/50' : ''}`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.read && <Badge variant="default" className="h-2 w-2 p-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

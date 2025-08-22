'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const alerts = [
  {
    type: 'price',
    title: 'AAPL Price Alert',
    message: 'AAPL reached your target price of $155',
    time: '2 minutes ago',
    severity: 'success',
    icon: TrendingUp,
  },
  {
    type: 'risk',
    title: 'Portfolio Risk',
    message: 'Your portfolio concentration in tech is above 60%',
    time: '1 hour ago',
    severity: 'warning',
    icon: AlertTriangle,
  },
  {
    type: 'loss',
    title: 'Stop Loss Triggered',
    message: 'TSLA position closed at -5% loss',
    time: '3 hours ago',
    severity: 'error',
    icon: TrendingDown,
  },
  {
    type: 'news',
    title: 'Market News',
    message: 'Fed announces interest rate decision',
    time: '5 hours ago',
    severity: 'info',
    icon: Bell,
  },
];

export function AlertsPanel() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alerts & Notifications</CardTitle>
        <Button variant="outline" size="sm">
          <Bell className="mr-2 h-4 w-4" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <div
                className={`p-2 rounded-full ${
                  alert.severity === 'success'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900'
                    : alert.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900'
                      : alert.severity === 'error'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900'
                }`}
              >
                <alert.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{alert.title}</div>
                  <Badge
                    variant={
                      alert.severity === 'success'
                        ? 'default'
                        : alert.severity === 'warning'
                          ? 'secondary'
                          : alert.severity === 'error'
                            ? 'destructive'
                            : 'outline'
                    }
                  >
                    {alert.type}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{alert.message}</div>
                <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

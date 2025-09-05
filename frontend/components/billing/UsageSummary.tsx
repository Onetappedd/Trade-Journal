import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Download, RefreshCw, BarChart3, Database } from 'lucide-react';
import { useCurrentMonthUsage } from '@/hooks/useUsageTracking';
import { Skeleton } from '@/components/ui/skeleton';

const getEventIcon = (kind: string) => {
  switch (kind) {
    case 'csv_import':
      return <Download className="h-4 w-4" />;
    case 'manual_refresh':
      return <RefreshCw className="h-4 w-4" />;
    case 'analytics_query':
      return <BarChart3 className="h-4 w-4" />;
    case 'heavy_analytics':
      return <Database className="h-4 w-4" />;
    case 'snaptrade_refresh':
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getEventLabel = (kind: string) => {
  switch (kind) {
    case 'csv_import':
      return 'CSV Imports';
    case 'manual_refresh':
      return 'Manual Refreshes';
    case 'analytics_query':
      return 'Analytics Queries';
    case 'heavy_analytics':
      return 'Heavy Analytics';
    case 'snaptrade_refresh':
      return 'SnapTrade Refreshes';
    default:
      return kind.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const getEventColor = (kind: string) => {
  switch (kind) {
    case 'csv_import':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'manual_refresh':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'analytics_query':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'heavy_analytics':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'snaptrade_refresh':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export function UsageSummary() {
  const { data: usage, isLoading, error } = useCurrentMonthUsage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Month's Usage</CardTitle>
          <CardDescription>Track your Pro feature usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Month's Usage</CardTitle>
          <CardDescription>Track your Pro feature usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Unable to load usage data
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEvents = (usage as any)?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
  const totalCost = (usage as any)?.reduce((sum: number, item: any) => sum + item.total_cost_estimate, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Month's Usage</CardTitle>
        <CardDescription>
          Track your Pro feature usage and estimated costs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {usage && (usage as any).length > 0 ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">${totalCost.toFixed(3)}</div>
                <div className="text-sm text-muted-foreground">Est. Cost</div>
              </div>
            </div>

            {/* Usage Breakdown */}
            <div className="space-y-3">
              {(usage as any).map((item: any) => (
                <div key={item.kind} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getEventIcon(item.kind)}
                    <span className="font-medium">{getEventLabel(item.kind)}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className={getEventColor(item.kind)}>
                      {item.count}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ${item.total_cost_estimate.toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cost Breakdown Info */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <div className="font-medium mb-2">Cost Breakdown:</div>
              <div className="space-y-1">
                <div>• CSV Import: $0.01 per import</div>
                <div>• Manual Refresh: $0.005 per refresh</div>
                <div>• Analytics Query: $0.001 per query</div>
                <div>• Heavy Analytics: $0.05 per query</div>
                <div>• SnapTrade Refresh: $0.02 per refresh</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No usage data for this month</p>
            <p className="text-sm">Usage tracking will appear here as you use Pro features</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

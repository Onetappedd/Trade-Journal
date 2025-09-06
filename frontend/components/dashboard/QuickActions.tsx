'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, FileText, TrendingUp, BarChart3, Calculator } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Add Trade',
      description: 'Record a new trade',
      icon: Plus,
      href: '/dashboard/import/manual',
      color: 'text-green-600',
    },
    {
      title: 'Import Trades',
      description: 'Upload CSV file',
      icon: Upload,
      href: '/dashboard/import-trades',
      color: 'text-blue-600',
    },
    {
      title: 'View Reports',
      description: 'Generate reports',
      icon: FileText,
      href: '/dashboard/reports',
      color: 'text-purple-600',
    },
    {
      title: 'Analytics',
      description: 'View performance',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-orange-600',
    },
    {
      title: 'Tax Center',
      description: 'Tax documents',
      icon: Calculator,
      href: '/dashboard/tax-center',
      color: 'text-red-600',
    },
    {
      title: 'Market Scanner',
      description: 'Find opportunities',
      icon: TrendingUp,
      href: '/dashboard/scanner',
      color: 'text-indigo-600',
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-muted/50 bg-transparent"
              asChild
            >
              <a href={action.href}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {action.description}
                  </div>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

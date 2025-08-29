import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ImportDashboard } from '../../../components/import/ImportDashboard';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Import Data - Trading Journal',
  description: 'Import your trading data from various sources',
};

export default function ImportPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
          <p className="text-muted-foreground">
            Connect your broker accounts and import trading data
          </p>
        </div>
        <Link href="/docs/importing">
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        </Link>
      </div>

      <Suspense fallback={<ImportDashboardSkeleton />}>
        <ImportDashboard />
      </Suspense>
    </div>
  );
}

function ImportDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

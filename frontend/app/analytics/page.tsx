'use client';

import { Suspense } from 'react';
import { AnalyticsPage } from '@/components/analytics-page';
import { Card } from '@/components/ui/card';

function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsPage />
    </Suspense>
  );
}

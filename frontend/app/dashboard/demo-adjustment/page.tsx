import { Suspense } from 'react';
import { DemoAdjustment } from '@/components/import/DemoAdjustment';

export const metadata = {
  title: 'Corporate Actions Demo - Riskr',
  description: 'Demo of split-adjusted display values for equity executions',
};

export default function DemoAdjustmentPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Corporate Actions Adjustment Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates how corporate actions (like stock splits) are handled in Riskr.
          Split-adjusted values are calculated for display purposes without mutating the original data.
        </p>
      </div>

      <Suspense fallback={<div>Loading demo...</div>}>
        <DemoAdjustment />
      </Suspense>
    </div>
  );
}

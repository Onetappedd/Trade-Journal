import { Suspense } from 'react';
import { ManualEntryForm } from '@/components/import/ManualEntryForm';

export const metadata = {
  title: 'Manual Entry - Trade Journal',
  description: 'Add single executions manually',
};

export default function ManualEntryPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>Loading manual entry form...</div>}>
        <ManualEntryForm />
      </Suspense>
    </div>
  );
}

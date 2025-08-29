import { Suspense } from 'react';
import { ImportRunDetails } from '@/components/import/ImportRunDetails';

export const metadata = {
  title: 'Import Run Details - Trade Journal',
  description: 'View detailed results of an import run',
};

export default function ImportRunDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>Loading import run details...</div>}>
        <ImportRunDetails runId={params.id} />
      </Suspense>
    </div>
  );
}

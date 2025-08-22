import { Suspense } from 'react';
import ImportTradesPage from '@/components/import-trades-page';

export default function ImportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ImportTradesPage />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { Metadata } from 'next';
import { InstrumentMergeTool } from '@/components/admin/InstrumentMergeTool';

export const metadata: Metadata = {
  title: 'Merge Instruments - Admin',
  description: 'Merge instruments and fix mistaken splits/aliases',
};

export default function AdminInstrumentsMergePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Merge Instruments</h1>
        <p className="text-muted-foreground mt-2">
          Fix mistaken instrument splits/aliases by merging instruments and re-pointing executions.
        </p>
      </div>
      
      <Suspense fallback={<div>Loading merge tool...</div>}>
        <InstrumentMergeTool />
      </Suspense>
    </div>
  );
}

'use client';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { TaxSummaryCards } from '@/components/tax-center/TaxSummaryCards';
import { TaxCharts } from '@/components/tax-center/TaxCharts';
import { RealizedTradesTable } from '@/components/tax-center/RealizedTradesTable';
import { TaxExportSection } from '@/components/tax-center/TaxExportSection';
import { TaxResources } from '@/components/tax-center/TaxResources';

export default function TaxCenterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tax Center</h2>
        <p className="text-muted-foreground">
          Comprehensive tax reporting and analysis for your trading activities
        </p>
      </div>

      <TaxSummaryCards />

      <TaxExportSection />

      <TaxCharts />

      <RealizedTradesTable />

      <TaxResources />
    </div>
  );
}

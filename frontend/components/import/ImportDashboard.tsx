'use client';

import { ConnectedAccountsCard } from './ConnectedAccountsCard';
import { CsvImportCard } from './CsvImportCard';
import { EmailImportsCard } from './EmailImportsCard';
import { ImportHistoryTable } from './ImportHistoryTable';

export function ImportDashboard() {
  return (
    <div className="space-y-6">
      {/* Import Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConnectedAccountsCard />
        <CsvImportCard />
        <EmailImportsCard />
      </div>

      {/* Import History */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Import History</h2>
          <p className="text-muted-foreground">
            Track your data import progress and results
          </p>
        </div>
        <ImportHistoryTable />
      </div>
    </div>
  );
}

'use client';

import { Metadata } from 'next';
import CSVImporter from '@/src/components/import/CSVImporter';
import { useAuth } from '@/providers/auth-provider';

// Import feature flag with fallback
let IMPORT_V2: boolean;
try {
  const flags = require('@/src/lib/flags');
  IMPORT_V2 = flags.IMPORT_V2;
} catch {
  IMPORT_V2 = process.env.NEXT_PUBLIC_IMPORT_V2_ENABLED === 'true' || true; // Temporarily enabled for testing
}

export const metadata: Metadata = {
  title: 'Import Trades',
};

export default function ImportPage() {
  const { user, loading } = useAuth();
  
  // Debug logging
  console.log('ImportPage - Auth state:', { user: !!user, loading, userId: user?.id });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!IMPORT_V2) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Import v2 is disabled</h1>
          <p className="text-muted-foreground">
            Set NEXT_PUBLIC_IMPORT_V2_ENABLED=true to enable in this environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <nav aria-label="Breadcrumb">
        <p className="text-sm text-muted-foreground">Dashboard / Import</p>
      </nav>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Import Trades</h1>
        <p className="text-muted-foreground">
          Upload your broker CSV, map columns, validate, and import with rollback.
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="p-6">
          <CSVImporter />
        </div>
      </div>
    </div>
  );
}

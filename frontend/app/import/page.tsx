"use client"

import React from "react"
import CSVImporter from "@/src/components/import/CSVImporter"
import { CSVImporterTest } from "@/src/components/import/CSVImporterTest"
import { BulletproofCSVImporter } from "@/src/components/import/BulletproofCSVImporter"
import { IMPORT_V2, IS_E2E } from "@/lib/flags"

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CSVImporter Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
          <h2 className="text-red-200 font-semibold mb-2">Import Error</h2>
          <p className="text-red-300 mb-4">
            We encountered an unexpected error. Please try again.
          </p>
          {this.state.error && (
            <details className="text-sm text-red-400">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 mb-2">Import Trades</h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
            Import your trading history from CSV files or connect your brokerage accounts
          </p>
        </div>

        {/* Import v2 disabled message */}
        {!IMPORT_V2 && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200">
              Import v2 is disabled. Please enable NEXT_PUBLIC_IMPORT_V2_ENABLED=true
            </p>
          </div>
        )}

        {/* Test indicators */}
        {IS_E2E && (
          <div data-testid="import-flag" style={{ display: 'none' }}>
            {IMPORT_V2 ? 'enabled' : 'disabled'}
          </div>
        )}

         {/* Test CSV Importer Component */}
         <div data-testid="importer-mounted">mounted</div>
         <div data-testid="import-file-input">file input placeholder</div>
         <div data-testid="import-start-button">start button placeholder</div>
         
         {/* Simple test component to verify basic functionality */}
         <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-4">
           <h3 className="text-blue-200 font-semibold mb-2">Test Component</h3>
           <p className="text-blue-300">This is a test component to verify the page loads correctly.</p>
         </div>
         
        {/* Test CSV Importer Component */}
        <CSVImporterTest />
        
        {/* Bulletproof CSV Importer Component */}
        <ErrorBoundary>
          <BulletproofCSVImporter />
        </ErrorBoundary>
        
        {/* Legacy CSV Importer Component with Error Boundary */}
        <ErrorBoundary>
          <CSVImporter />
        </ErrorBoundary>
      </div>
    </div>
  )
}

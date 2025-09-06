'use client';

import React, { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { sniffHeaders, streamRows } from '@/src/lib/import/parser';
import { autoMap, applyMapping } from '@/src/lib/import/mapping';
import { normalizeRow } from '@/src/lib/import/validate';
import { rowHash } from '@/src/lib/import/hash';
import { insertBatch } from '@/src/lib/import/insertBatch';
import { ProgressBar } from './ProgressBar';
import { ErrorTable } from './ErrorTable';
import { MappingUI } from './MappingUI';
import { SummaryCard } from './SummaryCard';
import type { CanonicalTrade } from '@/src/lib/import/types';

interface BadRow {
  rowNo: number;
  errors: string[];
  data: Record<string, unknown>;
}

interface ImportState {
  stage: 'idle' | 'parsing' | 'mapping' | 'importing' | 'complete';
  progress: number;
  headers: string[];
  sampleRows: Record<string, unknown>[];
  mapping: Record<string, string | null>;
  inserted: number;
  failed: number;
  duplicates: number;
  badRows: BadRow[];
  runId: string | null;
  error: string | null;
}

export function CSVImporter() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [session, setSession] = useState<any>(null);
  const [importState, setImportState] = useState<ImportState>({
    stage: 'idle',
    progress: 0,
    headers: [],
    sampleRows: [],
    mapping: {},
    inserted: 0,
    failed: 0,
    duplicates: 0,
    badRows: [],
    runId: null,
    error: null
  });

  // Auth guard
  React.useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, [supabase.auth]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!session) return;

    setImportState(prev => ({ ...prev, stage: 'parsing', error: null }));

    try {
      // Step 1: Sniff headers and get sample rows
      const { headers, rows } = await sniffHeaders(file, 50);
      
      // Step 2: Auto-map headers
      const mapping = autoMap(headers);

      setImportState(prev => ({
        ...prev,
        stage: 'mapping',
        headers,
        sampleRows: rows,
        mapping
      }));
    } catch (error) {
      setImportState(prev => ({
        ...prev,
        stage: 'idle',
        error: `File parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [session]);

  const handleStartImport = useCallback(async (file: File) => {
    if (!session || !importState.mapping) return;

    setImportState(prev => ({ ...prev, stage: 'importing', progress: 0 }));

    try {
      // Step A: Create ingestion run
      const { data: runData, error: runError } = await supabase
        .from('ingestion_runs')
        .insert({
          user_id: session.user.id,
          source: 'csv-generic',
          file_name: file.name,
          row_count: 0
        })
        .select('id')
        .single();

      if (runError) throw runError;

      const runId = runData.id;
      let totalRows = 0;
      let batch: CanonicalTrade[] = [];
      const badRows: BadRow[] = [];

      // Step B: Stream and process rows
      await new Promise<void>((resolve, reject) => {
        streamRows(
          file,
          async (row, rowNo) => {
            try {
              totalRows++;
              
              // Apply mapping
              const mappedRow = applyMapping(row, importState.mapping);
              
              // Normalize and validate
              const normalized = normalizeRow(mappedRow);
              
              if (!normalized.ok) {
                badRows.push({
                  rowNo,
                  errors: normalized.errors,
                  data: row
                });
                return;
              }

              // Build canonical trade object
              const canonical: CanonicalTrade = {
                user_id: session.user.id,
                asset_type: 'equity', // Default, could be detected
                symbol: normalized.value.symbol as string,
                underlying: normalized.value.underlying as string,
                expiry: normalized.value.expiry as string,
                strike: normalized.value.strike as number,
                option_type: normalized.value.option_type as 'CALL' | 'PUT',
                side: normalized.value.side as 'BUY' | 'SELL',
                open_close: normalized.value.open_close as 'OPEN' | 'CLOSE',
                quantity: normalized.value.quantity as number,
                price: normalized.value.price as number,
                fees: normalized.value.fees as number,
                trade_time_utc: normalized.value.trade_time_utc as string,
                venue: normalized.value.venue as string,
                source: normalized.value.source as string,
                ingestion_run_id: runId,
                row_hash: '',
                raw_json: row
              };

              // Generate row hash
              canonical.row_hash = await rowHash(canonical);

              batch.push(canonical);

              // Insert batch when it reaches 1000 rows
              if (batch.length >= 1000) {
                const result = await insertBatch(supabase, batch);
                
                setImportState(prev => ({
                  ...prev,
                  inserted: prev.inserted + result.inserted,
                  failed: prev.failed + result.failed.length,
                  duplicates: prev.duplicates + result.duplicates
                }));

                batch = [];
              }

              // Update progress
              setImportState(prev => ({
                ...prev,
                progress: totalRows / 10000 // Estimate, could be improved
              }));
            } catch (error) {
              badRows.push({
                rowNo,
                errors: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                data: row
              });
            }
          },
          async () => {
            try {
              // Step C: Flush remaining batch
              if (batch.length > 0) {
                const result = await insertBatch(supabase, batch);
                
                setImportState(prev => ({
                  ...prev,
                  inserted: prev.inserted + result.inserted,
                  failed: prev.failed + result.failed.length,
                  duplicates: prev.duplicates + result.duplicates
                }));
              }

              // Update ingestion run with final counts
              await supabase
                .from('ingestion_runs')
                .update({
                  row_count: totalRows,
                  inserted_count: importState.inserted,
                  failed_count: importState.failed + badRows.length
                })
                .eq('id', runId);

              setImportState(prev => ({
                ...prev,
                stage: 'complete',
                progress: 1,
                badRows
              }));

              resolve();
            } catch (error) {
              reject(error);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    } catch (error) {
      setImportState(prev => ({
        ...prev,
        stage: 'mapping',
        error: `Import error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [session, importState.mapping, importState.inserted, importState.failed, supabase]);

  const downloadFailedRows = useCallback(() => {
    if (importState.badRows.length === 0) return;

    const csvContent = [
      'Row,Errors,Data',
      ...importState.badRows.map(row => 
        `${row.rowNo},"${row.errors.join('; ')}","${JSON.stringify(row.data).replace(/"/g, '""')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_rows.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [importState.badRows]);

  // Auth guard
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to import CSV files.</p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">CSV Import</h1>

      {importState.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{importState.error}</p>
        </div>
      )}

      {importState.stage === 'idle' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id="csv-file-input"
          />
          <label
            htmlFor="csv-file-input"
            className="cursor-pointer block"
          >
            <div className="text-gray-600 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</p>
            <p className="text-gray-600">Drag and drop or click to select a CSV file</p>
          </label>
        </div>
      )}

      {importState.stage === 'parsing' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Parsing CSV file...</p>
        </div>
      )}

      {importState.stage === 'mapping' && (
        <div className="space-y-6">
          <MappingUI
            headers={importState.headers}
            mapping={importState.mapping}
            onChange={(mapping) => setImportState(prev => ({ ...prev, mapping }))}
          />

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview (First 50 Rows)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {importState.headers.map((header) => (
                      <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importState.sampleRows.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      {importState.headers.map((header) => (
                        <td key={header} className="px-3 py-2 text-sm text-gray-900">
                          {String(row[header] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => {
              const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
              const file = fileInput?.files?.[0];
              if (file) handleStartImport(file);
            }}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
          >
            Start Import
          </button>
        </div>
      )}

      {importState.stage === 'importing' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Trades</h3>
            <ProgressBar value={importState.progress} />
            <p className="text-sm text-gray-600 mt-2">
              Inserted: {importState.inserted} | Failed: {importState.failed} | Duplicates: {importState.duplicates}
            </p>
          </div>
        </div>
      )}

      {importState.stage === 'complete' && (
        <div className="space-y-6">
          <SummaryCard
            inserted={importState.inserted}
            failed={importState.failed}
            duplicates={importState.duplicates}
          />

          {importState.badRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Failed Rows</h3>
                <button
                  onClick={downloadFailedRows}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Download Failed Rows
                </button>
              </div>
              <ErrorTable rows={importState.badRows} />
            </div>
          )}

          <button
            onClick={() => setImportState({
              stage: 'idle',
              progress: 0,
              headers: [],
              sampleRows: [],
              mapping: {},
              inserted: 0,
              failed: 0,
              duplicates: 0,
              badRows: [],
              runId: null,
              error: null
            })}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}

export default CSVImporter;

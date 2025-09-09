'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { sniffHeaders, streamRows } from '@/src/lib/import/parser';
import { autoMap, applyMapping } from '@/src/lib/import/mapping';
import { normalizeRow } from '@/src/lib/import/validate';
import { executionHash } from '@/src/lib/import/hash';
import { insertBatch } from '@/src/lib/import/insertBatch';
import { ALL_PRESETS, bestPreset } from '@/src/lib/import/presets';
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
  detectedPreset: any | null;
  detectionScore: number;
  usePreset: boolean;
  timezoneOverride: string;
}

export function CSVImporter() {
  const { user, loading, supabase } = useAuth();

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('CSVImporter - Auth state:', { user: !!user, loading, userId: user?.id });
  }
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
    error: null,
    detectedPreset: null,
    detectionScore: 0,
    usePreset: false,
    timezoneOverride: 'local'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const handleFileSelect = useCallback(async (file: File) => {
    if (!user) return;

    setSelectedFile(file);
    setImportState(prev => ({ ...prev, stage: 'parsing', error: null }));

    try {
      // Step 1: Sniff headers and get sample rows
      const { headers, rows } = await sniffHeaders(file, 50);
      
      // Step 2: Detect preset
      const detection = bestPreset(ALL_PRESETS, headers, rows);
      const detected = detection.preset;
      
      console.log('Preset detection result:', { 
        headers, 
        sampleRows: rows.slice(0, 3), 
        detection, 
        detected: detected?.id 
      });
      
      // Step 3: Auto-map headers (fallback)
      const mapping = autoMap(headers);
      
      // Step 4: Determine default mode
      const usePreset = Boolean(detection.score >= 0.9 && detected?.transform);
      
      console.log('Import mode decision:', { 
        score: detection.score, 
        hasTransform: !!detected?.transform, 
        usePreset 
      });

      setImportState(prev => ({
        ...prev,
        stage: 'mapping',
        headers,
        sampleRows: rows,
        mapping,
        detectedPreset: detected,
        detectionScore: detection.score,
        usePreset
      }));
    } catch (error) {
      setImportState(prev => ({
        ...prev,
        stage: 'idle',
        error: `File parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [user]);

  const handleStartImport = useCallback(async () => {
    if (!user || !selectedFile) {
      console.error('Missing requirements for import:', { user: !!user, file: !!selectedFile });
      return;
    }

    // Check if we have either preset or manual mapping
    if (importState.usePreset && !importState.detectedPreset?.transform) {
      console.error('Preset mode selected but no transform available');
      return;
    }
    if (!importState.usePreset && !importState.mapping) {
      console.error('Manual mode selected but no mapping available');
      return;
    }

    console.log('Starting import with:', { 
      fileName: selectedFile.name, 
      fileSize: selectedFile.size,
      usePreset: importState.usePreset,
      preset: importState.detectedPreset?.id,
      hasTransform: !!importState.detectedPreset?.transform,
      mapping: importState.mapping,
      userId: user.id 
    });

    setImportState(prev => ({ ...prev, stage: 'importing', progress: 0 }));

    try {
      // Step A: Create import run
      const source = importState.usePreset ? importState.detectedPreset?.id || 'csv' : 'csv';
      
      // Debug: Check session before making database call
      const { data: { session } } = await supabase.auth.getSession();
      console.log('CSV Import - Session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id, 
        accessToken: session?.access_token ? 'present' : 'missing' 
      });
      
      // Ensure the session is properly set for database requests
      if (session) {
        await supabase.auth.setSession(session);
        console.log('CSV Import - Session set for database requests');
        
        // The session is now properly set, which should include the JWT token in all requests
        console.log('CSV Import - JWT token should now be included in all database requests');
      }
      
      const { data: runData, error: runError } = await supabase
        .from('import_runs')
        .insert({
          user_id: user.id,
          source,
          status: 'processing'
        })
        .select('id')
        .single();

      if (runError) throw runError;

      const runId = runData.id;
      let totalRows = 0;
      let batch: any[] = []; // Will contain executions_normalized records
      const badRows: BadRow[] = [];

      // Step B: Stream and process rows
      await new Promise<void>((resolve, reject) => {
        streamRows(
          selectedFile,
          async (row, rowNo) => {
            try {
              totalRows++;
              console.log(`Processing row ${rowNo}:`, row);
              
              let canonical: CanonicalTrade | null = null;

              if (importState.usePreset && importState.detectedPreset?.transform) {
                // Use preset transformation
                console.log('Processing row with preset:', { rowNo, row, preset: importState.detectedPreset.id });
                
                const res = importState.detectedPreset.transform(row, {
                  userId: user.id,
                  runId,
                  source: importState.detectedPreset.id,
                  tz: importState.timezoneOverride
                });

                console.log('Preset transform result:', { rowNo, res });

                if (res.ok) {
                  canonical = {
                    ...res.value,
                    user_id: user.id,
                    import_run_id: runId,
                    source: importState.detectedPreset.id,
                    row_hash: '',
                    raw_json: row
                  } as CanonicalTrade;
                  console.log('Created canonical trade:', { rowNo, canonical });
                } else if (res.skip) {
                  // Skip this row (e.g., fees, interest, cancels)
                  console.log('Skipping row:', { rowNo, reason: res.error || 'skip flag' });
                  return;
                } else {
                  // Validation error
                  console.log('Preset validation error:', { rowNo, error: res.error });
                  badRows.push({
                    rowNo,
                    errors: [res.error || 'Invalid row'],
                    data: row
                  });
                  return;
                }
              } else {
                // Use manual mapping
                const mappedRow = applyMapping(row, importState.mapping);
                const normalized = normalizeRow(mappedRow);
                
                if (!normalized.ok) {
                  badRows.push({
                    rowNo,
                    errors: normalized.errors,
                    data: row
                  });
                  return;
                }

                canonical = {
                  user_id: user.id,
                  asset_type: (normalized.value.asset_type as any) || 'equity',
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
                  import_run_id: runId,
                  row_hash: '',
                  raw_json: row
                };
              }

              if (canonical) {
                // Map canonical trade to executions_normalized schema
                const execution = {
                  user_id: canonical.user_id,
                  broker_account_id: null,
                  source_import_run_id: canonical.import_run_id,
                  instrument_type: canonical.asset_type === 'option' ? 'option' : 'equity',
                  symbol: canonical.symbol,
                  occ_symbol: canonical.asset_type === 'option' ? canonical.symbol : null,
                  futures_symbol: null,
                  side: canonical.side.toLowerCase(),
                  quantity: canonical.quantity,
                  price: canonical.price,
                  fees: canonical.fees || 0,
                  currency: 'USD',
                  timestamp: canonical.trade_time_utc,
                  venue: canonical.venue || 'Unknown',
                  order_id: null,
                  exec_id: null,
                  multiplier: 1,
                  expiry: canonical.expiry ? new Date(canonical.expiry).toISOString().split('T')[0] : null,
                  strike: canonical.strike || null,
                  option_type: canonical.option_type === 'CALL' ? 'C' : canonical.option_type === 'PUT' ? 'P' : null,
                  underlying: canonical.underlying || null,
                  notes: null,
                  unique_hash: await executionHash({
                    timestamp: canonical.trade_time_utc,
                    symbol: canonical.symbol,
                    side: canonical.side.toLowerCase(),
                    quantity: canonical.quantity,
                    price: canonical.price,
                    broker_account_id: null
                  })
                };
                
                batch.push(execution);
                console.log('Added execution to batch. Batch length:', batch.length);
                console.log('Execution data:', {
                  symbol: execution.symbol,
                  side: execution.side,
                  quantity: execution.quantity,
                  price: execution.price,
                  timestamp: execution.timestamp,
                  unique_hash: execution.unique_hash
                });

                // Insert batch when it reaches 100 rows (reduced from 1000 for smaller files)
                if (batch.length >= 100) {
                  console.log('Flushing batch of 100 rows');
                  const result = await insertBatch(supabase, batch);
                  console.log('Batch insert result:', result);
                  
                  setImportState(prev => ({
                    ...prev,
                    inserted: prev.inserted + result.inserted,
                    failed: prev.failed + result.failed.length,
                    duplicates: prev.duplicates + result.duplicates
                  }));

                  batch = [];
                  console.log('Batch cleared. New batch length:', batch.length);
                }
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
              console.log('Streaming completed. Final stats:', { 
                totalRows, 
                batchLength: batch.length, 
                badRowsLength: badRows.length,
                currentInserted: importState.inserted,
                currentFailed: importState.failed,
                currentDuplicates: importState.duplicates
              });

              // Step C: Flush remaining batch
              let finalInserted = importState.inserted;
              console.log('Final batch flush check - batch length:', batch.length);
              console.log('Current import state:', {
                inserted: importState.inserted,
                failed: importState.failed,
                duplicates: importState.duplicates
              });
              
              if (batch.length > 0) {
                console.log('🔄 Flushing remaining batch:', batch.length);
                console.log('📊 Sample execution record:', batch[0]);
                console.log('📋 All batch records:', batch.map((exec, i) => ({
                  index: i,
                  symbol: exec.symbol,
                  side: exec.side,
                  quantity: exec.quantity,
                  price: exec.price,
                  unique_hash: exec.unique_hash
                })));
                
                // Check Supabase client and auth before insert
                console.log('🔍 Pre-insert checks:');
                console.log('  - Supabase client:', !!supabase);
                console.log('  - User:', !!user);
                console.log('  - User ID:', user?.id);
                
                const result = await insertBatch(supabase, batch);
                console.log('✅ Final batch insert result:', result);
                
                finalInserted += result.inserted;
                setImportState(prev => ({
                  ...prev,
                  inserted: prev.inserted + result.inserted,
                  failed: prev.failed + result.failed.length,
                  duplicates: prev.duplicates + result.duplicates
                }));
                
                console.log('Updated import state after final batch:', {
                  inserted: importState.inserted + result.inserted,
                  failed: importState.failed + result.failed.length,
                  duplicates: importState.duplicates + result.duplicates
                });
              } else {
                console.log('No batch to flush - batch length is 0');
              }

              // Step D: Run matching engine to convert executions to trades
              if (finalInserted > 0) {
                console.log('Running matching engine for', finalInserted, 'imported executions');
                try {
                  const response = await fetch('/api/matching/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                  });
                  
                  if (response.ok) {
                    const matchResult = await response.json();
                    console.log('Matching engine result:', matchResult);
                  } else {
                    console.error('Matching engine API error:', response.status, response.statusText);
                  }
                } catch (matchError) {
                  console.error('Matching engine error:', matchError);
                  // Don't fail the import if matching fails
                }
              } else {
                console.log('No executions were inserted, skipping matching engine');
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
              console.error('Error in completion callback:', error);
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
  }, [user, importState.mapping, importState.inserted, importState.failed, importState.usePreset, importState.detectedPreset, importState.timezoneOverride, selectedFile, supabase]);

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
  if (loading || !supabase) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
      <h1 className="text-3xl font-bold text-foreground">CSV Import</h1>

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
            <p className="text-lg font-medium text-foreground mb-2">Upload CSV File</p>
            <p className="text-muted-foreground">Drag and drop or click to select a CSV file</p>
          </label>
        </div>
      )}

      {importState.stage === 'parsing' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Parsing CSV file...</p>
        </div>
      )}

      {importState.stage === 'mapping' && (
        <div className="space-y-6">
          {/* Preset Detection */}
          {importState.detectedPreset && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">Preset Detected</h3>
                  <p className="text-sm text-blue-700">
                    Detected: {importState.detectedPreset.label} (confidence {Math.round(importState.detectionScore * 100)}%)
                  </p>
                  <p className="text-sm font-medium text-green-700">
                    {importState.usePreset ? '✓ Using preset transformation' : '⚠ Using manual mapping'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setImportState(prev => ({ ...prev, usePreset: true }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      importState.usePreset
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    Use detected preset
                  </button>
                  <button
                    onClick={() => setImportState(prev => ({ ...prev, usePreset: false }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      !importState.usePreset
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    Map manually
                  </button>
                </div>
              </div>
              
              {/* Advanced Options */}
              <div className="border-t border-blue-200 pt-4">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-blue-700 hover:text-blue-900">
                    Advanced → Timezone
                  </summary>
                  <div className="mt-2">
                    <select
                      value={importState.timezoneOverride}
                      onChange={(e) => setImportState(prev => ({ ...prev, timezoneOverride: e.target.value }))}
                      className="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="local">Local timezone</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* Manual Mapping UI */}
          {!importState.usePreset && (
            <MappingUI
              headers={importState.headers}
              mapping={importState.mapping}
              onChange={(mapping) => setImportState(prev => ({ ...prev, mapping }))}
            />
          )}

          {/* Preview Table */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Preview (First 50 Rows)</h3>
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
            onClick={handleStartImport}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
          >
            Start Import {importState.usePreset ? `(${importState.detectedPreset?.label} preset)` : '(manual mapping)'}
          </button>
        </div>
      )}

      {importState.stage === 'importing' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Importing Trades</h3>
            <ProgressBar value={importState.progress} />
            <p className="text-sm text-muted-foreground mt-2">
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
                <h3 className="text-lg font-medium text-foreground">Failed Rows</h3>
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
            onClick={() => {
              setImportState({
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
                error: null,
                detectedPreset: null,
                detectionScore: 0,
                usePreset: false,
                timezoneOverride: 'local'
              });
              setSelectedFile(null);
            }}
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

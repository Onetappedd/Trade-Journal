/**
 * Server-side import utilities
 * Shared logic between API routes and client components
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import { parse } from 'csv-parse';
import { autoMap, applyMapping } from './mapping';
import { normalizeRow } from './validate';
import { rowHash } from './hash';
import { insertBatch } from './insertBatch';
import type { CanonicalTrade } from './types';

export interface ImportResult {
  runId: string;
  inserted: number;
  failed: number;
  duplicates: number;
}

export interface ProcessedRow {
  canonical?: CanonicalTrade;
  errors?: string[];
  rowNo: number;
}

/**
 * Process a single CSV row into canonical format
 */
export async function processRow(
  row: Record<string, unknown>,
  mapping: Record<string, string | null>,
  userId: string,
  runId: string,
  rowNo: number
): Promise<ProcessedRow> {
  try {
    // Apply mapping
    const mappedRow = applyMapping(row, mapping);
    
    // Normalize and validate
    const normalized = normalizeRow(mappedRow);
    
    if (!normalized.ok) {
      return {
        errors: normalized.errors,
        rowNo
      };
    }

    // Build canonical trade object
    const canonical: CanonicalTrade = {
      user_id: userId,
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

    // Generate row hash
    canonical.row_hash = await rowHash(canonical);

    return { canonical, rowNo };
  } catch (error) {
    return {
      errors: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      rowNo
    };
  }
}

/**
 * Stream and process CSV file
 */
export async function streamAndProcessCSV(
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  supabase: any
): Promise<ImportResult> {
  // Create ingestion run
  const { data: runData, error: runError } = await supabase
    .from('ingestion_runs')
    .insert({
      user_id: userId,
      source: 'csv-generic',
      file_name: fileName,
      row_count: 0
    })
    .select('id')
    .single();

  if (runError) throw runError;

  const runId = runData.id;
  let headers: string[] = [];
  let mapping: Record<string, string | null> = {};
  let batch: CanonicalTrade[] = [];
  let inserted = 0;
  let failed = 0;
  let duplicates = 0;
  let rowNo = 0;

  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    parser.on('readable', async function() {
      let record;
      while ((record = parser.read()) !== null) {
        rowNo++;

        // Capture headers from first row
        if (rowNo === 1) {
          headers = Object.keys(record);
          mapping = autoMap(headers);
        }

        // Process row
        const processed = await processRow(record, mapping, userId, runId, rowNo);

        if (processed.errors) {
          failed++;
        } else if (processed.canonical) {
          batch.push(processed.canonical);

          // Insert batch when it reaches 1000 rows
          if (batch.length >= 1000) {
            try {
              const result = await insertBatch(supabase, batch);
              inserted += result.inserted;
              failed += result.failed.length;
              duplicates += result.duplicates;
              batch = [];
            } catch (error) {
              console.error('Batch insert error:', error);
              failed += batch.length;
              batch = [];
            }
          }
        }
      }
    });

    parser.on('error', (error) => {
      reject(new Error(`CSV parsing error: ${error.message}`));
    });

    parser.on('end', async () => {
      try {
        // Flush remaining batch
        if (batch.length > 0) {
          const result = await insertBatch(supabase, batch);
          inserted += result.inserted;
          failed += result.failed.length;
          duplicates += result.duplicates;
        }

        // Update ingestion run with final counts
        await supabase
          .from('ingestion_runs')
          .update({
            row_count: rowNo,
            inserted_count: inserted,
            failed_count: failed
          })
          .eq('id', runId);

        resolve({ runId, inserted, failed, duplicates });
      } catch (error) {
        reject(error);
      }
    });

    // Start parsing
    parser.write(fileBuffer);
    parser.end();
  });
}

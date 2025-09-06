/**
 * CSV parsing utilities using papaparse
 * Handles file parsing for both header detection and streaming row processing
 */

import Papa from 'papaparse';

/**
 * Parse CSV file to extract headers and sample rows
 * @param file CSV file to parse
 * @param sampleRows Number of rows to sample (default: 200)
 * @returns Object containing unique headers and sample data rows
 */
export async function sniffHeaders(
  file: File, 
  sampleRows: number = 200
): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    const results: Record<string, unknown>[] = [];
    let headers: string[] = [];

    Papa.parse(file, {
      worker: true,
      header: true,
      skipEmptyLines: true,
      step: (result, parser) => {
        if (result.errors.length > 0) {
          reject(new Error(`Parse error: ${result.errors[0].message}`));
          return;
        }

        // Capture headers from first row
        if (results.length === 0) {
          headers = Object.keys(result.data as Record<string, unknown>);
        }

        results.push(result.data as Record<string, unknown>);

        // Stop after sampleRows
        if (results.length >= sampleRows) {
          parser.abort();
        }
      },
      complete: () => {
        resolve({
          headers: [...new Set(headers)], // Remove duplicates
          rows: results
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

/**
 * Stream CSV rows one by one for large file processing
 * @param file CSV file to parse
 * @param onRow Callback for each parsed row
 * @param onComplete Callback when parsing is complete
 * @param onError Callback for parsing errors
 */
export function streamRows(
  file: File,
  onRow: (row: Record<string, unknown>, rowNo: number) => void,
  onComplete: () => void,
  onError: (err: Error) => void
): void {
  let currentRowNo = 0;

  Papa.parse(file, {
    worker: true,
    header: true,
    skipEmptyLines: true,
    chunkSize: 1024 * 1024, // 1MB chunks
    step: (results, parser) => {
      if (results.errors.length > 0) {
        onError(new Error(`Parse error at row ${currentRowNo + 1}: ${results.errors[0].message}`));
        return;
      }

      currentRowNo++;
      onRow(results.data as Record<string, unknown>, currentRowNo);
    },
    complete: () => {
      onComplete();
    },
    error: (error) => {
      onError(new Error(`CSV parsing failed: ${error.message}`));
    }
  });
}

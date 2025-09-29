import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseWebullCsvHeaders, processWebullCsv } from '@/lib/imports/webull';
import { upsertTrades } from '@/lib/imports/upsertTrades';
import { logImportStart, logImportSummary, logImportErrors, logImportComplete, logImportError } from '@/lib/logger';
import { 
  executeImportTransaction, 
  createTransactionErrorResponse, 
  createTransactionSuccessResponse 
} from '@/lib/imports/transactionWrapper';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const fileId = `import-${Date.now()}`;
  let userId = '';
  
  try {
    console.log('=== WEBULL CSV FINAL START ===');
    
    // Get the file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('File received:', file.name, file.size);
    
    // Create Supabase client for authentication
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Create service role client for database operations (bypasses RLS)
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    userId = user.id;
    console.log('User authenticated:', user.id);
    
    // Log import start
    logImportStart(fileId, userId, file.name);
    
    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log('CSV parsed, lines:', lines.length);
    console.log('Headers:', headers);
    
    // Create field mapping
    const fieldMap = parseWebullCsvHeaders(headers);
    console.log('Field map:', fieldMap);
    
    // Process entire CSV with comprehensive filtering and telemetry
    const { trades, summary, skippedRows } = processWebullCsv(csvText, fieldMap);
    
    console.log('Processing complete:', summary);
    console.log('Total trades found:', trades.length);
    console.log('Total skipped rows:', skippedRows.length);
    
    // Log import summary
    logImportSummary(fileId, userId, {
      totalRows: summary.totalRows,
      parsedRows: summary.parsedRows,
      filledRows: summary.filledRows,
      importedRows: summary.importedRows,
      skipped: summary.skipped
    });
    
    // Log errors if any
    if (summary.errors.length > 0) {
      logImportErrors(fileId, userId, summary.errors);
    }
    
    // Execute the import in a transaction-safe manner
    console.log('Starting transaction for', trades.length, 'valid trades');
    
    const transactionResult = await executeImportTransaction(
      supabaseAdmin,
      trades,
      user.id,
      fileId,
      // Success callback
      (result) => {
        logImportComplete(fileId, userId, {
          inserted: result.inserted,
          duplicatesSkipped: result.duplicatesSkipped,
          errors: result.errors
        });
      },
      // Error callback
      (error) => {
        logImportError(fileId, userId, error, 'transaction-failure');
      }
    );
    
    if (!transactionResult.success) {
      // Return transaction error response
      return NextResponse.json(
        createTransactionErrorResponse(
          new Error(transactionResult.error || 'Unknown transaction error'),
          summary,
          skippedRows
        ),
        { status: 500 }
      );
    }
    
    // Return transaction success response
    return NextResponse.json(
      createTransactionSuccessResponse(
        transactionResult.result!,
        summary,
        skippedRows
      )
    );

  } catch (error: any) {
    console.error('Webull CSV Final error:', error);
    
    // Log import error
    if (userId) {
      logImportError(fileId, userId, error, 'csv-webull-final');
    }
    
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error.message 
    }, { status: 500 });
  }
}

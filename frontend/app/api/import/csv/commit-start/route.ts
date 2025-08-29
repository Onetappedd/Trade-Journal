import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validation schema
const CommitStartSchema = z.object({
  uploadToken: z.string(),
  mapping: z.record(z.string()),
  options: z.object({
    tz: z.string().optional(),
    currency: z.string().optional(),
  }).optional(),
});

// Canonical field types
type CanonicalField = 
  | 'timestamp' | 'symbol' | 'side' | 'quantity' | 'price' | 'fees' 
  | 'currency' | 'venue' | 'order_id' | 'exec_id' | 'instrument_type'
  | 'expiry' | 'strike' | 'option_type' | 'multiplier' | 'underlying';

// Required fields for validation
const REQUIRED_FIELDS: CanonicalField[] = ['timestamp', 'symbol', 'side', 'quantity', 'price'];
const OPTION_REQUIRED_FIELDS: CanonicalField[] = ['expiry', 'strike', 'option_type'];

// File type detection
function detectFileType(filename: string, contentType: string): 'csv' | 'tsv' | 'xlsx' | 'xls' | 'xml' {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'xml' || contentType.includes('xml')) return 'xml';
  if (ext === 'xlsx' || contentType.includes('spreadsheet')) return 'xlsx';
  if (ext === 'xls') return 'xls';
  if (ext === 'tsv' || contentType.includes('tab-separated')) return 'tsv';
  return 'csv';
}

// Count total rows in file
async function countTotalRows(buffer: Buffer, fileType: string): Promise<number> {
  switch (fileType) {
    case 'csv':
    case 'tsv':
      return new Promise((resolve, reject) => {
        const delimiter = fileType === 'tsv' ? '\t' : ',';
        const parser = parse({
          delimiter,
          skip_empty_lines: true,
          max_record_size: 1024 * 1024,
        });

        let count = 0;
        parser.on('readable', () => {
          while (parser.read()) {
            count++;
          }
        });

        parser.on('error', reject);
        parser.on('end', () => resolve(count));
        parser.write(buffer);
        parser.end();
      });

    case 'xlsx':
    case 'xls':
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      return range.e.r; // Number of rows (0-indexed, so add 1 for header)

    case 'xml':
      const xmlString = buffer.toString('utf-8');
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseAttributeValue: true,
      });

      const parsed = parser.parse(xmlString);
      
      // Count trades in IBKR Flex format
      if (parsed.FlexQueryResponse?.Trades?.Trade) {
        const trades = parsed.FlexQueryResponse.Trades.Trade;
        return Array.isArray(trades) ? trades.length : 1;
      }
      
      return 0;

    default:
      return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = CommitStartSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { uploadToken, mapping, options } = validation.data;

    // Validate mapping has required fields
    for (const field of REQUIRED_FIELDS) {
      if (!mapping[field]) {
        return NextResponse.json({ error: `Missing required field mapping: ${field}` }, { status: 400 });
      }
    }

    // Get temp upload details
    const { data: tempUpload, error: uploadError } = await supabase
      .from('temp_uploads')
      .select('*')
      .eq('upload_token', uploadToken)
      .eq('user_id', user.id)
      .single();

    if (uploadError || !tempUpload) {
      return NextResponse.json({ error: 'Invalid upload token' }, { status: 400 });
    }

    // Check if upload is still valid (within 24 hours)
    const uploadAge = Date.now() - new Date(tempUpload.created_at).getTime();
    if (uploadAge > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Upload token expired' }, { status: 400 });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('temp-uploads')
      .download(tempUpload.file_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const fileType = detectFileType(tempUpload.filename, tempUpload.content_type);

    // Count total rows
    const totalRows = await countTotalRows(buffer, fileType);
    
    if (totalRows === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    // Create import run
    const { data: importRun, error: runError } = await supabase
      .from('import_runs')
      .insert({
        user_id: user.id,
        broker_account_id: null,
        source: 'csv',
        status: 'processing',
        started_at: new Date().toISOString(),
        summary: {
          total: totalRows,
          added: 0,
          duplicates: 0,
          errors: 0,
          file_type: fileType,
          filename: tempUpload.filename
        }
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating import run:', runError);
      return NextResponse.json({ error: 'Failed to create import run' }, { status: 500 });
    }

    // Create import job
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        import_run_id: importRun.id,
        user_id: user.id,
        upload_ref: tempUpload.file_path,
        mapping: mapping,
        options: options || {},
        total_rows: totalRows,
        processed_rows: 0,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating import job:', jobError);
      return NextResponse.json({ error: 'Failed to create import job' }, { status: 500 });
    }

    return NextResponse.json({
      runId: importRun.id,
      jobId: importJob.id,
      totalRows: totalRows,
      fileType: fileType,
      message: 'Import job started successfully'
    });

  } catch (error) {
    console.error('Commit start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

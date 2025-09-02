import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import { randomBytes } from 'crypto';
import { withTelemetry } from '@/lib/observability/withTelemetry';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// File type detection
function detectFileType(filename: string, contentType: string): 'csv' | 'tsv' | 'xlsx' | 'xls' | 'xml' {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'xml' || contentType.includes('xml')) return 'xml';
  if (ext === 'xlsx' || contentType.includes('spreadsheet')) return 'xlsx';
  if (ext === 'xls') return 'xls';
  if (ext === 'tsv' || contentType.includes('tab-separated')) return 'tsv';
  return 'csv';
}

// Parse CSV/TSV sample using Papa Parse (like the old working implementation)
async function parseCsvSample(buffer: Buffer, fileType: string): Promise<{ headers: string[], rows: any[] }> {
  return new Promise((resolve, reject) => {
    const csvString = buffer.toString('utf-8');
    const delimiter = fileType === 'tsv' ? '\t' : ',';
    
           Papa.parse(csvString, {
         delimiter,
         header: true,
         skipEmptyLines: true,
         preview: 1000, // Parse first 1000 rows for sample
         complete: (results: any) => {
        const headers = (results.meta?.fields || []) as string[];
        const rows = (results.data || []) as any[];
        resolve({ headers, rows });
      },
      error: (error: any) => reject(error),
    });
  });
}

// Parse Excel sample
function parseExcelSample(buffer: Buffer): { headers: string[], rows: any[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = jsonData[0] as string[];
     const rows = jsonData.slice(1, 1001).map((row: any) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return { headers, rows };
}

// Parse IBKR Flex XML sample
function parseFlexXmlSample(buffer: Buffer): { headers: string[], rows: any[] } {
  const xmlString = buffer.toString('utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
  });

  const parsed = parser.parse(xmlString);
  
  // Extract trades from IBKR Flex format
  const trades: any[] = [];
  
  // Handle different IBKR Flex structures
  if (parsed.FlexQueryResponse?.Trades?.Trade) {
    const tradeArray = Array.isArray(parsed.FlexQueryResponse.Trades.Trade) 
      ? parsed.FlexQueryResponse.Trades.Trade 
      : [parsed.FlexQueryResponse.Trades.Trade];
    
         tradeArray.slice(0, 1000).forEach((trade: any) => {
      trades.push({
        dateTime: trade.dateTime || trade['@_dateTime'],
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        fees: trade.fees,
        currency: trade.currency,
        exchange: trade.exchange,
        orderID: trade.orderID,
        execID: trade.execID,
        instrumentType: trade.instrumentType,
        expiry: trade.expiry,
        strike: trade.strike,
        optionType: trade.optionType,
        multiplier: trade.multiplier,
        underlying: trade.underlying,
      });
    });
  }

  // Handle OptionEAE nodes
  if (parsed.FlexQueryResponse?.OptionEAE?.OptionEAE) {
    const optionArray = Array.isArray(parsed.FlexQueryResponse.OptionEAE.OptionEAE)
      ? parsed.FlexQueryResponse.OptionEAE.OptionEAE
      : [parsed.FlexQueryResponse.OptionEAE.OptionEAE];
    
         optionArray.slice(0, 1000).forEach((option: any) => {
      trades.push({
        dateTime: option.dateTime || option['@_dateTime'],
        symbol: option.symbol,
        side: option.side,
        quantity: option.quantity,
        price: option.price,
        fees: option.fees,
        currency: option.currency,
        exchange: option.exchange,
        orderID: option.orderID,
        execID: option.execID,
        instrumentType: 'option',
        expiry: option.expiry,
        strike: option.strike,
        optionType: option.optionType,
        multiplier: option.multiplier,
        underlying: option.underlying,
      });
    });
  }

  const headers = trades.length > 0 ? Object.keys(trades[0]) : [];
  return { headers, rows: trades };
}

// Generate mapping guess based on headers and broker hint
function generateMappingGuess(headers: string[], brokerHint?: string): Record<string, string | undefined> {
  const guess: Record<string, string | undefined> = {};
  
  // Auto-detect Webull options format
  if (headers.includes('Name') && headers.includes('Filled Time') && headers.includes('Side')) {
    // This looks like Webull options - apply specific mapping
    guess.timestamp = 'Filled Time';
    guess.symbol = 'Name';
    guess.side = 'Side';
    guess.quantity = 'Filled';
    guess.price = 'Avg Price';
    guess.fees = 'Fees';
    
    // For options, we'll extract additional info from the Name column
    // The Name column contains: QQQ250822P00563000 (Symbol + Expiry + Type + Strike)
    console.log('Auto-detected Webull options format');
    return guess;
  }
  
  const headerMap: Record<string, string[]> = {
    timestamp: ['time', 'datetime', 'date', 'timestamp', 'trade_time', 'execution_time', 'filled_time'],
    symbol: ['symbol', 'ticker', 'instrument', 'security', 'name'],
    side: ['side', 'action', 'buy_sell', 'type'],
    quantity: ['quantity', 'qty', 'shares', 'size', 'amount', 'filled'],
    price: ['price', 'execution_price', 'fill_price', 'trade_price', 'avg_price'],
    fees: ['fees', 'commission', 'commission_and_fees', 'total_fees'],
    currency: ['currency', 'curr'],
    venue: ['venue', 'exchange', 'market'],
    order_id: ['order_id', 'orderid', 'order_number', 'orderid'],
    exec_id: ['exec_id', 'execid', 'execution_id', 'execid'],
    instrument_type: ['instrument_type', 'type', 'security_type', 'instrumenttype'],
    expiry: ['expiry', 'expiration', 'exp_date'],
    strike: ['strike', 'strike_price'],
    option_type: ['option_type', 'put_call', 'optiontype'],
    multiplier: ['multiplier', 'contract_size'],
    underlying: ['underlying', 'underlying_symbol'],
  };

  // Apply broker-specific mappings
  const brokerMappings: Record<string, Record<string, string[]>> = {
    robinhood: {
      timestamp: ['Time'],
      symbol: ['Symbol'],
      side: ['Side'],
      quantity: ['Quantity'],
      price: ['Price'],
      fees: ['Fees'],
    },
    ibkr: {
      timestamp: ['dateTime', 'date'],
      symbol: ['symbol'],
      side: ['side'],
      quantity: ['quantity'],
      price: ['price'],
      fees: ['fees'],
      currency: ['currency'],
      exchange: ['exchange'],
      order_id: ['orderID'],
      exec_id: ['execID'],
      instrument_type: ['instrumentType'],
      expiry: ['expiry'],
      strike: ['strike'],
      option_type: ['optionType'],
      multiplier: ['multiplier'],
      underlying: ['underlying'],
    },
    fidelity: {
      timestamp: ['Date/Time'],
      symbol: ['Symbol'],
      side: ['Action'],
      quantity: ['Quantity'],
      price: ['Price'],
      fees: ['Commission'],
    },
  };

  // Use broker-specific mapping if available
  const mappingSource = brokerHint && brokerMappings[brokerHint.toLowerCase()] 
    ? brokerMappings[brokerHint.toLowerCase()] 
    : headerMap;

  // Match headers to canonical fields
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const [canonicalField, possibleHeaders] of Object.entries(mappingSource)) {
      if (!guess[canonicalField]) {
        const match = possibleHeaders.find(h => 
          h.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedHeader ||
          header.toLowerCase().includes(h.toLowerCase()) ||
          h.toLowerCase().includes(header.toLowerCase())
        );
        
        if (match) {
          guess[canonicalField] = header;
        }
      }
    }
  });

  return guess;
}

async function csvInitHandlerInternal(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const supabase = getServerSupabase();
  
  try {
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userAuthTime = Date.now();
    console.log(`[CSV Init] User auth: ${userAuthTime - startTime}ms`);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const formParseTime = Date.now();
    console.log(`[CSV Init] Form parse: ${formParseTime - userAuthTime}ms`);

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Detect file type
    const fileType = detectFileType(file.name, file.type);
    const fileTypeTime = Date.now();
    console.log(`[CSV Init] File type detection: ${fileTypeTime - formParseTime}ms`);

    // Parse sample data
    const buffer = Buffer.from(await file.arrayBuffer());
    let sampleRows: any[] = [];
    let headers: string[] = [];

    const parseStartTime = Date.now();
    
    try {
      if (fileType === 'csv' || fileType === 'tsv') {
        const result = await parseCsvSample(buffer, fileType);
        sampleRows = result.rows;
        headers = result.headers;
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const result = await parseExcelSample(buffer);
        sampleRows = result.rows;
        headers = result.headers;
      } else if (fileType === 'xml') {
        const result = await parseFlexXmlSample(buffer);
        sampleRows = result.rows;
        headers = result.headers;
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse file',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 400 });
    }

    const parseTime = Date.now();
    console.log(`[CSV Init] File parsing: ${parseTime - parseStartTime}ms`);

    // Generate mapping guess
    const guess = generateMappingGuess(headers, fileType);
    const guessTime = Date.now();
    console.log(`[CSV Init] Mapping guess: ${guessTime - parseTime}ms`);

    // Generate upload token
    const uploadToken = randomBytes(16).toString('hex');
    const tempKey = `temp/${user.id}/${uploadToken}`;

    // Upload to storage
    const storageStartTime = Date.now();
    console.log(`[CSV Init] Starting storage upload to: ${tempKey}`);
    console.log(`[CSV Init] User ID: ${user.id}, Upload Token: ${uploadToken}`);
    console.log(`[CSV Init] Full storage path: imports/${tempKey}`);
    
    const { error: storageError } = await supabase.storage
      .from('imports')
      .upload(tempKey, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (storageError) {
      console.error('Storage error:', {
        userId: user.id,
        fileName: file.name,
        error: storageError.message,
        storageTime: Date.now() - storageStartTime
      });
      return NextResponse.json({ error: 'Failed to store file', details: storageError.message }, { status: 500 });
    }

    const storageTime = Date.now();
    console.log(`[CSV Init] Storage upload: ${storageTime - storageStartTime}ms`);

    // Store metadata in database
    const dbStartTime = Date.now();
    console.log(`[CSV Init] Starting database insert`);
    
    const { error: dbError } = await supabase.from('temp_uploads').insert({
      token: uploadToken,
      user_id: user.id,
      filename: file.name,
      file_type: fileType,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    if (dbError) {
      console.error('Database error:', {
        userId: user.id,
        fileName: file.name,
        error: dbError.message,
        dbTime: Date.now() - dbStartTime
      });
      return NextResponse.json({ 
        error: 'Failed to store file metadata',
        details: dbError.message 
      }, { status: 500 });
    }

    const dbTime = Date.now();
    console.log(`[CSV Init] Database insert: ${dbTime - dbStartTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`[CSV Init] Total processing time: ${totalTime}ms`);

    return NextResponse.json({
      uploadToken,
      sampleRows,
      headers,
      guess,
      fileType,
    });
  } catch (error) {
    console.error('Unexpected error in CSV init:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function csvInitHandler(request: NextRequest): Promise<NextResponse> {
  // Add timeout protection - increased to 45 seconds for large files
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 45000); // 45 second timeout
  });

  try {
    const result = await Promise.race([
      csvInitHandlerInternal(request),
      timeoutPromise
    ]);
    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      console.error('CSV init timeout:', {
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        error: 'Request timeout - file processing took too long',
        details: 'Please try with a smaller file or contact support'
      }, { status: 408 });
    }
    throw error;
  }
}

// Export with telemetry wrapper
export const POST = withTelemetry(csvInitHandler, {
  route: '/api/import/csv/init',
  redactFields: ['raw_payload', 'csv_content', 'file_content'],
  maxPayloadSize: 10 * 1024 * 1024 // 10MB
});

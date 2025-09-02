import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { parse } from 'csv-parse';
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

// Parse CSV/TSV sample
async function parseCsvSample(buffer: Buffer, delimiter: string = ','): Promise<{ headers: string[], rows: any[] }> {
  return new Promise((resolve, reject) => {
    const parser = parse({
      delimiter,
      columns: true,
      skip_empty_lines: true,
      max_record_size: 1024 * 1024, // 1MB max record
    });

    const rows: any[] = [];
    let headers: string[] = [];

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) && rows.length < 50) {
        if (rows.length === 0) {
          headers = Object.keys(record);
        }
        rows.push(record);
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve({ headers, rows }));
    parser.write(buffer);
    parser.end();
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
  const rows = jsonData.slice(1, 51).map((row: any) => {
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
    
    tradeArray.slice(0, 50).forEach((trade: any) => {
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
    
    optionArray.slice(0, 50).forEach((option: any) => {
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
  
     const headerMap: Record<string, string[]> = {
     timestamp: ['time', 'datetime', 'date', 'timestamp', 'trade_time', 'execution_time'],
     symbol: ['symbol', 'ticker', 'instrument', 'security'],
     side: ['side', 'action', 'buy_sell', 'type'],
     quantity: ['quantity', 'qty', 'shares', 'size', 'amount'],
     price: ['price', 'execution_price', 'fill_price', 'trade_price'],
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

async function csvInitHandler(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brokerHint = formData.get('broker_hint') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = detectFileType(file.name, file.type);

    // Log file upload with sanitized data
    console.log('CSV init upload:', {
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      fileType,
      brokerHint,
      timestamp: new Date().toISOString()
    });

    // Parse sample data based on file type
    let headers: string[] = [];
    let rows: any[] = [];

    try {
      switch (fileType) {
        case 'csv':
          ({ headers, rows } = await parseCsvSample(buffer, ','));
          break;
        case 'tsv':
          ({ headers, rows } = await parseCsvSample(buffer, '\t'));
          break;
        case 'xlsx':
        case 'xls':
          ({ headers, rows } = parseExcelSample(buffer));
          break;
        case 'xml':
          ({ headers, rows } = parseFlexXmlSample(buffer));
          break;
        default:
          return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
      }
    } catch (parseError) {
      console.error('Parse error:', {
        userId: user.id,
        fileName: file.name,
        fileType,
        error: parseError instanceof Error ? parseError.message : 'Unknown error'
      });
      return NextResponse.json({ error: 'Failed to parse file' }, { status: 400 });
    }

    if (headers.length === 0) {
      return NextResponse.json({ error: 'No valid headers found' }, { status: 400 });
    }

    // Generate mapping guess
    const guess = generateMappingGuess(headers, brokerHint);

    // Generate upload token
    const uploadToken = randomBytes(32).toString('hex');

    // Store file in temporary storage (15 minutes)
    const tempKey = `temp/${user.id}/${uploadToken}`;
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
        error: storageError.message
      });
      return NextResponse.json({ error: 'Failed to store file' }, { status: 500 });
    }

    // Store metadata in database for cleanup
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
        details: dbError.details,
        hint: dbError.hint
      });
      return NextResponse.json({ 
        error: 'Failed to store file metadata',
        details: dbError.message 
      }, { status: 500 });
    }

    // Log successful initialization
    console.log('CSV init completed:', {
      userId: user.id,
      fileName: file.name,
      uploadToken: uploadToken.substring(0, 8) + '...',
      headerCount: headers.length,
      sampleRowCount: rows.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      sampleRows: rows,
      headers,
      guess,
      uploadToken,
      fileType,
    });
  } catch (error) {
    console.error('Unexpected error in CSV init:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export with telemetry wrapper
export const POST = withTelemetry(csvInitHandler, {
  route: '/api/import/csv/init',
  redactFields: ['raw_payload', 'csv_content', 'file_content'],
  maxPayloadSize: 10 * 1024 * 1024 // 10MB
});

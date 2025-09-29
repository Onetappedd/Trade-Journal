import { ImportError, ImportErrorCode, createImportError, logImportError } from './errors';

export interface WebullTradeDTO {
  externalId: string;
  broker: 'webull';
  symbolRaw: string;
  symbol: string;
  assetType: 'option' | 'equity';
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  commission: number;
  status: 'filled' | 'cancelled' | 'other';
  executedAt: string; // ISO UTC
  meta: {
    rowIndex: number;
    raw: Record<string, string>;
    source: 'webull-csv';
  };
}

export interface WebullOptionInfo {
  underlying: string;
  expiry: string; // YYYY-MM-DD format
  type: 'C' | 'P';
  strike: number;
}

export interface WebullImportSummary {
  totalRows: number;
  headerRows: number;
  parsedRows: number;
  filledRows: number;
  importedRows: number;
  skipped: {
    cancelled: number;
    zeroQty: number;
    zeroPrice: number;
    badDate: number;
    parseError: number;
  };
  errors: ImportError[];
  errorSummary: Record<ImportErrorCode, number>;
}

export interface WebullSkippedRow {
  rowIndex: number;
  reason: string;
  symbolRaw: string;
  status: string;
  filled: string;
  price: string;
}

export class WebullParseError extends Error {
  constructor(
    public rowIndex: number,
    public reason: string,
    public raw: Record<string, string>
  ) {
    super(`Webull CSV parse error at row ${rowIndex}: ${reason}`);
    this.name = 'WebullParseError';
  }
}

/**
 * Normalizes CSV headers by trimming, lowercasing, and removing spaces/special chars
 */
function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[#\s]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Creates a typed field map from normalized headers
 */
function createFieldMap(headers: string[]): Record<string, string> {
  const normalizedHeaders = headers.map(normalizeHeader);
  const fieldMap: Record<string, string> = {};
  
  // Map expected fields to their normalized header names
  const expectedFields = [
    'symbol', 'action', 'status', 'filled', 'filledqty', 'quantity', 
    'price', 'avgprice', 'placedtime', 'executedtime', 'orderid', 
    'commission', 'fees', 'notes'
  ];
  
  for (const expectedField of expectedFields) {
    const normalizedField = normalizeHeader(expectedField);
    const headerIndex = normalizedHeaders.indexOf(normalizedField);
    if (headerIndex !== -1) {
      fieldMap[expectedField] = headers[headerIndex];
    }
  }
  
  // Add fallback mappings for common Webull CSV variations
  const fallbackMappings = [
    { expected: 'symbol', alternatives: ['Symbol', 'SYMBOL', 'symbol', 'Ticker', 'TICKER'] },
    { expected: 'action', alternatives: ['Action', 'ACTION', 'action', 'Side', 'SIDE', 'Buy/Sell', 'BUY/SELL'] },
    { expected: 'status', alternatives: ['Status', 'STATUS', 'status', 'Order Status', 'ORDER STATUS'] },
    { expected: 'filled', alternatives: ['Filled', 'FILLED', 'filled', 'Filled Qty', 'FILLED QTY', 'FilledQty'] },
    { expected: 'quantity', alternatives: ['Quantity', 'QUANTITY', 'quantity', 'Qty', 'QTY', 'Shares', 'SHARES'] },
    { expected: 'price', alternatives: ['Price', 'PRICE', 'price', 'Executed Price', 'EXECUTED PRICE', 'Avg Price', 'AVG PRICE'] },
    { expected: 'executedtime', alternatives: ['Executed Time', 'EXECUTED TIME', 'executedtime', 'ExecutedTime', 'Date', 'DATE', 'Time', 'TIME'] },
    { expected: 'commission', alternatives: ['Commission', 'COMMISSION', 'commission', 'Comm', 'COMM'] },
    { expected: 'fees', alternatives: ['Fees', 'FEES', 'fees', 'Fee', 'FEE'] }
  ];
  
  // Apply fallback mappings for missing fields
  for (const mapping of fallbackMappings) {
    if (!fieldMap[mapping.expected]) {
      for (const alternative of mapping.alternatives) {
        const normalizedAlternative = normalizeHeader(alternative);
        const headerIndex = normalizedHeaders.indexOf(normalizedAlternative);
        if (headerIndex !== -1) {
          fieldMap[mapping.expected] = headers[headerIndex];
          break;
        }
      }
    }
  }
  
  return fieldMap;
}

/**
 * Extracts quantity from multiple possible fields
 */
export function extractQuantity(row: Record<string, string>, fieldMap: Record<string, string>): number {
  const filled = row[fieldMap.filled] || '';
  const filledQty = row[fieldMap.filledqty] || '';
  const quantity = row[fieldMap.quantity] || '';
  
  // Try filled first, then filledqty, then quantity
  const qtyStr = filled || filledQty || quantity;
  const parsed = parseFloat(qtyStr);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Cleans price string by removing @, $, commas, spaces
 */
export function cleanPrice(priceStr: string): number {
  const cleaned = priceStr
    .replace(/[@$,]/g, '')
    .trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parses various date formats and converts to UTC ISO string
 */
export function parseDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') {
    return new Date().toISOString();
  }
  
  // Try multiple date formats
  const formats = [
    // MM/DD/YYYY HH:mm:ss EDT
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+EDT$/,
    // MM/DD/YYYY HH:mm EDT  
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+EDT$/,
    // YYYY-MM-DD HH:mm:ss
    /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year, month, day, hour = 0, minute = 0, second = 0;
      
      if (format === formats[0] || format === formats[1]) {
        // MM/DD/YYYY format
        [, month, day, year, hour, minute, second] = match;
      } else if (format === formats[2]) {
        // YYYY-MM-DD format
        [, year, month, day, hour, minute, second] = match;
      } else if (format === formats[3]) {
        // MM/DD/YYYY (date only)
        [, month, day, year] = match;
      }
      
      // Create date in US/Eastern timezone
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      
      // Convert to UTC ISO string
      return date.toISOString();
    }
  }
  
  // Fallback to current time
  return new Date().toISOString();
}

/**
 * Decodes Webull option symbol format: TSLA250822C00325000
 * Returns parsed option information or null if not a valid option
 */
export function decodeWebullOptionSymbol(symbolRaw: string): WebullOptionInfo | null {
  // Regex to match Webull option format: ^([A-Z]+)(\d{6})([CP])(\d{8})$
  const optionRegex = /^([A-Z]+)(\d{6})([CP])(\d{8})$/;
  const match = symbolRaw.match(optionRegex);
  
  if (!match) {
    return null; // Not a valid option format
  }
  
  const [, underlying, dateStr, type, strikeStr] = match;
  
  // Validate minimum underlying length (at least 2 characters)
  if (underlying.length < 2) {
    return null;
  }
  
  try {
    // Parse YYMMDD format to YYYY-MM-DD
    const year = parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4));
    const day = parseInt(dateStr.substring(4, 6));
    
    // Handle 2-digit year (assume 20xx for years 00-99)
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    
    // Validate date components
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}`);
    }
    if (day < 1 || day > 31) {
      throw new Error(`Invalid day: ${day}`);
    }
    
    // Create date and validate it's a real date
    const expiryDate = new Date(fullYear, month - 1, day);
    if (expiryDate.getFullYear() !== fullYear || 
        expiryDate.getMonth() !== month - 1 || 
        expiryDate.getDate() !== day) {
      throw new Error(`Invalid date: ${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
    }
    
    // Parse strike price (divide by 1000)
    const strike = parseFloat(strikeStr) / 1000;
    
    // Validate strike is reasonable (between 0.001 and 10000)
    if (strike <= 0 || strike > 10000) {
      throw new Error(`Invalid strike price: ${strike}`);
    }
    
    return {
      underlying,
      expiry: `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      type: type as 'C' | 'P',
      strike
    };
    
  } catch (error) {
    // If parsing fails, treat as equity
    return null;
  }
}

/**
 * Determines asset type based on symbol
 */
function determineAssetType(symbol: string): 'option' | 'equity' {
  const optionInfo = decodeWebullOptionSymbol(symbol);
  return optionInfo ? 'option' : 'equity';
}

/**
 * Normalizes symbol for internal use
 */
function normalizeSymbol(symbol: string, assetType: 'option' | 'equity'): string {
  if (assetType === 'option') {
    const optionInfo = decodeWebullOptionSymbol(symbol);
    if (optionInfo) {
      // Format: TSLA 2025-08-22 325C
      return `${optionInfo.underlying} ${optionInfo.expiry} ${optionInfo.strike}${optionInfo.type}`;
    }
  }
  return symbol;
}

/**
 * Generates external ID from available fields
 */
function generateExternalId(row: Record<string, string>, fieldMap: Record<string, string>, symbol: string, side: string, price: number, quantity: number): string {
  const orderId = row[fieldMap.orderid];
  if (orderId && orderId.trim() !== '') {
    return orderId.trim();
  }
  
  // Generate hash from symbol + time + side + price + qty
  const timeStr = row[fieldMap.executedtime] || row[fieldMap.placedtime] || '';
  const hashInput = `${symbol}_${timeStr}_${side}_${price}_${quantity}`;
  return `webull_${hashInput.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

/**
 * Parses a single Webull CSV row into a normalized trade DTO
 */
export function parseWebullCsvRow(
  row: Record<string, string>,
  fieldMap: Record<string, string>,
  rowIndex: number
): WebullTradeDTO {
  try {
    // Debug logging for first few rows
    if (rowIndex <= 3) {
      console.log(`[DEBUG] Parsing row ${rowIndex}:`, {
        fieldMap,
        row,
        symbolRaw: row[fieldMap.symbol],
        action: row[fieldMap.action],
        status: row[fieldMap.status]
      });
    }
    
    // Extract basic fields
    const symbolRaw = row[fieldMap.symbol] || '';
    const action = (row[fieldMap.action] || '').toLowerCase();
    const status = (row[fieldMap.status] || '').toLowerCase();
    
    if (!symbolRaw) {
      const error = createImportError(rowIndex, 'MISSING_REQUIRED', symbolRaw, { 
        field: 'symbol', 
        row, 
        fieldMap,
        availableFields: Object.keys(row),
        message: `Symbol field not found. Available fields: ${Object.keys(row).join(', ')}`
      });
      logImportError(error, 'parseWebullCsvRow');
      throw new WebullParseError(rowIndex, `Missing symbol field. Available fields: ${Object.keys(row).join(', ')}`, row);
    }
    
    if (!action || !['buy', 'sell'].includes(action)) {
      const error = createImportError(rowIndex, 'PARSE_ERROR', symbolRaw, { 
        field: 'action', 
        value: action, 
        row,
        fieldMap,
        availableFields: Object.keys(row),
        message: `Action field not found or invalid. Available fields: ${Object.keys(row).join(', ')}`
      });
      logImportError(error, 'parseWebullCsvRow');
      throw new WebullParseError(rowIndex, `Invalid action: ${action}. Available fields: ${Object.keys(row).join(', ')}`, row);
    }
    
    // Extract quantity
    const quantity = extractQuantity(row, fieldMap);
    if (quantity <= 0) {
      const error = createImportError(rowIndex, 'ZERO_QTY', symbolRaw, { quantity, row });
      logImportError(error, 'parseWebullCsvRow');
      throw new WebullParseError(rowIndex, `Invalid quantity: ${quantity}`, row);
    }
    
    // Extract price
    const priceStr = row[fieldMap.price] || row[fieldMap.avgprice] || '0';
    const price = cleanPrice(priceStr);
    if (price <= 0) {
      const error = createImportError(rowIndex, 'BAD_PRICE', symbolRaw, { price, priceStr, row });
      logImportError(error, 'parseWebullCsvRow');
      throw new WebullParseError(rowIndex, `Invalid price: ${price}`, row);
    }
    
    // Check if filled
    const isFilled = status === 'filled';
    if (!isFilled) {
      const error = createImportError(rowIndex, 'CANCELLED', symbolRaw, { status, row });
      logImportError(error, 'parseWebullCsvRow');
      throw new WebullParseError(rowIndex, `Trade not filled: ${status}`, row);
    }
    
    // Extract fees and commission
    const fees = parseFloat(row[fieldMap.fees] || '0') || 0;
    const commission = parseFloat(row[fieldMap.commission] || '0') || 0;
    
    // Parse execution time
    const executedTime = row[fieldMap.executedtime] || row[fieldMap.placedtime] || '';
    if (!executedTime || executedTime.trim() === '') {
      const error = createImportError(rowIndex, 'MISSING_REQUIRED', symbolRaw, { field: 'executedTime', row });
      logImportError(error, 'parseWebullCsvRow');
      throw new WebullParseError(rowIndex, 'Missing execution time', row);
    }
    
    const executedAt = parseDate(executedTime);
    if (!executedAt || executedAt === new Date().toISOString()) {
      const error = createImportError(rowIndex, 'BAD_DATE', symbolRaw, { executedTime, row });
      logImportError(error, 'parseWebullCsvRow');
      throw new WebullParseError(rowIndex, `Invalid date format: ${executedTime}`, row);
    }
    
    // Determine asset type and normalize symbol
    const assetType = determineAssetType(symbolRaw);
    const symbol = normalizeSymbol(symbolRaw, assetType);
    
    // Generate external ID
    const externalId = generateExternalId(row, fieldMap, symbolRaw, action, price, quantity);
    
    return {
      externalId,
      broker: 'webull',
      symbolRaw,
      symbol,
      assetType,
      side: action as 'buy' | 'sell',
      quantity,
      price,
      fees,
      commission,
      status: isFilled ? 'filled' : (status === 'cancelled' ? 'cancelled' : 'other'),
      executedAt,
      meta: {
        rowIndex,
        raw: row,
        source: 'webull-csv'
      }
    };
    
  } catch (error) {
    if (error instanceof WebullParseError) {
      throw error;
    }
    throw new WebullParseError(rowIndex, `Parse error: ${error.message}`, row);
  }
}

/**
 * Applies import filters to a parsed trade DTO
 */
export function applyImportFilters(tradeDTO: WebullTradeDTO): { shouldImport: boolean; reason?: string } {
  // Only filled trades are importable
  if (tradeDTO.status !== 'filled') {
    return { shouldImport: false, reason: 'cancelled' };
  }
  
  // Quantity and price must be positive for filled trades
  if (tradeDTO.quantity <= 0) {
    return { shouldImport: false, reason: 'zeroQty' };
  }
  
  if (tradeDTO.price <= 0) {
    return { shouldImport: false, reason: 'zeroPrice' };
  }
  
  // Check for valid timestamp
  if (!tradeDTO.executedAt || tradeDTO.executedAt === new Date().toISOString()) {
    return { shouldImport: false, reason: 'badDate' };
  }
  
  return { shouldImport: true };
}

/**
 * Processes a Webull CSV file with comprehensive filtering and telemetry
 */
export function processWebullCsv(
  csvText: string,
  fieldMap: Record<string, string>
): {
  trades: WebullTradeDTO[];
  summary: WebullImportSummary;
  skippedRows: WebullSkippedRow[];
} {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const summary: WebullImportSummary = {
    totalRows: lines.length,
    headerRows: 1,
    parsedRows: 0,
    filledRows: 0,
    importedRows: 0,
    skipped: {
      cancelled: 0,
      zeroQty: 0,
      zeroPrice: 0,
      badDate: 0,
      parseError: 0
    },
    errors: [],
    errorSummary: {
      PARSE_ERROR: 0,
      BAD_DATE: 0,
      BAD_PRICE: 0,
      ZERO_QTY: 0,
      CANCELLED: 0,
      DUPLICATE: 0,
      MISSING_REQUIRED: 0
    }
  };
  
  const trades: WebullTradeDTO[] = [];
  const skippedRows: WebullSkippedRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      summary.parsedRows++;
      
      // Try to parse the row
      try {
        const tradeDTO = parseWebullCsvRow(row, fieldMap, i);
        
        // Apply import filters
        const filterResult = applyImportFilters(tradeDTO);
        
        if (filterResult.shouldImport) {
          trades.push(tradeDTO);
          summary.importedRows++;
          summary.filledRows++;
        } else {
          // Track skip reason and create standardized error
          const reason = filterResult.reason || 'unknown';
          summary.skipped[reason as keyof typeof summary.skipped]++;
          
          // Map filter reasons to error codes
          let errorCode: ImportErrorCode = 'PARSE_ERROR';
          if (reason === 'cancelled') errorCode = 'CANCELLED';
          else if (reason === 'zeroQty') errorCode = 'ZERO_QTY';
          else if (reason === 'zeroPrice') errorCode = 'BAD_PRICE';
          else if (reason === 'badDate') errorCode = 'BAD_DATE';
          
          const error = createImportError(i, errorCode, tradeDTO.symbolRaw, { 
            reason,
            tradeDTO 
          });
          summary.errors.push(error);
          summary.errorSummary[errorCode]++;
          
          // Log first 5 skipped rows
          if (skippedRows.length < 5) {
            skippedRows.push({
              rowIndex: i,
              reason,
              symbolRaw: tradeDTO.symbolRaw,
              status: tradeDTO.status,
              filled: tradeDTO.quantity.toString(),
              price: tradeDTO.price.toString()
            });
          }
        }
        
      } catch (parseError) {
        if (parseError instanceof WebullParseError) {
          summary.skipped.parseError++;
          
          // Create standardized error
          const error = createImportError(i, 'PARSE_ERROR', row[fieldMap.symbol] || '', { 
            originalError: parseError.message,
            row 
          });
          summary.errors.push(error);
          summary.errorSummary.PARSE_ERROR++;
          
          // Log first 5 parse errors
          if (skippedRows.length < 5) {
            skippedRows.push({
              rowIndex: i,
              reason: 'parseError',
              symbolRaw: row[fieldMap.symbol] || '',
              status: row[fieldMap.status] || '',
              filled: row[fieldMap.filled] || '',
              price: row[fieldMap.price] || ''
            });
          }
        } else {
          throw parseError;
        }
      }
      
    } catch (error) {
      console.error(`Error processing row ${i}:`, error);
      summary.skipped.parseError++;
    }
  }
  
  return { trades, summary, skippedRows };
}

/**
 * Parses Webull CSV headers and creates field mapping
 */
export function parseWebullCsvHeaders(headers: string[]): Record<string, string> {
  const fieldMap = createFieldMap(headers);
  
  // Debug logging for field mapping
  console.log('[DEBUG] Headers:', headers);
  console.log('[DEBUG] Field map:', fieldMap);
  
  // Check for missing required fields
  const requiredFields = ['symbol', 'action', 'status', 'price', 'executedtime'];
  const missingFields = requiredFields.filter(field => !fieldMap[field]);
  
  if (missingFields.length > 0) {
    console.warn('[DEBUG] Missing required fields:', missingFields);
    console.warn('[DEBUG] Available headers:', headers);
  }
  
  return fieldMap;
}

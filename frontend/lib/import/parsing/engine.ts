// Pluggable parsing engine: core types, registry, utils, CSV streaming, sample adapter
// This module can be used both in the browser and in server-side contexts for batch processing.

import Papa from 'papaparse';

// -----------------------------
// Core Types (keep names exactly)
// -----------------------------

export type NormalizedFill = {
  sourceBroker: string; // "ibkr", "schwab", etc.
  assetClass: 'stocks' | 'options' | 'futures' | 'crypto';
  accountIdExternal?: string; // account number in broker file
  symbol: string; // e.g., "AAPL", "ESZ5", "BTC-USD"
  underlying?: string; // options/futures underlying if present
  expiry?: string; // ISO date YYYY-MM-DD for options/futures
  strike?: number;
  right?: 'C' | 'P';
  quantity: number; // signed, +buy/-sell; for options shares = contracts*100
  price: number; // fill price in account currency
  fees?: number; // total fees/commissions
  currency?: string; // default account currency if missing
  side?: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
  execTime: string; // ISO with timezone considered
  orderId?: string;
  tradeIdExternal?: string; // unique row id from file, if present
  notes?: string;
  raw?: Record<string, any>; // original columns for debugging
};

export type DetectionResult = {
  brokerId: string;
  assetClass: 'stocks' | 'options' | 'futures' | 'crypto';
  schemaId: string;
  confidence: number;
  headerMap: Record<string, string>;
  warnings: string[];
};

export interface BrokerAdapter {
  id: string; // "ibkr", "schwab", "webull", "robinhood", "fidelity", "etrade", "tastytrade", "tradestation", "coinbase", "kraken", "binanceus"
  label: string;
  // headers -> detection
  detect(input: { headers: string[]; sampleRows: any[] }): DetectionResult | null;
  // parse -> normalized fills
  parse(input: {
    rows: any[];
    headerMap?: Record<string, string>;
    userTimezone?: string;
    assetClass: 'stocks' | 'options' | 'futures' | 'crypto';
  }): {
    fills: NormalizedFill[];
    warnings: string[];
    errors: Array<{ row: number; message: string }>;
  };
}

// -----------------------------
// Adapter registry
// -----------------------------

const _adapters: BrokerAdapter[] = [];

export function registerAdapter(adapter: BrokerAdapter) {
  _adapters.push(adapter);
}

export function getAdapters(): BrokerAdapter[] {
  return _adapters.slice();
}

export function detectAdapter(headers: string[], sampleRows: any[]): DetectionResult | null {
  let best: DetectionResult | null = null;
  for (const adapter of _adapters) {
    try {
      const result = adapter.detect({ headers, sampleRows });
      if (result && (!best || result.confidence > best.confidence)) {
        best = result;
      }
    } catch (_) {
      // ignore adapter errors during detection
    }
  }
  return best;
}

// -----------------------------
// Normalization utilities
// -----------------------------

const OCC_REGEXES = [
  // AAPL 240920C00185000 (with space)
  /^([A-Z.]+)\s(\d{6})([CP])(\d{8})$/,
  // AAPL240920C00185000 (no space)
  /^([A-Z.]+)(\d{6})([CP])(\d{8})$/,
];

export function parseOCC(description: string | undefined): {
  underlying?: string;
  expiry?: string;
  right?: 'C' | 'P';
  strike?: number;
} {
  if (!description) return {};
  const s = description.trim().toUpperCase();
  for (const r of OCC_REGEXES) {
    const m = s.match(r);
    if (m && m.length >= 5) {
      const under = m[1];
      const yymmdd = m[2];
      const right = m[3] as 'C' | 'P';
      const strike = m[4];
      const yy = parseInt(yymmdd.slice(0, 2), 10);
      const mm = yymmdd.slice(2, 4);
      const dd = yymmdd.slice(4, 6);
      const year = yy + 2000;
      const expiry = `${year}-${mm}-${dd}`;
      // OCC strike has 5 decimals implied: e.g., 00185000 => 185.000
      const strikeNum = Number((parseInt(strike, 10) / 1000).toFixed(3));
      return { underlying: under, expiry, right, strike: strikeNum };
    }
  }
  return {};
}

export function normalizeCryptoSymbol(sym: string | undefined): string | undefined {
  if (!sym) return sym;
  const s = sym.replace('/', '-').replace('_', '-').toUpperCase();
  if (s === 'XBTUSD' || s === 'BTCUSD' || s === 'BTC-USD') return 'BTC-USD';
  if (s === 'ETHUSD' || s === 'ETH-USD') return 'ETH-USD';
  // default split into BASE-QUOTE if missing dash and both are alpha
  if (!s.includes('-') && s.length >= 6) {
    const base = s.slice(0, 3);
    const quote = s.slice(3);
    return `${base}-${quote}`;
  }
  return s;
}

export function normalizeSideAndQuantity(
  rawSide: string | undefined,
  rawQty: any,
): { side?: 'BUY' | 'SELL' | 'SHORT' | 'COVER'; qty: number } {
  let qty = Number(rawQty || 0);
  let side = (rawSide || '').toUpperCase();
  // Convention: buy > 0, sell < 0
  if (side.includes('BUY') || side === 'B') {
    qty = Math.abs(qty);
    side = 'BUY';
  } else if (side.includes('SELL') || side === 'S') {
    qty = -Math.abs(qty);
    side = 'SELL';
  } else {
    // If side missing, infer from sign
    side = qty >= 0 ? 'BUY' : 'SELL';
  }
  return { side: side as any, qty };
}

export function ensurePositiveFees(f: any): number | undefined {
  if (f === undefined || f === null) return undefined;
  const n = Math.abs(Number(f) || 0);
  return Number.isFinite(n) ? n : undefined;
}

export function toISO(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number(value) || 0;
  const v = value.trim();
  if (v === '') return 0;
  const hasDot = v.includes('.');
  const hasComma = v.includes(',');
  if (hasDot && hasComma) {
    // Determine last separator as decimal
    const lastDot = v.lastIndexOf('.');
    const lastComma = v.lastIndexOf(',');
    if (lastComma > lastDot) {
      // European: thousands as dot, decimal as comma
      const normalized = v.replace(/\./g, '').replace(/,/g, '.');
      return Number(normalized) || 0;
    } else {
      // US: thousands as comma, decimal as dot
      const normalized = v.replace(/,/g, '');
      return Number(normalized) || 0;
    }
  } else if (hasComma && !hasDot) {
    // Assume comma is decimal
    const normalized = v.replace(/\./g, '').replace(/,/g, '.');
    return Number(normalized) || 0;
  } else {
    // Default: dot decimal, remove commas
    const normalized = v.replace(/,/g, '');
    return Number(normalized) || 0;
  }
}

// -----------------------------
// CSV helpers (streaming/sample)
// -----------------------------

export async function parseCsvSample(
  file: File,
  maxRows = 200,
): Promise<{ headers: string[]; sampleRows: any[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      worker: false, // Disable worker to avoid CSP issues
      skipEmptyLines: true,
      preview: maxRows,
      delimiter: '', // auto-detect
      complete: (res) => {
        const headers = (res.meta?.fields || []) as string[];
        const rows = (res.data || []) as any[];
        // Clean headers: remove any quotes that might have been preserved
        const cleanedHeaders = headers.map(h => String(h || '').replace(/^["']|["']$/g, '').trim());
        resolve({ headers: cleanedHeaders, sampleRows: rows });
      },
      error: (err) => reject(err),
    });
  });
}

// -----------------------------
// Utility helpers shared by adapters
// -----------------------------
function hasAll(headers: string[], keys: string[]): boolean {
  const s = new Set(headers.map((h) => h.toLowerCase()));
  return keys.every((k) => s.has(k.toLowerCase()));
}

function normalizeExecTime(raw: any, userTimezone?: string): string {
  const s = String(raw || '').trim();
  // If contains 'Z' or +/- offset, trust it
  if (/Z$|[\+\-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  // Fallback: parse as local time and output ISO
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function sumFees(row: any, cols: string[], headerMap?: Record<string, string>) {
  let total = 0;
  for (const c of cols) {
    const val = headerMap ? row[headerMap[c] || c] : row[c];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const n = parseNumber(val as any);
      if (Number.isFinite(n)) total += Math.abs(n);
    }
  }
  return total || undefined;
}

// -----------------------------
// Adapters: IBKR
// -----------------------------
function ibkrDetect({
  headers,
  sampleRows,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const isTrades =
    hasAll(headers, ['Symbol', 'Quantity', 'T. Price']) ||
    hasAll(headers, ['Date/Time', 'Symbol', 'Quantity']) ||
    hasAll(headers, ['Trade Date', 'Symbol', 'Quantity']);
  if (!isTrades) return null;
  let assetClass: DetectionResult['assetClass'] = 'stocks';
  const desc = sampleRows[0]?.['Description'] || '';
  if (/[CP]\d{8}/i.test(String(desc))) assetClass = 'options';
  const assetCat = (sampleRows[0]?.['Asset Category'] || sampleRows[0]?.['AssetCategory'] || '')
    .toString()
    .toLowerCase();
  if (assetCat.includes('option')) assetClass = 'options';
  if (assetCat.includes('future')) assetClass = 'futures';
  const headerMap: Record<string, string> = {
    symbol: 'Symbol',
    qty: 'Quantity',
    price: 'T. Price',
    time: 'Date/Time',
    fee: 'Comm/Fee',
    currency: 'Currency',
    description: 'Description',
    putcall: 'Put/Call',
    strike: 'Strike',
    expiration: 'Expiration',
    tradeId: 'Trade ID',
    orderId: 'Order ID',
    account: 'AccountId',
  };
  return {
    brokerId: 'ibkr',
    assetClass,
    schemaId: 'ibkr-trades-csv',
    confidence: 0.9,
    headerMap,
    warnings: [],
  };
}

function ibkrParseRows(input: {
  rows: any[];
  headerMap?: Record<string, string>;
  userTimezone?: string;
  assetClass: 'stocks' | 'options' | 'futures' | 'crypto';
}) {
  const { rows, headerMap, assetClass, userTimezone } = input;
  const fills: NormalizedFill[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  const warnings: string[] = [];
  const get = (row: any, key: string) => row[headerMap?.[key] || key];

  rows.forEach((row, idx) => {
    try {
      const symbolRaw = String(get(row, 'symbol') || get(row, 'Description') || '').trim();
      let symbol = String(get(row, 'symbol') || '')
        .trim()
        .toUpperCase();
      const description = String(get(row, 'description') || '');
      const execTime = normalizeExecTime(
        get(row, 'time') || get(row, 'Trade Date') || get(row, 'Date/Time'),
        userTimezone,
      );
      const currency = get(row, 'currency') || undefined;
      const fee = sumFees(
        row,
        ['fee', 'Comm/Fee', 'Commission', 'Regulatory Fees', 'Sec Fee', 'NFA Fee'],
        headerMap,
      );
      const sideQty = normalizeSideAndQuantity(get(row, 'side'), parseNumber(get(row, 'qty')));
      let qty = sideQty.qty;
      let side = sideQty.side;
      const price = parseNumber(get(row, 'price'));
      let underlying: string | undefined,
        expiry: string | undefined,
        right: 'C' | 'P' | undefined,
        strike: number | undefined;
      let notes: string | undefined;

      if (assetClass === 'options') {
        const parsed = parseOCC(symbolRaw || description);
        underlying = parsed.underlying;
        expiry = parsed.expiry;
        right = parsed.right;
        strike = parsed.strike;
        if (underlying)
          symbol = `${underlying}${expiry?.replace(/-/g, '')} ${right}${(strike || 0).toFixed(3)}`;
        const contracts = qty;
        qty = qty * 100;
        notes = `contracts:${contracts}`;
      } else if (assetClass === 'futures') {
        // canonicalization placeholder; enrichment later
        symbol = symbol.toUpperCase();
      } else if (assetClass === 'crypto') {
        symbol = normalizeCryptoSymbol(symbol) || symbol;
      }

      const accountIdExternal = get(row, 'account') || get(row, 'Account') || undefined;
      const orderId = get(row, 'orderId') || undefined;
      const tradeIdExternal = get(row, 'tradeId') || undefined;

      fills.push({
        sourceBroker: 'ibkr',
        assetClass,
        accountIdExternal: accountIdExternal ? String(accountIdExternal) : undefined,
        symbol,
        underlying,
        expiry,
        strike,
        right,
        quantity: qty,
        price,
        fees: fee,
        currency: currency ? String(currency) : undefined,
        side,
        execTime,
        orderId: orderId ? String(orderId) : undefined,
        tradeIdExternal: tradeIdExternal ? String(tradeIdExternal) : undefined,
        notes,
        raw: row,
      });
    } catch (e: any) {
      errors.push({ row: idx + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const ibkrAdapter: BrokerAdapter = {
  id: 'ibkr',
  label: 'Interactive Brokers',
  detect: ibkrDetect,
  parse: ibkrParseRows,
};

// -----------------------------
// Adapters: Schwab
// -----------------------------
function schwabDetect({
  headers,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const isTrades =
    hasAll(headers, ['Action', 'Symbol', 'Quantity', 'Price']) &&
    (hasAll(headers, ['Trade Date']) || hasAll(headers, ['Settlement Date']));
  if (!isTrades) return null;
  const headerMap: Record<string, string> = {
    action: 'Action',
    symbol: 'Symbol',
    quantity: 'Quantity',
    price: 'Price',
    fees: 'Fees & Comm',
    time: 'Trade Date',
    order: 'Order #',
    account: 'Account Number',
  };
  return {
    brokerId: 'schwab',
    assetClass: 'stocks',
    schemaId: 'schwab-transactions',
    confidence: 0.85,
    headerMap,
    warnings: [],
  };
}

function schwabParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      const sym = String(get(r, 'symbol') || '')
        .toUpperCase()
        .trim();
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'action'),
        parseNumber(get(r, 'quantity')),
      );
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(get(r, 'time'), userTimezone);
      const fees = sumFees(r, ['fees', 'Fees & Comm', 'Commission', 'Fees'], headerMap);
      fills.push({
        sourceBroker: 'schwab',
        assetClass: assetClass || 'stocks',
        symbol: sym,
        quantity: qty,
        price,
        execTime,
        fees,
        side,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const schwabAdapter: BrokerAdapter = {
  id: 'schwab',
  label: 'Charles Schwab',
  detect: schwabDetect as any,
  parse: schwabParse as any,
};

// -----------------------------
// Adapters: Webull
// -----------------------------
function webullDetect({
  headers,
  sampleRows,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const ok =
    hasAll(headers, ['Symbol', 'Side']) &&
    (hasAll(headers, ['Total Qty']) || hasAll(headers, ['Quantity'])) &&
    (hasAll(headers, ['Avg Price']) || hasAll(headers, ['Price']));
  if (!ok) return null;
  // Guess asset class: if OCC-like string present in Symbol or Name, treat as options
  const first = sampleRows[0] || {};
  const symStr = String(first['Symbol'] || first['Name'] || '');
  const isOpt = /\d{6}[CP]\d{8}$/.test(symStr.replace(/\s+/g, ''));
  const headerMap: Record<string, string> = {
    symbol: 'Symbol',
    side: 'Side',
    quantity: 'Total Qty',
    price: 'Avg Price',
    time: 'Filled Time',
    fee1: 'Commission',
    fee2: 'Regulatory Fees',
  };
  return {
    brokerId: 'webull',
    assetClass: isOpt ? 'options' : 'stocks',
    schemaId: 'webull-trades',
    confidence: 0.9,
    headerMap,
    warnings: [],
  };
}

function webullParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      let symbol = String(get(r, 'symbol') || '')
        .toUpperCase()
        .trim();
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'side'),
        parseNumber(get(r, 'quantity')),
      );
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(
        get(r, 'time') || get(r, 'Time Placed') || get(r, 'Time Executed'),
        userTimezone,
      );
      const fees = sumFees(r, ['fee1', 'fee2', 'Commission', 'Regulatory Fees'], headerMap);
      fills.push({
        sourceBroker: 'webull',
        assetClass: assetClass || 'stocks',
        symbol,
        quantity: qty,
        price,
        execTime,
        fees,
        side,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const webullAdapter: BrokerAdapter = {
  id: 'webull',
  label: 'Webull',
  detect: webullDetect as any,
  parse: webullParse as any,
};

// -----------------------------
// Adapters: Robinhood
// -----------------------------

/**
 * Helper to parse money values from Robinhood CSV format.
 * Handles $, commas, and parentheses for negative values.
 * Examples: "$1,339.92", "($209.03)", "$0.01"
 */
function parseMoney(value: string | null | undefined): number | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  // Detect parentheses for negative (e.g., "($209.03)")
  const negative = trimmed.startsWith('(') && trimmed.endsWith(')');
  // Remove $, commas, and parentheses
  const cleaned = trimmed.replace(/[,$()]/g, '');
  const num = Number.parseFloat(cleaned);
  if (Number.isNaN(num)) return null;
  return negative ? -num : num;
}

/**
 * Parse Robinhood option description format.
 * Examples:
 * - "NVDA 6/28/2024 Call $125.00"
 * - "SPY 6/24/2024 Call $545.00"
 * - "AVGO 7/5/2024 Put $1,725.00"
 * Returns: { underlying, expiry, option_type, strike_price }
 */
function parseRobinhoodOptionDescription(description: string): {
  underlying?: string;
  expiry?: string;
  option_type?: 'CALL' | 'PUT';
  strike_price?: number;
} {
  if (!description) return {};
  
  // Pattern: SYMBOL MM/DD/YYYY Call|Put $STRIKE
  // More flexible regex to handle variations in spacing
  // Example: "NVDA 6/28/2024 Call $125.00" or "AVGO 7/5/2024 Put $1,725.00"
  const callMatch = description.match(/^([A-Z.]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+Call\s+\$([\d,]+\.?\d*)/i);
  const putMatch = description.match(/^([A-Z.]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+Put\s+\$([\d,]+\.?\d*)/i);
  
  const match = callMatch || putMatch;
  if (!match) return {};
  
  const underlying = match[1].toUpperCase();
  const dateStr = match[2]; // MM/DD/YYYY
  const optionType = callMatch ? 'CALL' : 'PUT';
  const strikeStr = match[3].replace(/,/g, '');
  const strikePrice = Number.parseFloat(strikeStr);
  
  // Parse MM/DD/YYYY to ISO date YYYY-MM-DD
  const dateParts = dateStr.split('/');
  if (dateParts.length !== 3) return { underlying, option_type: optionType, strike_price: strikePrice };
  
  const month = dateParts[0].padStart(2, '0');
  const day = dateParts[1].padStart(2, '0');
  const year = dateParts[2];
  const expiry = `${year}-${month}-${day}`;
  
  return {
    underlying,
    expiry,
    option_type: optionType,
    strike_price: Number.isNaN(strikePrice) ? undefined : strikePrice,
  };
}

/**
 * Parse MM/DD/YYYY date string to ISO format.
 */
function parseActivityDate(dateStr: string | null | undefined, userTimezone?: string): string {
  if (!dateStr || !dateStr.trim()) return new Date().toISOString();
  
  // Parse MM/DD/YYYY format
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) {
    // Fallback to existing normalizeExecTime
    return normalizeExecTime(dateStr, userTimezone);
  }
  
  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2];
  
  // Create date string in ISO format (YYYY-MM-DD) and set to midnight in user's timezone
  // For now, use UTC midnight - can be enhanced with timezone support later
  const isoDate = `${year}-${month}-${day}T00:00:00.000Z`;
  return isoDate;
}

/**
 * Build idempotency key for Robinhood trade.
 */
function buildRobinhoodIdempotencyKey(
  activityDate: string,
  description: string,
  transCode: string,
  quantity: string,
  price: string,
  amount: string,
): string {
  // Simple hash-like key: concatenate all fields
  const key = `${activityDate}|${description}|${transCode}|${quantity}|${price}|${amount}`;
  // In production, you might want to use a proper hash function
  return key;
}

function robinhoodDetect({
  headers,
  sampleRows,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  // Check for Robinhood Activity CSV format
  // Required headers: "Activity Date","Process Date","Settle Date","Instrument","Description","Trans Code","Quantity","Price","Amount"
  const requiredHeaders = [
    'Activity Date',
    'Process Date',
    'Settle Date',
    'Instrument',
    'Description',
    'Trans Code',
    'Quantity',
    'Price',
    'Amount',
  ];
  
  // Clean headers: remove quotes and trim
  const headerLower = headers.map(h => String(h || '').replace(/^["']|["']$/g, '').toLowerCase().trim());
  const requiredLower = requiredHeaders.map(h => h.toLowerCase().trim());
  
  // Debug: log headers for troubleshooting
  if (process.env.NODE_ENV === 'development') {
    console.log('Robinhood detection - Headers received:', headers);
    console.log('Robinhood detection - Headers cleaned:', headerLower);
  }
  
  // Check if all required headers are present (case-insensitive)
  // Match exact or contains (for variations like "ActivityDate" vs "Activity Date")
  const hasAllRequired = requiredLower.every(req => {
    const reqNoSpace = req.replace(/\s+/g, '');
    const found = headerLower.some(h => {
      const hNoSpace = h.replace(/\s+/g, '');
      return h === req || hNoSpace === reqNoSpace || h.includes(req) || h.includes(reqNoSpace);
    });
    if (!found && process.env.NODE_ENV === 'development') {
      console.log(`Robinhood detection - Missing header: "${req}"`);
    }
    return found;
  });
  
  if (!hasAllRequired) {
    // Fallback to old format detection for backward compatibility
    const ok =
      hasAll(headers, ['Date', 'Symbol', 'Side', 'Quantity', 'Price']) ||
      hasAll(headers, ['Date', 'Time', 'Symbol', 'Side', 'Quantity', 'Price']);
    if (!ok) return null;
    
    const headerMap: Record<string, string> = {
      date: 'Date',
      time: 'Time',
      symbol: 'Symbol',
      side: 'Side',
      quantity: 'Quantity',
      price: 'Price',
      fees: 'Fees',
    };
    return {
      brokerId: 'robinhood',
      assetClass: 'stocks',
      schemaId: 'robinhood-trades',
      confidence: 0.7,
      headerMap,
      warnings: [],
    };
  }
  
  // Detect asset class from sample rows
  let assetClass: DetectionResult['assetClass'] = 'stocks';
  for (const row of sampleRows.slice(0, 10)) {
    const transCode = String(row['Trans Code'] || row['trans code'] || '').toUpperCase();
    const description = String(row['Description'] || row['description'] || '').toUpperCase();
    
    if (transCode === 'BTO' || transCode === 'STC' || description.includes(' CALL ') || description.includes(' PUT ')) {
      assetClass = 'options';
      break;
    }
  }
  
  // Build header map for Activity CSV format
  const headerMap: Record<string, string> = {};
  headers.forEach((h, idx) => {
    const lower = h.toLowerCase().trim();
    if (lower.includes('activity date')) headerMap['activityDate'] = h;
    else if (lower.includes('process date')) headerMap['processDate'] = h;
    else if (lower.includes('settle date')) headerMap['settleDate'] = h;
    else if (lower.includes('instrument')) headerMap['instrument'] = h;
    else if (lower.includes('description')) headerMap['description'] = h;
    else if (lower.includes('trans code')) headerMap['transCode'] = h;
    else if (lower.includes('quantity')) headerMap['quantity'] = h;
    else if (lower.includes('price')) headerMap['price'] = h;
    else if (lower.includes('amount')) headerMap['amount'] = h;
  });
  
  return {
    brokerId: 'robinhood',
    assetClass,
    schemaId: 'robinhood-activity-csv',
    confidence: 0.95,
    headerMap,
    warnings: [],
  };
}

function robinhoodParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  
  // Check if this is the Activity CSV format (has 'transCode' in headerMap)
  const isActivityFormat = headerMap?.['transCode'] || headerMap?.['Trans Code'];
  
  if (isActivityFormat) {
    // Parse Activity CSV format
    rows.forEach((r: any, i: number) => {
      try {
        // Skip empty rows or rows with mismatched column count
        const rowValues = Object.values(r);
        if (rowValues.length === 0 || rowValues.every(v => !v || String(v).trim() === '')) {
          return; // Skip empty rows
        }
        
        // Get field values by header map
        const activityDateStr = String(get(r, 'activityDate') || '').trim();
        const processDateStr = String(get(r, 'processDate') || '').trim();
        const settleDateStr = String(get(r, 'settleDate') || '').trim();
        const instrument = String(get(r, 'instrument') || '').trim();
        const description = String(get(r, 'description') || '').trim();
        const transCode = String(get(r, 'transCode') || '').trim().toUpperCase();
        const quantityStr = String(get(r, 'quantity') || '').trim();
        const priceStr = String(get(r, 'price') || '').trim();
        const amountStr = String(get(r, 'amount') || '').trim();
        
        // Skip rows without Trans Code (footer/disclaimer rows)
        if (!transCode) {
          return;
        }
        
        // Skip non-trade rows (for now)
        // Trade codes: BTO, STC, Buy, Sell (case-insensitive)
        // Non-trade codes: ACH, RTP, DCF, GOLD, INT, CDIV, REC, OEXP
        // TODO: Handle OEXP (option expiration) in a later iteration for proper option-expiry auto-closing
        const tradeCodes = ['BTO', 'STC', 'BUY', 'SELL'];
        if (!tradeCodes.includes(transCode)) {
          // Log as ignored for debugging (non-trade row)
          return;
        }
        
        // Skip disclaimer/footer rows
        if (description.toLowerCase().includes('the data provided is for your convenience') ||
            description.toLowerCase().includes('does not include robinhood crypto') ||
            description.toLowerCase().includes('does not include robinhood spending')) {
          return;
        }
        
        // Parse date (use Activity Date as execution date)
        const execTime = parseActivityDate(activityDateStr, userTimezone);
        
        // Parse quantity
        let quantity = 0;
        if (quantityStr && quantityStr.trim() !== '') {
          // Skip OEXP quantities like "5S" for now (those rows are skipped anyway)
          const qtyNum = Number.parseFloat(quantityStr.replace(/[^0-9.-]/g, ''));
          if (!Number.isNaN(qtyNum)) {
            quantity = qtyNum;
          }
        }
        
        if (quantity === 0) {
          // Skip rows with zero quantity
          return;
        }
        
        // Parse price and amount
        const price = parseMoney(priceStr);
        const grossAmount = parseMoney(amountStr);
        
        if (price === null || grossAmount === null) {
          errors.push({ row: i + 1, message: `Invalid price or amount: price=${priceStr}, amount=${amountStr}` });
          return;
        }
        
        // Determine side and asset type
        let side: 'BUY' | 'SELL' | 'SHORT' | 'COVER' = 'BUY';
        let detectedAssetClass: 'stocks' | 'options' | 'futures' | 'crypto' = assetClass || 'stocks';
        
        // Map Trans Code to side
        // BTO = Buy To Open (options), Buy = Stock/ETF buy
        // STC = Sell To Close (options), Sell = Stock/ETF sell
        if (transCode === 'BTO' || transCode === 'BUY') {
          side = 'BUY';
          quantity = Math.abs(quantity); // Ensure positive for buys
        } else if (transCode === 'STC' || transCode === 'SELL') {
          side = 'SELL';
          quantity = -Math.abs(quantity); // Negative for sells (following convention)
        } else {
          // Should not reach here due to earlier filter, but handle gracefully
          return;
        }
        
        // Detect if this is an option trade
        const optionInfo = parseRobinhoodOptionDescription(description);
        const isOption = transCode === 'BTO' || transCode === 'STC' || 
                        optionInfo.underlying !== undefined ||
                        description.toUpperCase().includes(' CALL ') ||
                        description.toUpperCase().includes(' PUT ');
        
        if (isOption) {
          detectedAssetClass = 'options';
        }
        
        // Determine symbol
        let symbol = instrument.toUpperCase().trim();
        let underlying: string | undefined;
        let expiry: string | undefined;
        let strike: number | undefined;
        let right: 'C' | 'P' | undefined;
        
        if (isOption && optionInfo.underlying) {
          underlying = optionInfo.underlying;
          expiry = optionInfo.expiry;
          strike = optionInfo.strike_price;
          right = optionInfo.option_type === 'CALL' ? 'C' : 'P';
          // Use underlying as symbol, or construct option symbol if needed
          symbol = underlying;
        } else if (!symbol && instrument.trim() === '') {
          // Try to extract symbol from description for stock trades
          // Example: "Bought 10.0000 AAPL @ 175.00"
          const buyMatch = description.match(/Bought\s+[\d.]+\s+([A-Z]+)\s+@/i);
          const sellMatch = description.match(/Sold\s+[\d.]+\s+([A-Z]+)\s+@/i);
          const extractedSymbol = (buyMatch?.[1] || sellMatch?.[1] || '').toUpperCase();
          if (extractedSymbol) {
            symbol = extractedSymbol;
          }
        }
        
        if (!symbol) {
          errors.push({ row: i + 1, message: `Could not determine symbol from instrument or description` });
          return;
        }
        
        // Build idempotency key
        const idempotencyKey = buildRobinhoodIdempotencyKey(
          activityDateStr,
          description,
          transCode,
          quantityStr,
          priceStr,
          amountStr,
        );
        
        // Create normalized fill
        const fill: NormalizedFill = {
          sourceBroker: 'robinhood',
          assetClass: detectedAssetClass,
          symbol,
          underlying,
          expiry,
          strike,
          right,
          quantity,
          price,
          fees: 0, // Robinhood doesn't break out fees separately in Activity CSV
          currency: 'USD',
          side,
          execTime,
          tradeIdExternal: idempotencyKey,
          notes: description, // Store original description as notes
          raw: r,
        };
        
        fills.push(fill);
      } catch (e: any) {
        errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
      }
    });
  } else {
    // Fallback to old format parsing for backward compatibility
    rows.forEach((r: any, i: number) => {
      try {
        let symbol = String(get(r, 'symbol') || '')
          .toUpperCase()
          .trim();
        const { side, qty } = normalizeSideAndQuantity(
          get(r, 'side'),
          parseNumber(get(r, 'quantity')),
        );
        const price = parseNumber(get(r, 'price'));
        const dtRaw = [get(r, 'date'), get(r, 'time')].filter(Boolean).join(' ');
        const execTime = normalizeExecTime(dtRaw, userTimezone);
        const fees = sumFees(r, ['fees', 'Fee', 'Commission'], headerMap);
        fills.push({
          sourceBroker: 'robinhood',
          assetClass: assetClass || 'stocks',
          symbol,
          quantity: qty,
          price,
          execTime,
          fees,
          side,
          raw: r,
        });
      } catch (e: any) {
        errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
      }
    });
  }
  
  return { fills, warnings, errors };
}

export const robinhoodAdapter: BrokerAdapter = {
  id: 'robinhood',
  label: 'Robinhood',
  detect: robinhoodDetect as any,
  parse: robinhoodParse as any,
};

// -----------------------------
// Adapters: Fidelity
// -----------------------------
function fidelityDetect({
  headers,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const ok =
    hasAll(headers, ['Symbol', 'Action', 'Quantity', 'Price']) &&
    (hasAll(headers, ['Settlement Date']) || hasAll(headers, ['Trade Date']));
  if (!ok) return null;
  const headerMap: Record<string, string> = {
    symbol: 'Symbol',
    action: 'Action',
    quantity: 'Quantity',
    price: 'Price',
    time: 'Settlement Date',
    commission: 'Commission',
    fees: 'Fees',
  };
  return {
    brokerId: 'fidelity',
    assetClass: 'stocks',
    schemaId: 'fidelity-trades',
    confidence: 0.8,
    headerMap,
    warnings: [],
  };
}

function fidelityParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      let symbol = String(get(r, 'symbol') || '')
        .toUpperCase()
        .trim();
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'action'),
        parseNumber(get(r, 'quantity')),
      );
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(get(r, 'time'), userTimezone);
      const fees = sumFees(r, ['commission', 'fees', 'Commission', 'Fees'], headerMap);
      fills.push({
        sourceBroker: 'fidelity',
        assetClass: assetClass || 'stocks',
        symbol,
        quantity: qty,
        price,
        execTime,
        fees,
        side,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const fidelityAdapter: BrokerAdapter = {
  id: 'fidelity',
  label: 'Fidelity',
  detect: fidelityDetect as any,
  parse: fidelityParse as any,
};

// -----------------------------
// Adapters: E*TRADE
// -----------------------------
function etradeDetect({
  headers,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const ok =
    hasAll(headers, ['Transaction Date', 'Symbol', 'Quantity', 'Price']) ||
    hasAll(headers, ['Transaction Date', 'Symbol', 'Description']);
  if (!ok) return null;
  const headerMap: Record<string, string> = {
    time: 'Transaction Date',
    symbol: 'Symbol',
    quantity: 'Quantity',
    price: 'Price',
    commission: 'Commission',
    fees: 'Fees',
    action: 'Action',
  };
  return {
    brokerId: 'etrade',
    assetClass: 'stocks',
    schemaId: 'etrade-transactions',
    confidence: 0.8,
    headerMap,
    warnings: [],
  };
}

function etradeParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      let symbol = String(get(r, 'symbol') || '')
        .toUpperCase()
        .trim();
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'action'),
        parseNumber(get(r, 'quantity')),
      );
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(get(r, 'time'), userTimezone);
      const fees = sumFees(r, ['commission', 'fees', 'Commission', 'Fees'], headerMap);
      fills.push({
        sourceBroker: 'etrade',
        assetClass: assetClass || 'stocks',
        symbol,
        quantity: qty,
        price,
        execTime,
        fees,
        side,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const etradeAdapter: BrokerAdapter = {
  id: 'etrade',
  label: 'E*TRADE',
  detect: etradeDetect as any,
  parse: etradeParse as any,
};

// -----------------------------
// Adapters: Tastytrade (options heavy)
// -----------------------------
function tastyDetect({
  headers,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const ok =
    hasAll(headers, ['Fill Time', 'Symbol', 'Quantity', 'Price']) ||
    hasAll(headers, ['Fill Time', 'Description']);
  if (!ok) return null;
  const headerMap: Record<string, string> = {
    symbol: 'Symbol',
    quantity: 'Quantity',
    price: 'Price',
    time: 'Fill Time',
    fees: 'Fees',
    commission: 'Commission',
    underlying: 'Underlying',
    description: 'Description',
    type: 'Type',
    strike: 'Strike',
    expiry: 'Expiry',
  };
  return {
    brokerId: 'tastytrade',
    assetClass: 'options',
    schemaId: 'tastytrade-trades',
    confidence: 0.85,
    headerMap,
    warnings: [],
  };
}

function tastyParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      const desc = String(get(r, 'description') || '');
      let symbol = String(get(r, 'symbol') || '')
        .toUpperCase()
        .trim();
      let right: 'C' | 'P' | undefined = (get(r, 'type') || get(r, 'Put/Call') || '')
        .toString()
        .toUpperCase()
        .startsWith('P')
        ? 'P'
        : (get(r, 'type') || '').toString().toUpperCase().startsWith('C')
          ? 'C'
          : undefined;
      let strike = parseNumber(get(r, 'strike')) || undefined;
      let expiry = toISO(get(r, 'expiry'))?.slice(0, 10);
      if ((!right || !strike || !expiry) && desc) {
        const occ = parseOCC(desc);
        right = occ.right || right;
        strike = occ.strike || strike;
        expiry = occ.expiry || expiry;
      }
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'side'),
        parseNumber(get(r, 'quantity')),
      );
      const contracts = qty;
      const quantity = qty * 100;
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(get(r, 'time'), userTimezone);
      const fees = sumFees(r, ['fees', 'commission', 'Regulatory Fees'], headerMap);
      fills.push({
        sourceBroker: 'tastytrade',
        assetClass: assetClass || 'options',
        symbol,
        underlying: get(r, 'underlying'),
        right,
        strike,
        expiry,
        quantity,
        price,
        execTime,
        fees,
        side,
        notes: `contracts:${contracts}`,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const tastytradeAdapter: BrokerAdapter = {
  id: 'tastytrade',
  label: 'Tastytrade',
  detect: tastyDetect as any,
  parse: tastyParse as any,
};

// -----------------------------
// Adapters: TradeStation
// -----------------------------
function tradestationDetect({
  headers,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const ok = hasAll(headers, ['Execution Date', 'Symbol', 'Side', 'Quantity', 'Price']);
  if (!ok) return null;
  const headerMap: Record<string, string> = {
    symbol: 'Symbol',
    side: 'Side',
    quantity: 'Quantity',
    price: 'Price',
    time: 'Execution Date',
    commission: 'Commission',
    secfee: 'Sec Fee',
    nfafee: 'NFA Fee',
  };
  return {
    brokerId: 'tradestation',
    assetClass: 'stocks',
    schemaId: 'tradestation-executions',
    confidence: 0.8,
    headerMap,
    warnings: [],
  };
}

function tradestationParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      let symbol = String(get(r, 'symbol') || '')
        .toUpperCase()
        .trim();
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'side'),
        parseNumber(get(r, 'quantity')),
      );
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(get(r, 'time'), userTimezone);
      const fees = sumFees(r, ['commission', 'secfee', 'nfafee'], headerMap);
      fills.push({
        sourceBroker: 'tradestation',
        assetClass: assetClass || 'stocks',
        symbol,
        quantity: qty,
        price,
        execTime,
        fees,
        side,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const tradestationAdapter: BrokerAdapter = {
  id: 'tradestation',
  label: 'TradeStation',
  detect: tradestationDetect as any,
  parse: tradestationParse as any,
};

// -----------------------------
// Adapters: Crypto (Coinbase/Kraken/BinanceUS)
// -----------------------------
function coinbaseDetect({
  headers,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const ok =
    hasAll(headers, ['Timestamp', 'Product', 'Side']) &&
    (hasAll(headers, ['Size']) || hasAll(headers, ['Amount'])) &&
    hasAll(headers, ['Price']);
  if (!ok) return null;
  const headerMap: Record<string, string> = {
    time: 'Timestamp',
    symbol: 'Product',
    side: 'Side',
    quantity: 'Size',
    price: 'Price',
    fee: 'Fee',
    feeccy: 'Fee Currency',
    total: 'Total',
    orderId: 'Order ID',
  };
  return {
    brokerId: 'coinbase',
    assetClass: 'crypto',
    schemaId: 'coinbase-fills',
    confidence: 0.85,
    headerMap,
    warnings: [],
  };
}

function coinbaseParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      let symbol =
        normalizeCryptoSymbol(String(get(r, 'symbol') || '').toUpperCase()) ||
        String(get(r, 'symbol') || '');
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'side'),
        parseNumber(get(r, 'quantity')),
      );
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(get(r, 'time'), userTimezone);
      const fees = ensurePositiveFees(get(r, 'fee'));
      const feeCcy = get(r, 'feeccy');
      const notes =
        feeCcy && String(feeCcy).toUpperCase() !== (get(r, 'currency') || 'USD')
          ? `fee_ccy:${feeCcy}`
          : undefined;
      fills.push({
        sourceBroker: 'coinbase',
        assetClass: assetClass || 'crypto',
        symbol,
        quantity: qty,
        price,
        execTime,
        fees,
        side,
        notes,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const coinbaseAdapter: BrokerAdapter = {
  id: 'coinbase',
  label: 'Coinbase',
  detect: coinbaseDetect as any,
  parse: coinbaseParse as any,
};

function krakenDetect({
  headers,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const ok =
    hasAll(headers, ['Timestamp', 'Market', 'Side']) &&
    (hasAll(headers, ['Amount']) || hasAll(headers, ['Size'])) &&
    hasAll(headers, ['Price']);
  if (!ok) return null;
  const headerMap: Record<string, string> = {
    time: 'Timestamp',
    symbol: 'Market',
    side: 'Side',
    quantity: 'Amount',
    price: 'Price',
    fee: 'Fee',
    feeccy: 'Fee Currency',
    total: 'Total',
  };
  return {
    brokerId: 'kraken',
    assetClass: 'crypto',
    schemaId: 'kraken-fills',
    confidence: 0.8,
    headerMap,
    warnings: [],
  };
}

function krakenParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      let symbol =
        normalizeCryptoSymbol(String(get(r, 'symbol') || '').toUpperCase()) ||
        String(get(r, 'symbol') || '');
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'side'),
        parseNumber(get(r, 'quantity')),
      );
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(get(r, 'time'), userTimezone);
      const fees = ensurePositiveFees(get(r, 'fee'));
      const feeCcy = get(r, 'feeccy');
      const notes = feeCcy ? `fee_ccy:${feeCcy}` : undefined;
      fills.push({
        sourceBroker: 'kraken',
        assetClass: assetClass || 'crypto',
        symbol,
        quantity: qty,
        price,
        execTime,
        fees,
        side,
        notes,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const krakenAdapter: BrokerAdapter = {
  id: 'kraken',
  label: 'Kraken',
  detect: krakenDetect as any,
  parse: krakenParse as any,
};

function binanceDetect({
  headers,
}: {
  headers: string[];
  sampleRows: any[];
}): DetectionResult | null {
  const ok =
    hasAll(headers, ['Timestamp', 'Symbol', 'Side', 'Quantity', 'Price']) ||
    hasAll(headers, ['Time', 'Symbol', 'Side', 'Quantity', 'Price']);
  if (!ok) return null;
  const headerMap: Record<string, string> = {
    time: 'Timestamp',
    symbol: 'Symbol',
    side: 'Side',
    quantity: 'Quantity',
    price: 'Price',
    fee: 'Fee',
    feeccy: 'Fee Currency',
    total: 'Total',
    orderId: 'Order ID',
  };
  return {
    brokerId: 'binanceus',
    assetClass: 'crypto',
    schemaId: 'binanceus-fills',
    confidence: 0.8,
    headerMap,
    warnings: [],
  };
}

function binanceParse({ rows, headerMap, userTimezone, assetClass }: any) {
  const fills: NormalizedFill[] = [];
  const errors: any[] = [];
  const warnings: string[] = [];
  const get = (r: any, k: string) => r[headerMap?.[k] || k];
  rows.forEach((r: any, i: number) => {
    try {
      let symbol =
        normalizeCryptoSymbol(String(get(r, 'symbol') || '').toUpperCase()) ||
        String(get(r, 'symbol') || '');
      const { side, qty } = normalizeSideAndQuantity(
        get(r, 'side'),
        parseNumber(get(r, 'quantity')),
      );
      const price = parseNumber(get(r, 'price'));
      const execTime = normalizeExecTime(get(r, 'time'), userTimezone);
      const fees = ensurePositiveFees(get(r, 'fee'));
      const feeCcy = get(r, 'feeccy');
      const notes = feeCcy ? `fee_ccy:${feeCcy}` : undefined;
      fills.push({
        sourceBroker: 'binanceus',
        assetClass: assetClass || 'crypto',
        symbol,
        quantity: qty,
        price,
        execTime,
        fees,
        side,
        notes,
        raw: r,
      });
    } catch (e: any) {
      errors.push({ row: i + 1, message: e?.message || 'Row parse error' });
    }
  });
  return { fills, warnings, errors };
}

export const binanceusAdapter: BrokerAdapter = {
  id: 'binanceus',
  label: 'BinanceUS',
  detect: binanceDetect as any,
  parse: binanceParse as any,
};

// Register adapters
registerAdapter(ibkrAdapter);
registerAdapter(schwabAdapter);
registerAdapter(webullAdapter);
registerAdapter(robinhoodAdapter);
registerAdapter(fidelityAdapter);
registerAdapter(etradeAdapter);
registerAdapter(tastytradeAdapter);
registerAdapter(tradestationAdapter);
registerAdapter(coinbaseAdapter);
registerAdapter(krakenAdapter);
registerAdapter(binanceusAdapter);

// -----------------------------
// Orchestration helpers
// -----------------------------

export async function detectAndParseFromCsv(file: File, assetHint?: DetectionResult['assetClass']) {
  const { headers, sampleRows } = await parseCsvSample(file, 200);
  const detection = detectAdapter(headers, sampleRows);
  return { detection, headers, sampleRows };
}

const parsingEngine = {
  registerAdapter,
  getAdapters,
  detectAdapter,
  parseCsvSample,
  detectAndParseFromCsv,
};

export default parsingEngine;

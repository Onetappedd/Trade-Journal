// Full test of the parsing engine logic
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Read the CSV file
const csvPath = path.join(__dirname, '..', 'Oct 5, 2022 – Jan 1, 2025 (1).csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV with error handling for invalid rows
const delimiter = ',';
let records = [];
try {
  records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: delimiter,
    relax_column_count: true, // Allow inconsistent column counts
    relax_quotes: true
  });
} catch (error) {
  console.log('Parse error (partial):', error.message);
  // Try to get partial results
  if (error.records) {
    records = error.records;
  }
}

const rawHeaders = records.length > 0 ? Object.keys(records[0]) : [];
const headers = rawHeaders.map(h => String(h || '').replace(/^["']|["']$/g, '').trim());

// Build header map (same as in engine.ts)
const headerMap = {};
headers.forEach((h) => {
  const cleaned = h.trim();
  const lower = cleaned.toLowerCase();
  
  if (lower.includes('activity date') || lower === 'activity date') headerMap['activityDate'] = cleaned;
  else if (lower.includes('process date') || lower === 'process date') headerMap['processDate'] = cleaned;
  else if (lower.includes('settle date') || lower === 'settle date') headerMap['settleDate'] = cleaned;
  else if (lower.includes('instrument') || lower === 'instrument') headerMap['instrument'] = cleaned;
  else if (lower.includes('description') || lower === 'description') headerMap['description'] = cleaned;
  else if (lower.includes('trans code') || lower === 'trans code') headerMap['transCode'] = cleaned;
  else if (lower.includes('quantity') || lower === 'quantity') headerMap['quantity'] = cleaned;
  else if (lower.includes('price') || lower === 'price') headerMap['price'] = cleaned;
  else if (lower.includes('amount') || lower === 'amount') headerMap['amount'] = cleaned;
});

console.log('Header map:', headerMap);
console.log(`\nTotal rows: ${records.length}\n`);

// Parse money helper
function parseMoney(value) {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  const negative = trimmed.startsWith('(') && trimmed.endsWith(')');
  const cleaned = trimmed.replace(/[,$()]/g, '');
  const num = Number.parseFloat(cleaned);
  if (Number.isNaN(num)) return null;
  return negative ? -num : num;
}

// Parse date helper
function parseActivityDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return new Date().toISOString();
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) {
    return new Date().toISOString();
  }
  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2];
  const isoDate = `${year}-${month}-${day}T00:00:00.000Z`;
  return isoDate;
}

// Get function
const get = (r, k) => {
  const headerName = headerMap?.[k];
  if (headerName) {
    return r[headerName];
  }
  return r[k] || r[headerMap?.[k.toLowerCase()]] || r[k.toLowerCase()] || r[k.toUpperCase()];
};

// Parse rows (same logic as robinhoodParse)
const fills = [];
const errors = [];
const tradeCodes = ['BTO', 'STC', 'BUY', 'SELL'];

records.forEach((r, i) => {
  try {
    // Skip empty rows
    const rowValues = Object.values(r);
    if (rowValues.length === 0 || rowValues.every(v => !v || String(v).trim() === '')) {
      return;
    }
    
    // Get field values
    const activityDateStr = String(get(r, 'activityDate') || '').trim();
    const instrument = String(get(r, 'instrument') || '').trim();
    const description = String(get(r, 'description') || '').trim();
    const transCode = String(get(r, 'transCode') || '').trim().toUpperCase();
    const quantityStr = String(get(r, 'quantity') || '').trim();
    const priceStr = String(get(r, 'price') || '').trim();
    const amountStr = String(get(r, 'amount') || '').trim();
    
    // Skip rows without Trans Code
    if (!transCode) {
      return;
    }
    
    // Skip non-trade rows
    if (!tradeCodes.includes(transCode)) {
      return;
    }
    
    // Skip disclaimer rows
    if (description.toLowerCase().includes('the data provided is for your convenience') ||
        description.toLowerCase().includes('does not include robinhood crypto') ||
        description.toLowerCase().includes('does not include robinhood spending')) {
      return;
    }
    
    // Parse date
    const execTime = parseActivityDate(activityDateStr);
    
    // Parse quantity
    let quantity = 0;
    if (quantityStr && quantityStr.trim() !== '') {
      const qtyNum = Number.parseFloat(quantityStr.replace(/[^0-9.-]/g, ''));
      if (!Number.isNaN(qtyNum)) {
        quantity = qtyNum;
      }
    }
    
    if (quantity === 0) {
      // This is the problem! Rows with quantity 0 are being skipped
      console.log(`Row ${i + 1}: SKIPPED - quantity is 0 (transCode: ${transCode}, quantityStr: "${quantityStr}")`);
      return;
    }
    
    // Parse price and amount
    const price = parseMoney(priceStr);
    const grossAmount = parseMoney(amountStr);
    
    if (price === null || grossAmount === null) {
      errors.push({ row: i + 1, message: `Invalid price or amount: price=${priceStr}, amount=${amountStr}` });
      return;
    }
    
    // Determine side
    let side = 'BUY';
    if (transCode === 'BTO' || transCode === 'BUY') {
      side = 'BUY';
      quantity = Math.abs(quantity);
    } else if (transCode === 'STC' || transCode === 'SELL') {
      side = 'SELL';
      quantity = -Math.abs(quantity);
    }
    
    // Create fill
    const fill = {
      sourceBroker: 'robinhood',
      assetClass: 'options', // Will be determined by option parsing
      symbol: instrument.toUpperCase().trim() || 'UNKNOWN',
      quantity: quantity,
      price: price,
      fees: 0,
      side: side,
      execTime: execTime,
      raw: r
    };
    
    fills.push(fill);
    
    if (fills.length <= 5) {
      console.log(`Row ${i + 1}: PARSED - ${transCode} ${fill.symbol} qty=${quantity} price=${price}`);
    }
  } catch (error) {
    errors.push({ row: i + 1, message: error.message });
  }
});

console.log(`\n=== Results ===`);
console.log(`Total fills: ${fills.length}`);
console.log(`Total errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nErrors:');
  errors.slice(0, 5).forEach(e => console.log(`  Row ${e.row}: ${e.message}`));
}


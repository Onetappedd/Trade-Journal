// Test script to debug Robinhood CSV parsing
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Read the CSV file
const csvPath = path.join(__dirname, '..', 'Oct 5, 2022 – Jan 1, 2025 (1).csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

console.log('=== CSV File Analysis ===\n');

// Check first few lines
const firstLines = csvContent.split('\n').slice(0, 5);
console.log('First 5 lines of CSV:');
firstLines.forEach((line, i) => {
  console.log(`${i + 1}: ${line.substring(0, 100)}...`);
});

// Detect delimiter
const firstLine = csvContent.split('\n')[0] || '';
const hasTabs = firstLine.includes('\t');
const delimiter = hasTabs ? '\t' : ',';
console.log(`\nDetected delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);

// Parse CSV
console.log('\n=== Parsing CSV ===\n');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  delimiter: delimiter,
  to_line: 50 // First 50 rows
});

console.log(`Parsed ${records.length} rows\n`);

// Get headers from first record
const rawHeaders = records.length > 0 ? Object.keys(records[0]) : [];
const headers = rawHeaders.map(h => String(h || '').replace(/^["']|["']$/g, '').trim());

console.log('Headers found:');
headers.forEach((h, i) => {
  console.log(`  ${i + 1}. "${h}"`);
});

console.log('\n=== First Row Analysis ===\n');
if (records.length > 0) {
  const firstRow = records[0];
  console.log('First row keys:', Object.keys(firstRow));
  console.log('\nFirst row data:');
  console.log(JSON.stringify(firstRow, null, 2));
  
  // Try to extract values
  console.log('\n=== Value Extraction Test ===\n');
  
  // Build header map
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
  
  // Test get function
  const get = (r, k) => {
    const headerName = headerMap?.[k];
    if (headerName) {
      return r[headerName];
    }
    return r[k] || r[headerMap?.[k.toLowerCase()]] || r[k.toLowerCase()] || r[k.toUpperCase()];
  };
  
  // Extract values
  const activityDateStr = String(get(firstRow, 'activityDate') || '').trim();
  const instrument = String(get(firstRow, 'instrument') || '').trim();
  const description = String(get(firstRow, 'description') || '').trim();
  const transCode = String(get(firstRow, 'transCode') || '').trim().toUpperCase();
  const quantityStr = String(get(firstRow, 'quantity') || '').trim();
  const priceStr = String(get(firstRow, 'price') || '').trim();
  const amountStr = String(get(firstRow, 'amount') || '').trim();
  
  console.log('\nExtracted values:');
  console.log('  activityDate:', activityDateStr);
  console.log('  instrument:', instrument);
  console.log('  description:', description);
  console.log('  transCode:', transCode);
  console.log('  quantityStr:', quantityStr);
  console.log('  priceStr:', priceStr);
  console.log('  amountStr:', amountStr);
  
  // Check if it's a trade row
  const tradeCodes = ['BTO', 'STC', 'BUY', 'SELL'];
  const isTrade = tradeCodes.includes(transCode);
  console.log(`\nIs trade row: ${isTrade} (transCode: "${transCode}")`);
  
  // Check quantity
  let quantity = 0;
  if (quantityStr && quantityStr.trim() !== '') {
    const qtyNum = Number.parseFloat(quantityStr.replace(/[^0-9.-]/g, ''));
    if (!Number.isNaN(qtyNum)) {
      quantity = qtyNum;
    }
  }
  console.log(`Quantity parsed: ${quantity}`);
  
  // Test parseMoney
  function parseMoney(value) {
    if (!value || !value.trim()) return null;
    const trimmed = value.trim();
    const negative = trimmed.startsWith('(') && trimmed.endsWith(')');
    const cleaned = trimmed.replace(/[,$()]/g, '');
    const num = Number.parseFloat(cleaned);
    if (Number.isNaN(num)) return null;
    return negative ? -num : num;
  }
  
  const price = parseMoney(priceStr);
  const grossAmount = parseMoney(amountStr);
  console.log(`Price parsed: ${price}`);
  console.log(`Amount parsed: ${grossAmount}`);
  
  console.log('\n=== Testing Trade Rows ===\n');
  let tradeCount = 0;
  let skippedCount = 0;
  
  records.slice(0, 20).forEach((row, i) => {
    const tc = String(get(row, 'transCode') || '').trim().toUpperCase();
    const qty = String(get(row, 'quantity') || '').trim();
    const desc = String(get(row, 'description') || '').trim();
    
    if (tradeCodes.includes(tc) && qty && qty !== '') {
      tradeCount++;
      console.log(`Row ${i + 1}: ${tc} - ${desc.substring(0, 50)}`);
    } else {
      skippedCount++;
      if (i < 5) {
        console.log(`Row ${i + 1}: SKIP (transCode: "${tc}", qty: "${qty}")`);
      }
    }
  });
  
  console.log(`\nFound ${tradeCount} trade rows in first 20 rows`);
  console.log(`Skipped ${skippedCount} non-trade rows`);
}


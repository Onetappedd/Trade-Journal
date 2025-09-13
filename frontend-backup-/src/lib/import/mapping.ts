/**
 * Header mapping utilities for CSV import
 * Maps various broker-specific column names to canonical field names
 */

export const HEADER_SYNONYMS: Record<string, string[]> = {
  symbol: ['symbol', 'ticker', 'underlying', 'occ_symbol', 'Name'],
  side: ['side', 'action', 'buy/sell', 'b/s', 'Side'],
  quantity: ['qty', 'quantity', 'contracts', 'shares', 'Filled'],
  price: ['price', 'fill price', 'avg price', 'execution price', 'Avg Price', 'Price'],
  trade_time_utc: ['date', 'time', 'datetime', 'timestamp', 'filled at', 'trade date', 'Filled Time', 'PLA TIM', 'Pla Tim'],
  expiry: ['expiration', 'exp', 'expiry'],
  strike: ['strike', 'strike price'],
  option_type: ['type', 'call/put', 'cp'],
  fees: ['fees', 'commission', 'commissions & fees'],
  venue: ['venue', 'exchange', 'broker'],
  underlying: ['underlying', 'root', 'underlier']
};

/**
 * Automatically map CSV headers to canonical field names
 * @param headers Array of header names from CSV
 * @returns Mapping of canonical field names to actual header names (or null if not found)
 */
export function autoMap(headers: string[]): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};
  
  // Initialize all canonical fields as null
  for (const canonicalField of Object.keys(HEADER_SYNONYMS)) {
    mapping[canonicalField] = null;
  }
  
  // For each header, find matching canonical field
  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();
    
    for (const [canonicalField, synonyms] of Object.entries(HEADER_SYNONYMS)) {
      // Check if this header matches any synonym for this canonical field
      const matches = synonyms.some(synonym => 
        normalizedHeader === synonym.toLowerCase() ||
        normalizedHeader.includes(synonym.toLowerCase()) ||
        synonym.toLowerCase().includes(normalizedHeader)
      );
      
      if (matches && !mapping[canonicalField]) {
        // Only map if we haven't already found a match for this canonical field
        mapping[canonicalField] = header;
        break;
      }
    }
  }
  
  return mapping;
}

/**
 * Apply mapping to transform a CSV row to canonical field names
 * @param row Raw CSV row data
 * @param map Mapping from canonical field names to actual header names
 * @returns New object with canonical field names as keys
 */
export function applyMapping(
  row: Record<string, unknown>, 
  map: Record<string, string | null>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [canonicalField, headerName] of Object.entries(map)) {
    if (headerName && row.hasOwnProperty(headerName)) {
      result[canonicalField] = row[headerName];
    }
  }
  
  return result;
}

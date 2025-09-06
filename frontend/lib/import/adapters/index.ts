export interface MappedRow {
  timestamp: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  currency?: string;
  venue?: string;
  order_id?: string;
  exec_id?: string;
  instrument_type?: 'stock' | 'option' | 'etf' | 'future';
  expiry?: string;
  strike?: number;
  option_type?: 'call' | 'put';
  multiplier?: number;
  underlying?: string;
  broker_account_id?: string;
  [key: string]: any; // Allow additional fields
}

export interface AdapterFunction {
  (row: any, mapping: any): MappedRow;
}

// Registry of broker-specific adapters
export const brokerAdapters: Record<string, AdapterFunction> = {
  webull: webullOptionsAdapter,
  ibkr: ibkrFlexAdapter,
};

// Helper function to get the first non-empty value from multiple possible headers
function getFirstNonEmptyValue(row: any, possibleHeaders: string[]): string {
  // First try exact matches from mapping
  for (const header of possibleHeaders) {
    const value = row[header];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  
  // Fallback: try case-insensitive partial matches
  const rowKeys = Object.keys(row);
  for (const header of possibleHeaders) {
    const matchingKey = rowKeys.find(key => 
      key.toLowerCase().includes(header.toLowerCase()) || 
      header.toLowerCase().includes(key.toLowerCase())
    );
    if (matchingKey) {
      const value = row[matchingKey];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }
  
  return '';
}

// Webull options adapter - handles the complex Name field parsing
export function webullOptionsAdapter(row: any, mapping: any): MappedRow {
  console.log('[Webull Adapter] Input row:', row);
  console.log('[Webull Adapter] Input mapping:', mapping);
  
  // Get all possible headers for each field (handles duplicates like "Filled Time" and "Filled Time_2")
  const timestampHeaders = Object.keys(row).filter(key => key.toLowerCase().includes('filled time'));
  const symbolHeaders = Object.keys(row).filter(key => key.toLowerCase().includes('name') || key.toLowerCase().includes('symbol'));
  const sideHeaders = Object.keys(row).filter(key => key.toLowerCase().includes('side'));
  const quantityHeaders = Object.keys(row).filter(key => key.toLowerCase().includes('filled') || key.toLowerCase().includes('quantity'));
  const priceHeaders = Object.keys(row).filter(key => key.toLowerCase().includes('price'));
  const feesHeaders = Object.keys(row).filter(key => key.toLowerCase().includes('fee'));
  
  const baseRow = {
    timestamp: getFirstNonEmptyValue(row, timestampHeaders),
    symbol: getFirstNonEmptyValue(row, symbolHeaders),
    side: (getFirstNonEmptyValue(row, sideHeaders) || '').toLowerCase() as 'buy' | 'sell',
    quantity: parseFloat(getFirstNonEmptyValue(row, quantityHeaders) || '0'),
    price: parseFloat(getFirstNonEmptyValue(row, priceHeaders) || '0'),
    fees: parseFloat(getFirstNonEmptyValue(row, feesHeaders) || '0'),
    currency: row[mapping.currency] || 'USD',
    venue: row[mapping.venue] || 'NASDAQ',
    instrument_type: 'option' as const,
    multiplier: 100,
  };
  
  console.log('[Webull Adapter] Base row:', baseRow);

  // Parse Webull options symbol format: QQQ250822P00563000
  // Format: UNDERLYING + EXPIRY + OPTION_TYPE + STRIKE
  const symbol = row[mapping.symbol] || '';
  console.log('[Webull Adapter] Parsing symbol:', symbol);
  
  if (symbol && symbol.length > 8) {
    try {
      // Extract underlying (everything before the expiry)
      let underlying = '';
      let expiry = '';
      let optionType = '';
      let strike = '';

      // Find the expiry pattern (6 digits: YYMMDD)
      const expiryMatch = symbol.match(/(\d{6})([CP])(\d+)/);
      console.log('[Webull Adapter] Expiry match:', expiryMatch);
      
      if (expiryMatch) {
        const [, expiryStr, optionTypeStr, strikeStr] = expiryMatch;
        
        // Find the underlying by looking for the part before expiry
        const expiryIndex = symbol.indexOf(expiryStr);
        if (expiryIndex > 0) {
          underlying = symbol.substring(0, expiryIndex);
          expiry = expiryStr;
          optionType = optionTypeStr === 'C' ? 'call' : 'put';
          strike = (parseInt(strikeStr) / 1000).toString(); // Convert from Webull format
        }
      }

      if (underlying && expiry && optionType && strike) {
        const result = {
          ...baseRow,
          underlying,
          expiry: `20${expiry.substring(0, 2)}-${expiry.substring(2, 4)}-${expiry.substring(4, 6)}`,
          option_type: optionType as 'call' | 'put',
          strike: parseFloat(strike),
          symbol: `${underlying} ${expiry.substring(2, 4)}/${expiry.substring(4, 6)}/${expiry.substring(0, 2)} ${optionType.toUpperCase()} ${strike}`,
        };
        console.log('[Webull Adapter] Parsed options result:', result);
        return result;
      }
    } catch (error) {
      console.warn('Failed to parse Webull options symbol:', symbol, error);
    }
  }

  console.log('[Webull Adapter] Returning base row (no options parsing):', baseRow);
  return baseRow;
}

// Interactive Brokers Flex adapter - handles XML-specific transformations
export function ibkrFlexAdapter(row: any, mapping: any): MappedRow {
  const baseRow = {
    timestamp: row[mapping.timestamp] || '',
    symbol: row[mapping.symbol] || '',
    side: (row[mapping.side] || '').toLowerCase() as 'buy' | 'sell',
    quantity: parseFloat(row[mapping.quantity] || '0'),
    price: parseFloat(row[mapping.price] || '0'),
    fees: parseFloat(row[mapping.fees] || '0'),
    currency: row[mapping.currency] || 'USD',
    venue: row[mapping.venue] || 'SMART',
    order_id: row[mapping.order_id] || '',
    exec_id: row[mapping.exec_id] || '',
    instrument_type: (row[mapping.instrument_type] || 'stock').toLowerCase() as 'stock' | 'option' | 'etf' | 'future',
    multiplier: parseFloat(row[mapping.multiplier] || '1'),
  };

  // Handle IBKR-specific option parsing
  if (baseRow.instrument_type === 'option' && row[mapping.expiry] && row[mapping.strike] && row[mapping.option_type]) {
    return {
      ...baseRow,
      expiry: row[mapping.expiry],
      strike: parseFloat(row[mapping.strike]),
      option_type: (row[mapping.option_type] || '').toLowerCase() as 'call' | 'put',
      underlying: row[mapping.underlying] || '',
    };
  }

  return baseRow;
}

// Generic adapter for unknown brokers - minimal transformation
export function genericAdapter(row: any, mapping: any): MappedRow {
  return {
    timestamp: row[mapping.timestamp] || '',
    symbol: row[mapping.symbol] || '',
    side: (row[mapping.side] || '').toLowerCase() as 'buy' | 'sell',
    quantity: parseFloat(row[mapping.quantity] || '0'),
    price: parseFloat(row[mapping.price] || '0'),
    fees: parseFloat(row[mapping.fees] || '0'),
    currency: row[mapping.currency] || 'USD',
    venue: row[mapping.venue] || '',
    order_id: row[mapping.order_id] || '',
    exec_id: row[mapping.exec_id] || '',
    instrument_type: (row[mapping.instrument_type] || 'stock').toLowerCase() as 'stock' | 'option' | 'etf' | 'future',
    expiry: row[mapping.expiry] || '',
    strike: row[mapping.strike] ? parseFloat(row[mapping.strike]) : undefined,
    option_type: row[mapping.option_type] ? (row[mapping.option_type] || '').toLowerCase() as 'call' | 'put' : undefined,
    multiplier: row[mapping.multiplier] ? parseFloat(row[mapping.multiplier]) : undefined,
    underlying: row[mapping.underlying] || '',
  };
}

// Main adapter function that routes to the appropriate broker adapter
export function applyBrokerAdapter(row: any, mapping: any): MappedRow {
  const broker = mapping.broker?.toLowerCase();
  
  if (broker && brokerAdapters[broker]) {
    return brokerAdapters[broker](row, mapping);
  }
  
  return genericAdapter(row, mapping);
}

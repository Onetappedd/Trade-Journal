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

// Webull options adapter - handles the complex Name field parsing
export function webullOptionsAdapter(row: any, mapping: any): MappedRow {
  const baseRow = {
    timestamp: row[mapping.timestamp] || '',
    symbol: row[mapping.symbol] || '',
    side: (row[mapping.side] || '').toLowerCase() as 'buy' | 'sell',
    quantity: parseFloat(row[mapping.quantity] || '0'),
    price: parseFloat(row[mapping.price] || '0'),
    fees: parseFloat(row[mapping.fees] || '0'),
    currency: row[mapping.currency] || 'USD',
    venue: row[mapping.venue] || 'NASDAQ',
    instrument_type: 'option' as const,
    multiplier: 100,
  };

  // Parse Webull options symbol format: QQQ250822P00563000
  // Format: UNDERLYING + EXPIRY + OPTION_TYPE + STRIKE
  const symbol = row[mapping.symbol] || '';
  if (symbol && symbol.length > 8) {
    try {
      // Extract underlying (everything before the expiry)
      let underlying = '';
      let expiry = '';
      let optionType = '';
      let strike = '';

      // Find the expiry pattern (6 digits: YYMMDD)
      const expiryMatch = symbol.match(/(\d{6})([CP])(\d+)/);
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
        return {
          ...baseRow,
          underlying,
          expiry: `20${expiry.substring(0, 2)}-${expiry.substring(2, 4)}-${expiry.substring(4, 6)}`,
          option_type: optionType as 'call' | 'put',
          strike: parseFloat(strike),
          symbol: `${underlying} ${expiry.substring(2, 4)}/${expiry.substring(4, 6)}/${expiry.substring(0, 2)} ${optionType.toUpperCase()} ${strike}`,
        };
      }
    } catch (error) {
      console.warn('Failed to parse Webull options symbol:', symbol, error);
    }
  }

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

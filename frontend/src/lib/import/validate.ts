/**
 * Data validation and normalization utilities
 * Validates and transforms raw CSV data into canonical trade format
 */

import { z } from 'zod';
import { parseISO, isValid, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Parse Webull options symbol (e.g., TSLA250822C00325000)
 * Format: SYMBOL + YYMMDD + C/P + STRIKE (padded to 8 digits)
 */
function parseWebullOptionsSymbol(symbol: string): {
  underlying: string;
  expiry: string;
  option_type: 'CALL' | 'PUT';
  strike: number;
} | null {
  // Match pattern: SYMBOL + YYMMDD + C/P + STRIKE
  const match = symbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) return null;

  const [, underlying, dateStr, typeStr, strikeStr] = match;
  
  // Parse date: YYMMDD -> YYYY-MM-DD
  const year = 2000 + parseInt(dateStr.substring(0, 2));
  const month = dateStr.substring(2, 4);
  const day = dateStr.substring(4, 6);
  const expiry = `${year}-${month}-${day}`;
  
  // Parse option type
  const option_type = typeStr === 'C' ? 'CALL' : 'PUT';
  
  // Parse strike (remove leading zeros and convert to decimal)
  const strike = parseFloat(strikeStr) / 1000;
  
  return {
    underlying,
    expiry,
    option_type,
    strike
  };
}

/**
 * Convert various date/time formats to UTC ISO string
 * @param input Date string in various broker formats
 * @returns ISO UTC string
 * @throws Error if date cannot be parsed
 */
export function toUTC(input: string): string {
  const trimmed = input.trim();
  
  if (!trimmed) {
    throw new Error('Date is required');
  }

  // Handle Webull timestamp format like "08/09:ED1" or "08/12:!"
  // This appears to be MM/DD:HH format (truncated)
  if (trimmed.match(/^\d{2}\/\d{2}:/)) {
    // For now, use current date with estimated time
    // In production, you might want to parse this more accurately
    const today = new Date();
    const [month, day] = trimmed.split('/');
    const currentYear = today.getFullYear();
    
    try {
      const date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
      if (isValid(date)) {
        return date.toISOString();
      }
    } catch {
      // Fall through to other parsing methods
    }
  }

  // Common broker date formats
  const formats = [
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm:ss.SSS',
    'MM/dd/yyyy HH:mm:ss',
    'MM/dd/yyyy HH:mm:ss.SSS',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-ddTHH:mm:ss',
    'yyyy-MM-ddTHH:mm:ss.SSS',
    'yyyy-MM-ddTHH:mm:ss.SSSZ'
  ];

  // Try parsing with common formats
  for (const formatStr of formats) {
    try {
      const parsed = parseISO(trimmed);
      if (isValid(parsed)) {
        return parsed.toISOString();
      }
    } catch {
      // Continue to next format
    }
  }

  // Try direct ISO parsing
  try {
    const parsed = parseISO(trimmed);
    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  } catch {
    // Continue to fallback
  }

  // Fallback: try to parse as timestamp
  const timestamp = Number(trimmed);
  if (!isNaN(timestamp) && timestamp > 0) {
    const date = new Date(timestamp);
    if (isValid(date)) {
      return date.toISOString();
    }
  }

  throw new Error(`Unable to parse date: ${trimmed}`);
}

/**
 * Normalize and validate a raw CSV row
 * @param raw Raw CSV row data
 * @returns Normalized data or validation errors
 */
export function normalizeRow(raw: Record<string, unknown>): 
  { ok: true; value: Record<string, unknown> } | { ok: false; errors: string[] } {
  
  const errors: string[] = [];
  const normalized: Record<string, unknown> = {};

  // Helper function to add errors
  const addError = (field: string, message: string) => {
    errors.push(`${field}: ${message}`);
  };

  // Helper function to trim strings
  const trimString = (value: unknown): string | null => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return null;
  };

  // Helper function to parse number (handles Webull format like "@3.51")
  const parseNumber = (value: unknown, field: string): number | null => {
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        addError(field, 'must be a finite number');
        return null;
      }
      return value;
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return null;
      
      // Handle Webull price format like "@3.51" or "3.51"
      const cleanValue = trimmed.replace(/^@/, '');
      
      const parsed = Number(cleanValue);
      if (!isFinite(parsed)) {
        addError(field, 'must be a valid number');
        return null;
      }
      return parsed;
    }
    
    return null;
  };

  // Process each field
  for (const [key, value] of Object.entries(raw)) {
    const trimmedKey = key.trim().toLowerCase();
    
    switch (trimmedKey) {
      case 'symbol':
        const symbol = trimString(value);
        if (symbol) {
          const upperSymbol = symbol.toUpperCase();
          normalized.symbol = upperSymbol;
          
          // Try to parse as Webull options symbol
          const optionsData = parseWebullOptionsSymbol(upperSymbol);
          if (optionsData) {
            normalized.underlying = optionsData.underlying;
            normalized.expiry = optionsData.expiry;
            normalized.option_type = optionsData.option_type;
            normalized.strike = optionsData.strike;
            normalized.asset_type = 'option';
          }
        }
        break;
        
      case 'side':
        const side = trimString(value);
        if (side) {
          const normalizedSide = side.toUpperCase();
          
          // Handle complex side formats
          if (normalizedSide.includes('BUY_TO_OPEN')) {
            normalized.side = 'BUY';
            normalized.open_close = 'OPEN';
          } else if (normalizedSide.includes('SELL_TO_CLOSE')) {
            normalized.side = 'SELL';
            normalized.open_close = 'CLOSE';
          } else if (normalizedSide === 'B' || normalizedSide === 'BUY') {
            normalized.side = 'BUY';
          } else if (normalizedSide === 'S' || normalizedSide === 'SELL') {
            normalized.side = 'SELL';
          } else {
            addError('side', `invalid value: ${side}`);
          }
        }
        break;
        
      case 'quantity':
        const quantity = parseNumber(value, 'quantity');
        if (quantity !== null) {
          if (quantity <= 0) {
            addError('quantity', 'must be a positive number');
          } else {
            normalized.quantity = quantity;
          }
        }
        break;
        
      case 'price':
        const price = parseNumber(value, 'price');
        if (price !== null) {
          if (price < 0) {
            addError('price', 'must be a non-negative number');
          } else {
            normalized.price = price;
          }
        }
        break;
        
      case 'fees':
        const fees = parseNumber(value, 'fees');
        if (fees !== null) {
          normalized.fees = fees;
        }
        break;
        
      case 'trade_time_utc':
        const timeStr = trimString(value);
        if (timeStr) {
          try {
            normalized.trade_time_utc = toUTC(timeStr);
          } catch (error) {
            addError('trade_time_utc', error instanceof Error ? error.message : 'invalid date format');
          }
        }
        break;
        
      case 'underlying':
        const underlying = trimString(value);
        if (underlying) {
          normalized.underlying = underlying.toUpperCase();
        }
        break;
        
      case 'expiry':
      case 'expiration':
        const expiry = trimString(value);
        if (expiry) {
          try {
            normalized.expiry = toUTC(expiry);
          } catch (error) {
            addError('expiry', error instanceof Error ? error.message : 'invalid date format');
          }
        }
        break;
        
      case 'strike':
        const strike = parseNumber(value, 'strike');
        if (strike !== null) {
          if (strike <= 0) {
            addError('strike', 'must be a positive number');
          } else {
            normalized.strike = strike;
          }
        }
        break;
        
      case 'option_type':
        const optionType = trimString(value);
        if (optionType) {
          const normalizedType = optionType.toUpperCase();
          if (normalizedType === 'CALL' || normalizedType === 'PUT') {
            normalized.option_type = normalizedType;
          } else {
            addError('option_type', `must be CALL or PUT, got: ${optionType}`);
          }
        }
        break;
        
      case 'venue':
        const venue = trimString(value);
        if (venue) {
          normalized.venue = venue.toUpperCase();
        }
        break;
        
      case 'source':
        const source = trimString(value);
        if (source) {
          normalized.source = source.toUpperCase();
        }
        break;
        
      default:
        // Pass through other fields as-is
        normalized[key] = value;
    }
  }

  // Validate required fields
  if (!normalized.symbol) {
    addError('symbol', 'is required');
  }
  
  if (!normalized.side) {
    addError('side', 'is required');
  }
  
  if (!normalized.quantity) {
    addError('quantity', 'is required');
  }
  
  if (!normalized.price) {
    addError('price', 'is required');
  }
  
  if (!normalized.trade_time_utc) {
    addError('trade_time_utc', 'is required');
  }

  // Set default asset type if not set
  if (!normalized.asset_type) {
    normalized.asset_type = 'equity';
  }

  // Validate options-specific fields
  if (normalized.asset_type === 'option' || normalized.option_type || normalized.strike || normalized.expiry) {
    if (!normalized.underlying) {
      addError('underlying', 'is required for options');
    }
    if (!normalized.expiry) {
      addError('expiry', 'is required for options');
    }
    if (!normalized.strike) {
      addError('strike', 'is required for options');
    }
    if (!normalized.option_type) {
      addError('option_type', 'is required for options');
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: normalized };
}

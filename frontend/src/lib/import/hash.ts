/**
 * Generate a stable hash for a row of data to detect duplicates
 * Normalizes data before hashing to ensure consistent results
 */

/**
 * Generate execution hash that matches the database function
 * This should produce the same hash as the compute_execution_hash function
 */
export async function executionHash(execution: {
  timestamp: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  broker_account_id?: string | null;
}): Promise<string> {
  // Create the same concatenation as the database function
  const hashInput = [
    execution.timestamp,
    execution.symbol,
    execution.side,
    Math.abs(execution.quantity).toString(),
    execution.price.toString(),
    execution.broker_account_id || ''
  ].join('|');
  
  // Use Web Crypto in browser, Node's crypto on server
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    // Browser environment
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(hashInput);
    return hash.digest('hex');
  }
}

export async function rowHash(obj: Record<string, unknown>): Promise<string> {
  const normalized = normalizeForHashing(obj);
  const jsonString = JSON.stringify(normalized);
  
  // Use Web Crypto in browser, Node's crypto on server
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    // Browser environment
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(jsonString);
    return hash.digest('hex');
  }
}

/**
 * Normalize object for consistent hashing
 */
function normalizeForHashing(obj: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  
  // Sort keys for stable order
  const sortedKeys = Object.keys(obj).sort();
  
  for (const key of sortedKeys) {
    const value = obj[key];
    
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }
    
    // Handle different value types
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        continue; // Skip empty strings
      }
      
      // Convert to lowercase for specific fields
      if (shouldLowercase(key)) {
        normalized[key] = trimmed.toLowerCase();
      } else {
        normalized[key] = trimmed;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively normalize nested objects
      if (Array.isArray(value)) {
        normalized[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? normalizeForHashing(item as Record<string, unknown>)
            : item
        );
      } else {
        normalized[key] = normalizeForHashing(value as Record<string, unknown>);
      }
    } else {
      // Keep primitive values as-is
      normalized[key] = value;
    }
  }
  
  return normalized;
}

/**
 * Determine if a field should be lowercased for consistent hashing
 */
function shouldLowercase(key: string): boolean {
  const lowercaseFields = [
    'symbol',
    'side', 
    'option_type',
    'open_close',
    'venue',
    'source'
  ];
  
  return lowercaseFields.includes(key.toLowerCase());
}

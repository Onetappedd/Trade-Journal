import pino from 'pino';

// Create base logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
});

// Utility function to mask PII in data
function maskPII(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => maskPII(item));
  }

  const masked = { ...data };
  
  // Fields that might contain PII
  const piiFields = [
    'email', 'emailAddress', 'userEmail',
    'phone', 'phoneNumber', 'phoneNumber',
    'address', 'streetAddress', 'billingAddress',
    'ssn', 'socialSecurityNumber',
    'name', 'firstName', 'lastName', 'fullName',
    'username', 'userName',
    'id', 'userId', 'user_id', 'externalId', 'external_id'
  ];

  for (const field of piiFields) {
    if (masked[field] !== undefined) {
      if (typeof masked[field] === 'string') {
        masked[field] = masked[field].length > 4 
          ? `${masked[field].substring(0, 2)}***${masked[field].substring(masked[field].length - 2)}`
          : '***';
      } else {
        masked[field] = '***';
      }
    }
  }

  // Recursively mask nested objects
  for (const key in masked) {
    if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskPII(masked[key]);
    }
  }

  return masked;
}

// Create child logger for Webull imports
export const webullLogger = logger.child({ 
  module: 'import:webull' 
});

// Enhanced logging function that masks PII
export function logWebullImport(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: any
) {
  const maskedData = data ? maskPII(data) : undefined;
  
  if (level === 'error') {
    webullLogger.error({ data: maskedData }, message);
  } else if (level === 'warn') {
    webullLogger.warn({ data: maskedData }, message);
  } else {
    webullLogger.info({ data: maskedData }, message);
  }
}

// Specific logging functions for different import stages
export function logImportStart(fileId: string, userId: string, fileName?: string) {
  logWebullImport('info', 'Webull import started', {
    fileId,
    userId,
    fileName: fileName ? fileName.substring(0, 50) + '...' : undefined
  });
}

export function logImportSummary(
  fileId: string, 
  userId: string, 
  summary: {
    totalRows: number;
    parsedRows: number;
    filledRows: number;
    importedRows: number;
    skipped: Record<string, number>;
  }
) {
  logWebullImport('info', 'Webull import summary', {
    fileId,
    userId,
    summary
  });
}

export function logImportErrors(
  fileId: string,
  userId: string,
  errors: Array<{
    rowIndex: number;
    code: string;
    message: string;
    symbolRaw: string;
  }>
) {
  // Log first 3 errors only
  const firstThreeErrors = errors.slice(0, 3);
  
  logWebullImport('warn', 'Webull import errors detected', {
    fileId,
    userId,
    errorCount: errors.length,
    firstErrors: firstThreeErrors
  });
}

export function logImportComplete(
  fileId: string,
  userId: string,
  result: {
    inserted: number;
    duplicatesSkipped: number;
    errors: number;
  }
) {
  logWebullImport('info', 'Webull import completed', {
    fileId,
    userId,
    result
  });
}

export function logImportError(
  fileId: string,
  userId: string,
  error: Error,
  context?: string
) {
  logWebullImport('error', `Webull import failed${context ? ` in ${context}` : ''}`, {
    fileId,
    userId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
}

export default logger;

/**
 * API Error Types
 * 
 * Standardized error shapes for consistent error handling across the application.
 * All API routes should return errors in this format.
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * Standard error codes used across the application
 */
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  QUERY_TIMEOUT: 'QUERY_TIMEOUT',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  
  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Generic errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * HTTP status code mapping for error codes
 */
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOKEN_EXPIRED: 401,
  INVALID_TOKEN: 401,
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  NOT_FOUND: 404,
  RESOURCE_CONFLICT: 409,
  RESOURCE_LIMIT_EXCEEDED: 429,
  DATABASE_ERROR: 500,
  CONSTRAINT_VIOLATION: 400,
  QUERY_TIMEOUT: 504,
  EXTERNAL_SERVICE_ERROR: 502,
  STRIPE_ERROR: 502,
  EMAIL_SERVICE_ERROR: 502,
  FILE_TOO_LARGE: 413,
  INVALID_FILE_TYPE: 400,
  UPLOAD_FAILED: 500,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  NETWORK_ERROR: 502,
  UNKNOWN_ERROR: 500
};

/**
 * Create a standardized API error response
 */
export function createApiError(
  code: ErrorCode,
  message: string,
  details?: any,
  timestamp?: string
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      timestamp: timestamp || new Date().toISOString()
    }
  };
}

/**
 * Create a standardized API success response
 */
export function createApiSuccess<T>(data: T): ApiResponse<T> {
  return {
    data,
    success: true
  };
}

/**
 * Check if an error is a known API error
 */
export function isApiError(error: any): error is ApiErrorResponse {
  return error && typeof error === 'object' && 'error' in error && 'code' in error.error;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (isApiError(error)) {
    return error.error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
  if (isApiError(error)) {
    const code = error.error.code;
    
    if (code === ERROR_CODES.INTERNAL_SERVER_ERROR || 
        code === ERROR_CODES.DATABASE_ERROR ||
        code === ERROR_CODES.EXTERNAL_SERVICE_ERROR) {
      return 'critical';
    }
    
    if (code === ERROR_CODES.UNAUTHORIZED || 
        code === ERROR_CODES.FORBIDDEN ||
        code === ERROR_CODES.RESOURCE_LIMIT_EXCEEDED) {
      return 'high';
    }
    
    if (code === ERROR_CODES.VALIDATION_ERROR || 
        code === ERROR_CODES.INVALID_INPUT ||
        code === ERROR_CODES.FILE_TOO_LARGE) {
      return 'medium';
    }
    
    return 'low';
  }
  
  return 'medium';
}

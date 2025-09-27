/**
 * Error mapping utilities for Supabase Auth and PostgREST errors
 * Maps technical error codes to user-friendly messages
 */

export interface ApiResponse {
  ok: boolean;
  code?: string;
  message?: string;
  details?: any;
}

/**
 * Maps Supabase Auth errors to friendly messages
 */
export function mapAuthError(error: any): { code: string; message: string } {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';

  // Common Supabase Auth error patterns
  if (errorMessage.includes('requires-recent-login')) {
    return {
      code: 'REQUIRES_RECENT_LOGIN',
      message: 'For security reasons, please sign in again before making this change.'
    };
  }

  if (errorMessage.includes('Password should be at least')) {
    return {
      code: 'WEAK_PASSWORD',
      message: 'Password must be at least 6 characters long.'
    };
  }

  if (errorMessage.includes('Invalid login credentials')) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please check your credentials.'
    };
  }

  if (errorMessage.includes('User not found')) {
    return {
      code: 'USER_NOT_FOUND',
      message: 'User account not found. Please try signing in again.'
    };
  }

  if (errorMessage.includes('Email not confirmed')) {
    return {
      code: 'EMAIL_NOT_CONFIRMED',
      message: 'Please check your email and click the confirmation link.'
    };
  }

  if (errorMessage.includes('Too many requests')) {
    return {
      code: 'RATE_LIMITED',
      message: 'Too many attempts. Please wait a moment and try again.'
    };
  }

  if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.'
    };
  }

  // Default fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage || 'An unexpected error occurred. Please try again.'
  };
}

/**
 * Maps PostgREST/PostgreSQL errors to friendly messages
 */
export function mapDatabaseError(error: any): { code: string; message: string } {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // PostgreSQL error codes
  switch (errorCode) {
    case '23505': // Unique constraint violation
      if (errorMessage.includes('username')) {
        return {
          code: 'USERNAME_TAKEN',
          message: 'This username is already taken. Please choose a different one.'
        };
      }
      if (errorMessage.includes('email')) {
        return {
          code: 'EMAIL_TAKEN',
          message: 'This email is already registered. Please use a different email.'
        };
      }
      return {
        code: 'DUPLICATE_ENTRY',
        message: 'This information is already in use. Please choose something different.'
      };

    case '23503': // Foreign key constraint violation
      return {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Cannot delete this item because it is referenced by other data.'
      };

    case '23502': // Not null constraint violation
      return {
        code: 'REQUIRED_FIELD',
        message: 'Please fill in all required fields.'
      };

    case '23514': // Check constraint violation
      return {
        code: 'INVALID_VALUE',
        message: 'The value provided is not valid. Please check your input.'
      };

    case '42P01': // Undefined table
      return {
        code: 'TABLE_NOT_FOUND',
        message: 'Database table not found. Please contact support.'
      };

    case '42703': // Undefined column
      return {
        code: 'COLUMN_NOT_FOUND',
        message: 'Database column not found. Please contact support.'
      };

    case 'PGRST301': // RLS policy error
      return {
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to perform this action.'
      };

    default:
      return {
        code: 'DATABASE_ERROR',
        message: errorMessage || 'A database error occurred. Please try again.'
      };
  }
}

/**
 * Creates a standardized API response
 */
export function createApiResponse(
  ok: boolean,
  code?: string,
  message?: string,
  details?: any
): ApiResponse {
  return {
    ok,
    ...(code && { code }),
    ...(message && { message }),
    ...(details && { details })
  };
}

/**
 * Creates a success response
 */
export function createSuccessResponse(message: string = 'Success'): ApiResponse {
  return createApiResponse(true, 'SUCCESS', message);
}

/**
 * Creates an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ApiResponse {
  return createApiResponse(false, code, message, details);
}

/**
 * Handles and maps any error to a standardized response
 */
export function handleError(error: any): ApiResponse {
  console.error('API Error:', error);

  // Check if it's a Supabase Auth error
  if (error?.message && typeof error.message === 'string') {
    if (error.message.includes('Auth') || error.message.includes('auth')) {
      const mapped = mapAuthError(error);
      return createErrorResponse(mapped.code, mapped.message);
    }
  }

  // Check if it's a database error
  if (error?.code && typeof error.code === 'string') {
    const mapped = mapDatabaseError(error);
    return createErrorResponse(mapped.code, mapped.message);
  }

  // Check if it's a network error
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return createErrorResponse('NETWORK_ERROR', 'Network error. Please check your connection and try again.');
  }

  // Default error handling
  return createErrorResponse(
    'UNKNOWN_ERROR',
    error?.message || 'An unexpected error occurred. Please try again.',
    process.env.NODE_ENV === 'development' ? error : undefined
  );
}


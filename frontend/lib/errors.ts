import { toast } from 'sonner';

// Client-safe monitoring functions (no server-only env vars)
const captureException = (error: Error, context?: any) => {
  console.error('Error captured:', error, context);
};

const setUser = (user: any) => {
  console.log('User set:', user);
};

const setTag = (key: string, value: string) => {
  console.log('Tag set:', key, value);
};

// Error types for better categorization
export type ErrorType = 
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'rate_limit'
  | 'server_error'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  originalError?: any;
}

/**
 * Converts any error to a user-friendly message
 */
export function toUserMessage(err: any): string {
  if (!err) return 'An unexpected error occurred';
  
  // Handle AppError objects
  if (err.type && err.message) {
    return err.message;
  }
  
  // Handle API error responses
  if (err.error) {
    return err.error;
  }
  
  // Handle HTTP status errors
  if (err.status) {
    switch (err.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Please sign in to continue.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
  
  // Handle Error objects
  if (err instanceof Error) {
    // Filter out technical error messages
    const message = err.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (message.includes('cors')) {
      return 'Cross-origin error. Please refresh the page.';
    }
    
    // For known error messages, return them as-is
    if (message.includes('pro access required') || 
        message.includes('subscription required') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')) {
      return err.message;
    }
    
    // For other errors, return a generic message
    return 'Something went wrong. Please try again.';
  }
  
  // Handle string errors
  if (typeof err === 'string') {
    return err;
  }
  
  // Handle objects with message property
  if (err.message && typeof err.message === 'string') {
    return err.message;
  }
  
  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Shows a toast with the error message and reports to Sentry
 */
export function toastApiError(err: any, options?: {
  title?: string;
  reportToTelemetry?: boolean;
  fallbackMessage?: string;
  userId?: string;
  context?: string;
}) {
  const message = toUserMessage(err);
  const title = options?.title || 'Error';
  
  // Show toast
  toast.error(message, {
    id: `error-${Date.now()}`, // Prevent duplicate toasts
    description: title !== 'Error' ? title : undefined,
  });
  
  // Report to Sentry if enabled
  if (options?.reportToTelemetry !== false) {
    try {
      // Set user context if available
      if (options?.userId) {
        setUser({ id: options.userId });
      }
      
      // Set context tags
      if (options?.context) {
        setTag('error_context', options.context);
      }
      
      // Capture the error in Sentry
      if (err instanceof Error) {
        captureException(err, {
          tags: {
            error_type: 'api_error',
            error_title: title,
            error_context: options?.context || 'unknown',
          },
          extra: {
            userMessage: message,
            originalError: err,
          },
        });
      } else {
        // For non-Error objects, create a new Error
        const error = new Error(message);
        error.name = 'APIError';
        captureException(error, {
          tags: {
            error_type: 'api_error',
            error_title: title,
            error_context: options?.context || 'unknown',
          },
          extra: {
            userMessage: message,
            originalError: err,
          },
        });
      }
    } catch (sentryError) {
      // Fallback to console if Sentry fails
      console.error('API Error:', {
        error: err,
        userMessage: message,
        title,
        timestamp: new Date().toISOString(),
        sentryError,
      });
    }
  }
  
  return message;
}

/**
 * Higher-order function that wraps API calls with automatic error handling
 */
export function wrapApi<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: {
    errorTitle?: string;
    reportToTelemetry?: boolean;
    onError?: (error: any, userMessage: string) => void;
    onSuccess?: (result: R) => Promise<void> | void;
    userId?: string;
    context?: string;
  }
) {
  return async (...args: T): Promise<R> => {
    try {
      const result = await fn(...args);
      
      // Call success callback if provided
      if (options?.onSuccess) {
        await options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const userMessage = toUserMessage(error);
      
      // Show toast error with Sentry reporting
      toastApiError(error, {
        title: options?.errorTitle,
        reportToTelemetry: options?.reportToTelemetry,
        userId: options?.userId,
        context: options?.context,
      });
      
      // Call error callback if provided
      if (options?.onError) {
        options.onError(error, userMessage);
      }
      
      // Re-throw the error so calling code can handle it if needed
      throw error;
    }
  };
}

/**
 * Creates a wrapped API function with specific error handling
 */
export function createWrappedApi<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorTitle: string,
  options?: {
    userId?: string;
    context?: string;
    reportToTelemetry?: boolean;
  }
) {
  return wrapApi(fn, { errorTitle, ...options });
}

/**
 * Utility to handle common API error patterns
 */
export function handleApiError(err: any, context?: string): AppError {
  const message = toUserMessage(err);
  
  let type: ErrorType = 'unknown';
  
  if (err.status) {
    switch (err.status) {
      case 400:
        type = 'validation';
        break;
      case 401:
        type = 'authentication';
        break;
      case 403:
        type = 'authorization';
        break;
      case 404:
        type = 'not_found';
        break;
      case 429:
        type = 'rate_limit';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = 'server_error';
        break;
      default:
        type = 'unknown';
    }
  } else if (err.message) {
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch')) {
      type = 'network';
    } else if (msg.includes('validation') || msg.includes('invalid')) {
      type = 'validation';
    } else if (msg.includes('unauthorized') || msg.includes('sign in')) {
      type = 'authentication';
    } else if (msg.includes('forbidden') || msg.includes('permission')) {
      type = 'authorization';
    }
  }
  
  return {
    type,
    message,
    code: err.code || err.status?.toString(),
    details: err.details || err,
    originalError: err,
  };
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error: any) => {
      // Retry on network errors and 5xx server errors
      if (error.status && error.status >= 500) return true;
      if (error.message?.toLowerCase().includes('network')) return true;
      if (error.message?.toLowerCase().includes('timeout')) return true;
      return false;
    }
  } = options;
  
  return async (...args: T): Promise<R> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Don't retry if we've reached max retries or shouldn't retry this error
        if (attempt === maxRetries || !shouldRetry(error)) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
}

/**
 * Utility to create a wrapped API with retry logic
 */
export function createRetryApi<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorTitle: string,
  retryOptions?: Parameters<typeof withRetry>[1]
) {
  const retryFn = withRetry(fn, retryOptions);
  return wrapApi(retryFn, { errorTitle });
}

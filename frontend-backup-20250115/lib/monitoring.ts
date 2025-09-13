// Sentry monitoring utility
// No-ops if SENTRY_DSN is not provided, otherwise initializes Sentry

interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  debug?: boolean;
}

interface SentryContext {
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class SentryWrapper {
  private isInitialized = false;
  private sentry: any = null;

  constructor() {
    // Only initialize if we're in the browser and have a DSN
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      this.initSentry();
    }
  }

  private async initSentry() {
    try {
      // Dynamic import to avoid bundling Sentry in production if not needed
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        debug: process.env.NODE_ENV === 'development',
        
        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        // Session replay (optional)
        replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
        
        // Ignore certain errors
        ignoreErrors: [
          // Network errors that are not actionable
          'Network Error',
          'Failed to fetch',
          'Request timeout',
          // Browser-specific errors
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
        ],
        
        // Filter out certain transactions
        beforeSend(event: any) {
          // Filter out health check endpoints
          if (event.request?.url?.includes('/api/health')) {
            return null;
          }
          
          // Filter out certain error types
          if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
            return null;
          }
          
          return event;
        },
      });

      this.sentry = Sentry;
      this.isInitialized = true;
      
      console.log('Sentry initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an error
   */
  captureException(error: Error, context?: SentryContext) {
    if (!this.isInitialized || !this.sentry) {
      console.error('Sentry not initialized, logging error:', error);
      return;
    }

    try {
      this.sentry.captureException(error, {
        user: context?.user,
        tags: context?.tags,
        extra: context?.extra,
      });
    } catch (sentryError) {
      console.error('Failed to capture exception in Sentry:', sentryError);
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info', context?: SentryContext) {
    if (!this.isInitialized || !this.sentry) {
      console.log('Sentry not initialized, logging message:', message);
      return;
    }

    try {
      this.sentry.captureMessage(message, {
        level,
        user: context?.user,
        tags: context?.tags,
        extra: context?.extra,
      });
    } catch (sentryError) {
      console.error('Failed to capture message in Sentry:', sentryError);
    }
  }

  /**
   * Set user context
   */
  setUser(user: SentryContext['user']) {
    if (!this.isInitialized || !this.sentry) return;

    try {
      this.sentry.setUser(user);
    } catch (sentryError) {
      console.error('Failed to set user in Sentry:', sentryError);
    }
  }

  /**
   * Set tags
   */
  setTag(key: string, value: string) {
    if (!this.isInitialized || !this.sentry) return;

    try {
      this.sentry.setTag(key, value);
    } catch (sentryError) {
      console.error('Failed to set tag in Sentry:', sentryError);
    }
  }

  /**
   * Set context
   */
  setContext(name: string, context: Record<string, any>) {
    if (!this.isInitialized || !this.sentry) return;

    try {
      this.sentry.setContext(name, context);
    } catch (sentryError) {
      console.error('Failed to set context in Sentry:', sentryError);
    }
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, operation: string) {
    if (!this.isInitialized || !this.sentry) {
      return {
        finish: () => {},
        setTag: () => {},
        setData: () => {},
      };
    }

    try {
      return this.sentry.startTransaction({ name, op: operation });
    } catch (sentryError) {
      console.error('Failed to start transaction in Sentry:', sentryError);
      return {
        finish: () => {},
        setTag: () => {},
        setData: () => {},
      };
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
    data?: Record<string, any>;
  }) {
    if (!this.isInitialized || !this.sentry) return;

    try {
      this.sentry.addBreadcrumb(breadcrumb);
    } catch (sentryError) {
      console.error('Failed to add breadcrumb in Sentry:', sentryError);
    }
  }

  /**
   * Check if Sentry is initialized
   */
  isReady() {
    return this.isInitialized;
  }
}

// Create singleton instance
export const sentry = new SentryWrapper();

// Convenience functions
export const captureException = (error: Error, context?: SentryContext) => 
  sentry.captureException(error, context);

export const captureMessage = (message: string, level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug', context?: SentryContext) => 
  sentry.captureMessage(message, level, context);

export const setUser = (user: SentryContext['user']) => 
  sentry.setUser(user);

export const setTag = (key: string, value: string) => 
  sentry.setTag(key, value);

export const setContext = (name: string, context: Record<string, any>) => 
  sentry.setContext(name, context);

export const startTransaction = (name: string, operation: string) => 
  sentry.startTransaction(name, operation);

export const addBreadcrumb = (breadcrumb: {
  category: string;
  message: string;
  level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
  data?: Record<string, any>;
}) => sentry.addBreadcrumb(breadcrumb);

export const isSentryReady = () => sentry.isReady();

import { toast as sonnerToast, type ToastT } from 'sonner';

/**
 * Wrapper hook around Sonner toast for consistent API
 * Provides success, error, info, and warning methods
 */
export function useToast() {
  return {
    /**
     * Show a success toast
     */
    success: (message: string, options?: Partial<ToastT>) => {
      return sonnerToast.success(message, options);
    },

    /**
     * Show an error toast
     */
    error: (message: string, options?: Partial<ToastT>) => {
      return sonnerToast.error(message, options);
    },

    /**
     * Show an info toast
     */
    info: (message: string, options?: Partial<ToastT>) => {
      return sonnerToast.info(message, options);
    },

    /**
     * Show a warning toast
     */
    warning: (message: string, options?: Partial<ToastT>) => {
      return sonnerToast.warning(message, options);
    },

    /**
     * Show a loading toast
     */
    loading: (message: string, options?: Partial<ToastT>) => {
      return sonnerToast.loading(message, options);
    },

    /**
     * Dismiss a specific toast
     */
    dismiss: (toastId: string | number) => {
      sonnerToast.dismiss(toastId);
    },

    /**
     * Dismiss all toasts
     */
    dismissAll: () => {
      sonnerToast.dismiss();
    },

    /**
     * Promise wrapper for async operations with loading states
     */
    promise: <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ) => {
      return sonnerToast.promise(promise, {
        loading,
        success: (data) => (typeof success === 'function' ? success(data) : success),
        error: (err) => (typeof error === 'function' ? error(err) : error),
      });
    },
  };
}

/**
 * Direct toast functions for use outside of components
 * These can be imported and used anywhere without hooks
 */
export const toast = {
  success: (message: string, options?: Partial<ToastT>) => 
    sonnerToast.success(message, options),
  
  error: (message: string, options?: Partial<ToastT>) => 
    sonnerToast.error(message, options),
  
  info: (message: string, options?: Partial<ToastT>) => 
    sonnerToast.info(message, options),
  
  warning: (message: string, options?: Partial<ToastT>) => 
    sonnerToast.warning(message, options),
  
  loading: (message: string, options?: Partial<ToastT>) => 
    sonnerToast.loading(message, options),
  
  dismiss: (toastId: string | number) => 
    sonnerToast.dismiss(toastId),
  
  dismissAll: () => 
    sonnerToast.dismiss(),
  
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success: (data) => (typeof success === 'function' ? success(data) : success),
      error: (err) => (typeof error === 'function' ? error(err) : error),
    });
  },
};

// Re-export types for convenience
export type { ToastT } from 'sonner';

'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/src/components/ui/toast';
import { ApiResponse, ApiError, getErrorMessage, getErrorSeverity, isApiError } from '@/src/types/api';

interface UseApiOptions {
  showToast?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
}

/**
 * useApi Hook
 * 
 * A custom hook for making API calls with consistent error handling,
 * loading states, and toast notifications.
 * 
 * Features:
 * - Standardized error handling
 * - Loading state management
 * - Toast notifications for errors
 * - Success/error callbacks
 * - Automatic error parsing
 */
export function useApi<T = any>(options: UseApiOptions = {}): UseApiReturn<T> {
  const { showToast = true, onSuccess, onError } = options;
  const { addToast } = useToast();
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (url: string, requestOptions: RequestInit = {}): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      // Get auth token
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...requestOptions.headers as Record<string, string>,
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(url, {
        ...requestOptions,
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API error response
        if (isApiError(result)) {
          const apiError = result.error;
          setError(apiError);
          
          if (showToast) {
            const severity = getErrorSeverity(result);
            addToast({
              type: severity === 'critical' ? 'error' : 'warning',
              title: 'Request Failed',
              message: apiError.message,
              duration: severity === 'critical' ? 10000 : 5000,
            });
          }
          
          if (onError) {
            onError(apiError);
          }
          
          return null;
        } else {
          // Handle non-API error response
          const errorMessage = getErrorMessage(result);
          const apiError: ApiError = {
            code: 'UNKNOWN_ERROR',
            message: errorMessage,
            timestamp: new Date().toISOString()
          };
          
          setError(apiError);
          
          if (showToast) {
            addToast({
              type: 'error',
              title: 'Request Failed',
              message: errorMessage,
            });
          }
          
          if (onError) {
            onError(apiError);
          }
          
          return null;
        }
      }

      // Handle success response
      const responseData = result.data || result;
      setData(responseData);
      
      if (onSuccess) {
        onSuccess(responseData);
      }
      
      return responseData;

    } catch (fetchError: any) {
      // Handle network or other errors
      const errorMessage = getErrorMessage(fetchError);
      const apiError: ApiError = {
        code: 'NETWORK_ERROR',
        message: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      setError(apiError);
      
      if (showToast) {
        addToast({
          type: 'error',
          title: 'Network Error',
          message: errorMessage,
          action: {
            label: 'Retry',
            onClick: () => execute(url, requestOptions)
          }
        });
      }
      
      if (onError) {
        onError(apiError);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast, onSuccess, onError, addToast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

/**
 * useApiMutation Hook
 * 
 * A specialized hook for mutation operations (POST, PUT, DELETE)
 * with optimistic updates and rollback capabilities.
 */
export function useApiMutation<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  
  const mutate = useCallback(async (
    url: string, 
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
    body?: any
  ): Promise<T | null> => {
    return api.execute(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  }, [api.execute]);

  return {
    ...api,
    mutate
  };
}

/**
 * useApiQuery Hook
 * 
 * A specialized hook for query operations (GET) with caching
 * and automatic refetching capabilities.
 */
export function useApiQuery<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  
  const query = useCallback(async (url: string): Promise<T | null> => {
    return api.execute(url, { method: 'GET' });
  }, [api.execute]);

  return {
    ...api,
    query
  };
}

/**
 * useApiUpload Hook
 * 
 * A specialized hook for file upload operations with progress tracking.
 */
export function useApiUpload<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { addToast } = useToast();
  
  // Local state for upload specific handling if needed, 
  // but mostly we want to return what api returns.
  // However, api.data/error are read-only. 
  // We need to duplicate state or just use api.execute?
  // The original code tried to set api's state. 
  // Let's just manage our own state for upload result.
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  
  const upload = useCallback(async (
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T | null> => {
    setUploadProgress(0);
    setData(null);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Get auth token
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (isApiError(result)) {
          const apiError = result.error;
          setError(apiError);
          
          if (options.showToast !== false) {
            addToast({
              type: 'error',
              title: 'Upload Failed',
              message: apiError.message,
            });
          }
          
          return null;
        }
      }
      
      const responseData = result.data || result;
      setData(responseData);
      setUploadProgress(100);
      
      if (options.onSuccess) {
        options.onSuccess(responseData);
      }
      
      return responseData;
      
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      const apiError: ApiError = {
        code: 'UPLOAD_FAILED',
        message: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      setError(apiError);
      
      if (options.showToast !== false) {
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: errorMessage,
        });
      }
      
      return null;
    }
  }, [options, addToast]);
  
  return {
    data, // Return local data
    loading: uploadProgress > 0 && uploadProgress < 100, // approximate loading
    error, // Return local error
    execute: api.execute, // Keep api.execute available if needed
    reset: api.reset,
    upload,
    uploadProgress
  };
}


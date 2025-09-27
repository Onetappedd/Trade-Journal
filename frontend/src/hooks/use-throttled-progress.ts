import { useState, useCallback, useRef } from 'react';

/**
 * Hook for throttled progress updates to reduce layout thrash
 * Updates are limited to <= 10 per second
 */
export function useThrottledProgress(initialProgress: number = 0) {
  const [progress, setProgress] = useState(initialProgress);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateProgress = useCallback((newProgress: number) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    const minInterval = 100; // 100ms = 10 updates per second max

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= minInterval) {
      setProgress(newProgress);
      lastUpdateRef.current = now;
      
      // Clear any pending update
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (pendingUpdateRef.current !== null) {
        pendingUpdateRef.current = null;
      }
    } else {
      // Store the pending update
      pendingUpdateRef.current = newProgress;
      
      // If no timeout is set, schedule one
      if (!timeoutRef.current) {
        const remainingTime = minInterval - timeSinceLastUpdate;
        timeoutRef.current = setTimeout(() => {
          if (pendingUpdateRef.current !== null) {
            setProgress(pendingUpdateRef.current);
            lastUpdateRef.current = Date.now();
            pendingUpdateRef.current = null;
          }
          timeoutRef.current = null;
        }, remainingTime);
      }
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(0);
    lastUpdateRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingUpdateRef.current = null;
  }, []);

  return { progress, updateProgress, resetProgress };
}


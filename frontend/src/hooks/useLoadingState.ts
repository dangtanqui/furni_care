import { useState, useCallback, useRef } from 'react';

interface UseLoadingStateOptions {
  initialLoading?: boolean;
}

/**
 * Generic loading state management hook
 */
export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const [loading, setLoading] = useState<boolean>(options.initialLoading || false);
  const [error, setError] = useState<string | null>(null);
  const loadingOperationsRef = useRef<Set<string>>(new Set());

  const startLoading = useCallback((operationId?: string) => {
    if (operationId) {
      loadingOperationsRef.current.add(operationId);
    }
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback((operationId?: string) => {
    if (operationId) {
      loadingOperationsRef.current.delete(operationId);
      // Only stop loading if no other operations are in progress
      if (loadingOperationsRef.current.size === 0) {
        setLoading(false);
      }
    } else {
      loadingOperationsRef.current.clear();
      setLoading(false);
    }
  }, []);

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    loadingOperationsRef.current.clear();
  }, []);

  const withLoading = useCallback(
    async <T,>(operation: () => Promise<T>, operationId?: string): Promise<T> => {
      startLoading(operationId);
      try {
        const result = await operation();
        stopLoading(operationId);
        return result;
      } catch (err) {
        stopLoading(operationId);
        throw err;
      }
    },
    [startLoading, stopLoading]
  );

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setError: setErrorState,
    clearError,
    reset,
    withLoading,
    isLoading: (operationId?: string) => {
      if (operationId) {
        return loadingOperationsRef.current.has(operationId);
      }
      return loading;
    },
  };
}

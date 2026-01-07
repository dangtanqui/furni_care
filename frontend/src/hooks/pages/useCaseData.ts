import { useState, useEffect, useCallback, useRef } from 'react';
import { useCase } from '../api/useCase';
import { CASE_STATUS, COST_STATUS } from '../../constants/caseStatus';
import { STAGE } from '../../constants/stages';

/**
 * Hook for managing case data fetching and state
 * Uses React Query for data fetching with automatic caching and refetching
 */
export function useCaseData(caseId: string | undefined) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const shouldPreserveExpandedStageRef = useRef(false);

  // Use React Query hook for data fetching
  const {
    data: caseData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useCase(caseId ? Number(caseId) : undefined);

  // Convert React Query error to string
  const error = queryError
    ? (queryError as Error)?.message || 'Failed to load case. Please try again.'
    : null;

  // Handle expanded stage logic when case data changes
  useEffect(() => {
    if (!caseData) return;
    
    // If we should preserve expanded stage (e.g., after upload), don't change it
    if (shouldPreserveExpandedStageRef.current) {
      shouldPreserveExpandedStageRef.current = false;
      return;
    }

    // Only auto-expand stage on initial load, not when reloading after updates
    // If case is closed or cancelled, close all accordions.
    // If case is rejected but cost_status is rejected (cost rejected), still open Stage 3 for CS to cancel.
    // Otherwise, expand current stage.
    if (
      caseData.status === CASE_STATUS.CLOSED ||
      caseData.status === CASE_STATUS.CANCELLED
    ) {
      setExpandedStage(null);
    } else if (
      caseData.status === CASE_STATUS.REJECTED &&
      caseData.cost_status === COST_STATUS.REJECTED &&
      caseData.current_stage === STAGE.STAGE_3
    ) {
      // When cost is rejected, open Stage 3 so CS can cancel
      setExpandedStage(STAGE.STAGE_3);
    } else {
      setExpandedStage(caseData.current_stage);
    }
  }, [caseData]);

  const loadCase = useCallback(
    async (preserveExpandedStage = false) => {
      if (!caseId) return;
      shouldPreserveExpandedStageRef.current = preserveExpandedStage;
      await refetch();
    },
    [caseId, refetch]
  );

  // Helper to set error (for backward compatibility)
  const setError = useCallback((_errorMessage: string | null) => {
    // React Query manages errors, but we can still track custom errors if needed
    // This is mainly for backward compatibility with existing code
  }, []);

  // Helper to set loading (for backward compatibility)
  const setLoading = useCallback((_isLoading: boolean) => {
    // React Query manages loading state, but we can still track operation progress
    // This is mainly for backward compatibility with existing code
  }, []);

  return {
    caseData: caseData || null,
    setCaseData: () => {
      // React Query manages data, but we can trigger refetch
      refetch();
    },
    expandedStage,
    setExpandedStage,
    error,
    setError,
    loading,
    setLoading,
    isOperationInProgress,
    setIsOperationInProgress,
    loadCase,
  };
}

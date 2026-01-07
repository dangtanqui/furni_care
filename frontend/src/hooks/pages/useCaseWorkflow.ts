import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  advanceStage,
  approveCost,
  rejectCost,
  approveFinalCost,
  rejectFinalCost,
  redoCase,
  cancelCase,
} from '../../api/cases';
import type { CaseDetail } from '../../api/cases';
import { CASE_STATUS } from '../../constants/caseStatus';
import { useToast } from '../../contexts/ToastContext';

interface UseCaseWorkflowParams {
  caseId: string | undefined;
  caseData: CaseDetail | null;
  loadCase: (preserveExpandedStage?: boolean) => Promise<void>;
  setCaseData: (data: CaseDetail | null) => void;
  setExpandedStage: (stage: number | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  isOperationInProgress: boolean;
  setIsOperationInProgress: (inProgress: boolean) => void;
}

/**
 * Hook for managing case workflow operations (advance, approve, reject, redo, cancel)
 */
export function useCaseWorkflow({
  caseId,
  caseData,
  loadCase,
  setCaseData,
  setExpandedStage,
  setError,
  setLoading,
  isOperationInProgress,
  setIsOperationInProgress,
}: UseCaseWorkflowParams) {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const advanceInProgressRef = useRef(false);

  const handleAdvance = useCallback(async () => {
    // Prevent duplicate calls using ref (works even if component re-renders)
    if (advanceInProgressRef.current || isOperationInProgress) return;

    // Prevent any stage advancement if case is closed or cancelled
    if (
      caseData?.status === CASE_STATUS.CLOSED ||
      caseData?.status === CASE_STATUS.CANCELLED
    ) {
      setError('Cannot advance stage: case is already closed or cancelled');
      return;
    }
    if (!caseId) {
      setError('Case ID is missing');
      return;
    }

    advanceInProgressRef.current = true;
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await advanceStage(Number(caseId));
      // Invalidate case list cache to reflect stage change
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      await loadCase();
      showSuccess('Stage advanced successfully');
    } catch (err) {
      const errorMessage = 'Failed to advance stage. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
      advanceInProgressRef.current = false;
    }
  }, [
    caseId,
    caseData?.status,
    isOperationInProgress,
    loadCase,
    setError,
    setLoading,
    setIsOperationInProgress,
    queryClient,
    showSuccess,
    showError,
  ]);

  const handleApproveCost = useCallback(async () => {
    if (isOperationInProgress) return;
    // Prevent cost approval if case is closed or cancelled
    if (
      caseData?.status === CASE_STATUS.CLOSED ||
      caseData?.status === CASE_STATUS.CANCELLED
    ) {
      setError('Cannot approve cost: case is already closed or cancelled');
      return;
    }
    if (!caseId) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await approveCost(Number(caseId));
      // Invalidate case list cache to reflect stage change (Stage 3 -> 4)
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      await loadCase();
      showSuccess('Cost approved successfully');
    } catch (err) {
      const errorMessage = 'Failed to approve cost. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  }, [
    caseId,
    caseData?.status,
    isOperationInProgress,
    loadCase,
    setError,
    setLoading,
    setIsOperationInProgress,
    queryClient,
    showSuccess,
    showError,
  ]);

  const handleRejectCost = useCallback(async () => {
    if (isOperationInProgress) return;
    // Prevent cost rejection if case is closed or cancelled
    if (
      caseData?.status === CASE_STATUS.CLOSED ||
      caseData?.status === CASE_STATUS.CANCELLED
    ) {
      setError('Cannot reject cost: case is already closed or cancelled');
      return;
    }
    if (!caseId) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await rejectCost(Number(caseId));
      // Invalidate case list cache to reflect status change (status -> rejected)
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      await loadCase();
      showSuccess('Cost rejected');
    } catch (err) {
      const errorMessage = 'Failed to reject cost. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  }, [
    caseId,
    caseData?.status,
    isOperationInProgress,
    loadCase,
    setError,
    setLoading,
    setIsOperationInProgress,
    queryClient,
    showSuccess,
    showError,
  ]);

  const handleApproveFinalCost = useCallback(async () => {
    if (isOperationInProgress) return;
    if (
      caseData?.status === CASE_STATUS.CLOSED ||
      caseData?.status === CASE_STATUS.CANCELLED
    ) {
      setError('Cannot approve final cost: case is already closed or cancelled');
      return;
    }
    if (!caseId) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await approveFinalCost(Number(caseId));
      // Invalidate case list cache to reflect status change
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      await loadCase();
      showSuccess('Final cost approved successfully');
    } catch (err) {
      const errorMessage = 'Failed to approve final cost. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  }, [
    caseId,
    caseData?.status,
    isOperationInProgress,
    loadCase,
    setError,
    setLoading,
    setIsOperationInProgress,
    queryClient,
    showSuccess,
    showError,
  ]);

  const handleRejectFinalCost = useCallback(async () => {
    if (isOperationInProgress) return;
    if (
      caseData?.status === CASE_STATUS.CLOSED ||
      caseData?.status === CASE_STATUS.CANCELLED
    ) {
      setError('Cannot reject final cost: case is already closed or cancelled');
      return;
    }
    if (!caseId) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await rejectFinalCost(Number(caseId));
      // Invalidate case list cache to reflect status change
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      await loadCase();
      showSuccess('Final cost rejected');
    } catch (err) {
      const errorMessage = 'Failed to reject final cost. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  }, [
    caseId,
    caseData?.status,
    isOperationInProgress,
    loadCase,
    setError,
    setLoading,
    setIsOperationInProgress,
    queryClient,
    showSuccess,
    showError,
  ]);

  const handleRedo = useCallback(async () => {
    if (isOperationInProgress) return;
    // Prevent redo if case is closed or cancelled
    // Allow redo when completed (CS can redo from Stage 5)
    if (
      caseData?.status === CASE_STATUS.CLOSED ||
      caseData?.status === CASE_STATUS.CANCELLED
    ) {
      setError('Cannot redo case: case is already closed or cancelled');
      return;
    }
    if (!caseId) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await redoCase(Number(caseId));
      // Invalidate case list cache to reflect stage change (Stage 5 -> 3) and status change
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      await loadCase(false); // Don't preserve expanded stage, let it auto-expand to Stage 3
      showSuccess('Case redone successfully');
    } catch (err) {
      // Extract error message from API response if available
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to redo case. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  }, [
    caseId,
    caseData?.status,
    isOperationInProgress,
    loadCase,
    setError,
    setLoading,
    setIsOperationInProgress,
    queryClient,
    showSuccess,
    showError,
  ]);

  const handleCancelCase = useCallback(async () => {
    if (isOperationInProgress) return;
    // Prevent cancel if case is closed or cancelled
    if (
      caseData?.status === CASE_STATUS.CLOSED ||
      caseData?.status === CASE_STATUS.CANCELLED
    ) {
      setError('Cannot cancel case: case is already closed or cancelled');
      return;
    }
    if (!caseId) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      const response = await cancelCase(Number(caseId));
      // Invalidate case list cache to reflect status change (status -> cancelled)
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      // Update case data immediately from response
      if (response?.data) {
        setCaseData(response.data);
        // Close all accordions when case is cancelled
        if (response.data.status === CASE_STATUS.CANCELLED) {
          setExpandedStage(null);
        }
      }
      // Reload to ensure we have the latest data
      await loadCase(false);
      showSuccess('Case cancelled successfully');
    } catch (err) {
      const error = err as {
        response?: { data?: { error?: string; errors?: string[] } };
        message?: string;
      };
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        'Failed to cancel case. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
      // Reload to get latest state even on error
      await loadCase(false);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  }, [
    caseId,
    caseData?.status,
    isOperationInProgress,
    loadCase,
    setCaseData,
    setExpandedStage,
    setError,
    setLoading,
    setIsOperationInProgress,
    queryClient,
    showSuccess,
    showError,
  ]);

  return {
    handleAdvance,
    handleApproveCost,
    handleRejectCost,
    handleApproveFinalCost,
    handleRejectFinalCost,
    handleRedo,
    handleCancelCase,
  };
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getCase, updateCase, advanceStage, approveCost, rejectCost, approveFinalCost, rejectFinalCost, redoCase, cancelCase, uploadAttachments, deleteCaseAttachment } from '../../api/cases';
import type { CaseDetail as CaseDetailType } from '../../api/cases';
import { useTechnicians } from '../useTechnicians';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { canEditStage as checkCanEditStage } from '../../utils/casePermissions';
import { CASE_STATUS, COST_STATUS, FINAL_COST_STATUS } from '../../constants/caseStatus';
import { STAGE } from '../../constants/stages';

export function useCaseDetails() {
  const { id } = useParams();
  const { isCS, isTechnician, isLeader, user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [caseData, setCaseData] = useState<CaseDetailType | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const { technicians } = useTechnicians();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const advanceInProgressRef = useRef(false);

  const loadCase = useCallback(async (preserveExpandedStage = false) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCase(Number(id));
      setCaseData(res.data);
      // Only auto-expand stage on initial load, not when reloading after updates
      if (!preserveExpandedStage) {
        // If case is closed or cancelled, close all accordions.
        // If case is rejected but cost_status is rejected (cost rejected), still open Stage 3 for CS to cancel.
        // Otherwise, expand current stage.
        if (res.data.status === CASE_STATUS.CLOSED || res.data.status === CASE_STATUS.CANCELLED) {
          setExpandedStage(null);
        } else if (res.data.status === CASE_STATUS.REJECTED && res.data.cost_status === COST_STATUS.REJECTED && res.data.current_stage === STAGE.STAGE_3) {
          // When cost is rejected, open Stage 3 so CS can cancel
          setExpandedStage(STAGE.STAGE_3);
        } else {
          setExpandedStage(res.data.current_stage);
        }
      }
    } catch (err) {
      setError('Failed to load case. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCase();
  }, [id, loadCase]);

  const handleUpdate = async (data: Partial<CaseDetailType>) => {
    if (isOperationInProgress) return;
    // Prevent any updates if case is closed or cancelled
    // Allow updates when completed (CS needs to update to close the case)
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot update case: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await updateCase(Number(id), data);
      // Preserve expanded stage when reloading after update (especially for Stage 5)
      await loadCase(true);
      showSuccess('Case updated successfully');
    } catch (err) {
      const errorMessage = 'Failed to update case. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleAttachmentsUpload = async (stage: number, files: File[], attachmentType?: string) => {
    if (isOperationInProgress) return;
    // Prevent any uploads if case is closed or cancelled
    // Allow uploads when completed (CS may need to upload in Stage 5)
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot upload attachments: case is already closed or cancelled');
      return;
    }
    if (!files.length) return;
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await uploadAttachments(Number(id), stage, files, attachmentType || `stage_${stage}`);
      await loadCase(true); // Preserve expanded stage when uploading
      showSuccess('Attachments uploaded successfully');
    } catch (err) {
      const errorMessage = 'Failed to upload attachments. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleAttachmentDelete = async (attachmentId: number) => {
    if (isOperationInProgress) return;
    // Prevent any deletions if case is closed or cancelled
    // Allow deletions when completed (CS may need to delete in Stage 5)
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot delete attachment: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await deleteCaseAttachment(Number(id), attachmentId);
      await loadCase(true); // Preserve expanded stage when deleting
      showSuccess('Attachment deleted successfully');
    } catch (err) {
      const errorMessage = 'Failed to delete attachment. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleAdvance = useCallback(async () => {
    // Prevent duplicate calls using ref (works even if component re-renders)
    if (advanceInProgressRef.current || isOperationInProgress) return;
    
    // Prevent any stage advancement if case is closed or cancelled
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot advance stage: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    
    advanceInProgressRef.current = true;
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await advanceStage(Number(id));
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
  }, [id, caseData?.status, isOperationInProgress, loadCase, showSuccess, showError]);

  const handleApproveCost = async () => {
    if (isOperationInProgress) return;
    // Prevent cost approval if case is closed or cancelled
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot approve cost: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await approveCost(Number(id));
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
  };

  const handleRejectCost = async () => {
    if (isOperationInProgress) return;
    // Prevent cost rejection if case is closed or cancelled
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot reject cost: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await rejectCost(Number(id));
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
  };

  const handleApproveFinalCost = async () => {
    if (isOperationInProgress) return;
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot approve final cost: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await approveFinalCost(Number(id));
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
  };

  const handleRejectFinalCost = async () => {
    if (isOperationInProgress) return;
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot reject final cost: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await rejectFinalCost(Number(id));
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
  };

  const handleRedo = async () => {
    if (isOperationInProgress) return;
    // Prevent redo if case is closed or cancelled
    // Allow redo when completed (CS can redo from Stage 5)
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot redo case: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      await redoCase(Number(id));
      await loadCase(false); // Don't preserve expanded stage, let it auto-expand to Stage 3
      showSuccess('Case redone successfully');
    } catch (err: any) {
      // Extract error message from API response if available
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to redo case. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleCancelCase = async () => {
    if (isOperationInProgress) return;
    // Prevent cancel if case is closed or cancelled
    if (caseData?.status === CASE_STATUS.CLOSED || caseData?.status === CASE_STATUS.CANCELLED) {
      setError('Cannot cancel case: case is already closed or cancelled');
      return;
    }
    if (!id) {
      setError('Case ID is missing');
      return;
    }
    setIsOperationInProgress(true);
    setLoading(true);
    setError(null);
    try {
      const response = await cancelCase(Number(id));
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
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.response?.data?.errors?.[0] || err?.message || 'Failed to cancel case. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
      // Reload to get latest state even on error
      await loadCase(false);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  // Memoize permission params to avoid unnecessary recalculations
  const permissionParams = useMemo(() => ({
    caseData,
    isCS,
    isTechnician,
    isLeader,
    currentUserId: user?.id
  }), [caseData, isCS, isTechnician, isLeader, user?.id]);

  const canEditStage = useCallback((stage: number) => {
    return checkCanEditStage(stage, permissionParams);
  }, [permissionParams]);

  return {
    caseData,
    expandedStage,
    setExpandedStage,
    technicians,
    isCS,
    isTechnician,
    isLeader,
    currentUserId: user?.id,
    error,
    loading,
    handleUpdate,
    handleAttachmentsUpload,
    handleAttachmentDelete,
    handleAdvance,
    handleApproveCost,
    handleRejectCost,
    handleApproveFinalCost,
    handleRejectFinalCost,
    handleRedo,
    handleCancelCase,
    canEditStage,
  };
}


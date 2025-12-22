import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getCase, updateCase, advanceStage, approveCost, rejectCost, approveFinalCost, rejectFinalCost, redoCase, cancelCase, uploadAttachments, deleteCaseAttachment } from '../../api/cases';
import type { CaseDetail as CaseDetailType } from '../../api/cases';
import { useTechnicians } from '../useTechnicians';
import { useAuth } from '../../contexts/AuthContext';
import { canEditStage as checkCanEditStage } from '../../utils/casePermissions';

export function useCaseDetails() {
  const { id } = useParams();
  const { isCS, isTechnician, isLeader } = useAuth();
  
  const [caseData, setCaseData] = useState<CaseDetailType | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const { technicians } = useTechnicians();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);

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
        if (res.data.status === 'closed' || res.data.status === 'cancelled') {
          setExpandedStage(null);
        } else if (res.data.status === 'rejected' && res.data.cost_status === 'rejected' && res.data.current_stage === 3) {
          // When cost is rejected, open Stage 3 so CS can cancel
          setExpandedStage(3);
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
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
    } catch (err) {
      setError('Failed to update case. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleAttachmentsUpload = async (stage: number, files: File[], attachmentType?: string) => {
    if (isOperationInProgress) return;
    // Prevent any uploads if case is closed or cancelled
    // Allow uploads when completed (CS may need to upload in Stage 5)
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
    } catch (err) {
      setError('Failed to upload attachments. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleAttachmentDelete = async (attachmentId: number) => {
    if (isOperationInProgress) return;
    // Prevent any deletions if case is closed or cancelled
    // Allow deletions when completed (CS may need to delete in Stage 5)
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
    } catch (err) {
      setError('Failed to delete attachment. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleAdvance = async () => {
    if (isOperationInProgress) return;
    // Prevent any stage advancement if case is closed or cancelled
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
      setError('Cannot advance stage: case is already closed or cancelled');
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
      await advanceStage(Number(id));
      await loadCase();
    } catch (err) {
      setError('Failed to advance stage. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleApproveCost = async () => {
    if (isOperationInProgress) return;
    // Prevent cost approval if case is closed or cancelled
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
    } catch (err) {
      setError('Failed to approve cost. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleRejectCost = async () => {
    if (isOperationInProgress) return;
    // Prevent cost rejection if case is closed or cancelled
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
    } catch (err) {
      setError('Failed to reject cost. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleApproveFinalCost = async () => {
    if (isOperationInProgress) return;
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
    } catch (err) {
      setError('Failed to approve final cost. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleRejectFinalCost = async () => {
    if (isOperationInProgress) return;
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
    } catch (err) {
      setError('Failed to reject final cost. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleRedo = async () => {
    if (isOperationInProgress) return;
    // Prevent redo if case is closed or cancelled
    // Allow redo when completed (CS can redo from Stage 5)
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
    } catch (err: any) {
      // Extract error message from API response if available
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to redo case. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const handleCancelCase = async () => {
    if (isOperationInProgress) return;
    // Prevent cancel if case is closed or cancelled
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
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
      await cancelCase(Number(id));
      await loadCase();
    } catch (err) {
      setError('Failed to cancel case. Please try again.');
    } finally {
      setLoading(false);
      setIsOperationInProgress(false);
    }
  };

  const canEditStage = useCallback((stage: number) => {
    return checkCanEditStage(stage, { caseData, isCS, isTechnician, isLeader });
  }, [caseData, isCS, isTechnician, isLeader]);

  return {
    caseData,
    expandedStage,
    setExpandedStage,
    technicians,
    isCS,
    isTechnician,
    isLeader,
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


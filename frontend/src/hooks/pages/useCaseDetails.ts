import { useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { useTechnicians } from '../useTechnicians';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useCaseData } from './useCaseData';
import { useCaseOperations } from './useCaseOperations';
import { useCaseWorkflow } from './useCaseWorkflow';
import { useCasePermissions } from './useCasePermissions';
import type { CaseDetail } from '../../api/cases';

/**
 * Main hook for case details page
 * Composes smaller hooks for better maintainability and testability
 */
export function useCaseDetails() {
  const { id } = useParams();
  const { isCS, isTechnician, isLeader, user } = useAuth();
  const { technicians } = useTechnicians();

  // Data fetching and state management
  const {
    caseData,
    setCaseData,
    expandedStage,
    setExpandedStage,
    error,
    setError,
    loading,
    setLoading,
    isOperationInProgress,
    setIsOperationInProgress,
    loadCase,
  } = useCaseData(id);

  // CRUD operations (returns result objects, no toasts)
  const { handleUpdate: handleUpdateInternal, handleAttachmentsUpload: handleAttachmentsUploadInternal, handleAttachmentDelete: handleAttachmentDeleteInternal } =
    useCaseOperations({
      caseId: id,
      caseData,
      loadCase,
      setError,
      setLoading,
      isOperationInProgress,
      setIsOperationInProgress,
    });

  // Wrap handlers with toast handling
  const { showSuccess, showError } = useToast();

  const handleUpdate = useCallback(
    async (data: Partial<CaseDetail>, options?: { skipToast?: boolean }) => {
      const result = await handleUpdateInternal(data);
      if (result && !options?.skipToast) {
        if (result.success) {
          showSuccess('Case updated successfully');
        } else {
          showError(result.error || 'Failed to update case. Please try again.');
        }
      }
    },
    [handleUpdateInternal, showSuccess, showError]
  );

  const handleAttachmentsUpload = useCallback(
    async (stage: number, files: File[], attachmentType?: string) => {
      const result = await handleAttachmentsUploadInternal(stage, files, attachmentType);
      if (result) {
        if (result.success) {
          showSuccess('Attachments uploaded successfully');
        } else {
          showError(result.error || 'Failed to upload attachments. Please try again.');
        }
      }
    },
    [handleAttachmentsUploadInternal, showSuccess, showError]
  );

  const handleAttachmentDelete = useCallback(
    async (attachmentId: number) => {
      const result = await handleAttachmentDeleteInternal(attachmentId);
      if (result) {
        if (result.success) {
          showSuccess('Attachment deleted successfully');
        } else {
          showError(result.error || 'Failed to delete attachment. Please try again.');
        }
      }
    },
    [handleAttachmentDeleteInternal, showSuccess, showError]
  );

  // Workflow operations
  const {
    handleAdvance,
    handleApproveCost,
    handleRejectCost,
    handleApproveFinalCost,
    handleRejectFinalCost,
    handleRedo,
    handleCancelCase,
  } = useCaseWorkflow({
    caseId: id,
    caseData,
    loadCase,
    setCaseData,
    setExpandedStage,
    setError,
    setLoading,
    isOperationInProgress,
    setIsOperationInProgress,
  });

  // Permissions
  const { canEditStage } = useCasePermissions({
    caseData,
    isCS,
    isTechnician,
    isLeader,
    currentUserId: user?.id,
  });

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

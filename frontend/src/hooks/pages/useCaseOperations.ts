import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateCase, uploadAttachments, deleteCaseAttachment } from '../../api/cases';
import type { CaseDetail } from '../../api/cases';
import { CASE_STATUS } from '../../constants/caseStatus';

interface UseCaseOperationsParams {
  caseId: string | undefined;
  caseData: CaseDetail | null;
  loadCase: (preserveExpandedStage?: boolean) => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  isOperationInProgress: boolean;
  setIsOperationInProgress: (inProgress: boolean) => void;
}

export interface OperationResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing case CRUD operations (update, upload/delete attachments)
 */
export function useCaseOperations({
  caseId,
  caseData,
  loadCase,
  setError,
  setLoading,
  isOperationInProgress,
  setIsOperationInProgress,
}: UseCaseOperationsParams) {
  const queryClient = useQueryClient();

  const handleUpdate = useCallback(
    async (data: Partial<CaseDetail>): Promise<OperationResult | undefined> => {
      if (isOperationInProgress) return undefined;
      // Prevent any updates if case is closed or cancelled
      // Allow updates when completed (CS needs to update to close the case)
      if (
        caseData?.status === CASE_STATUS.CLOSED ||
        caseData?.status === CASE_STATUS.CANCELLED
      ) {
        const errorMessage = 'Cannot update case: case is already closed or cancelled';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      if (!caseId) {
        const errorMessage = 'Case ID is missing';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      setIsOperationInProgress(true);
      setLoading(true);
      setError(null);
      try {
        await updateCase(Number(caseId), data);
        // Invalidate case list cache to reflect changes (e.g., assigned technician)
        queryClient.invalidateQueries({ queryKey: ['cases'] });
        // Preserve expanded stage when reloading after update (especially for Stage 5)
        await loadCase(true);
        return { success: true };
      } catch (err) {
        const errorMessage = 'Failed to update case. Please try again.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
        setIsOperationInProgress(false);
      }
    },
    [
      caseId,
      caseData?.status,
      isOperationInProgress,
      loadCase,
      setError,
      setLoading,
      setIsOperationInProgress,
      queryClient,
    ]
  );

  const handleAttachmentsUpload = useCallback(
    async (stage: number, files: File[], attachmentType?: string): Promise<OperationResult | undefined> => {
      if (isOperationInProgress) return undefined;
      // Prevent any uploads if case is closed or cancelled
      // Allow uploads when completed (CS may need to upload in Stage 5)
      if (
        caseData?.status === CASE_STATUS.CLOSED ||
        caseData?.status === CASE_STATUS.CANCELLED
      ) {
        const errorMessage = 'Cannot upload attachments: case is already closed or cancelled';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      if (!files.length) return undefined;
      if (!caseId) {
        const errorMessage = 'Case ID is missing';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      setIsOperationInProgress(true);
      setLoading(true);
      setError(null);
      try {
        await uploadAttachments(Number(caseId), stage, files, attachmentType || `stage_${stage}`);
        await loadCase(true); // Preserve expanded stage when uploading
        return { success: true };
      } catch (err) {
        const errorMessage = 'Failed to upload attachments. Please try again.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
        setIsOperationInProgress(false);
      }
    },
    [
      caseId,
      caseData?.status,
      isOperationInProgress,
      loadCase,
      setError,
      setLoading,
      setIsOperationInProgress,
    ]
  );

  const handleAttachmentDelete = useCallback(
    async (attachmentId: number): Promise<OperationResult | undefined> => {
      if (isOperationInProgress) return undefined;
      // Prevent any deletions if case is closed or cancelled
      // Allow deletions when completed (CS may need to delete in Stage 5)
      if (
        caseData?.status === CASE_STATUS.CLOSED ||
        caseData?.status === CASE_STATUS.CANCELLED
      ) {
        const errorMessage = 'Cannot delete attachment: case is already closed or cancelled';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      if (!caseId) {
        const errorMessage = 'Case ID is missing';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      setIsOperationInProgress(true);
      setLoading(true);
      setError(null);
      try {
        await deleteCaseAttachment(Number(caseId), attachmentId);
        await loadCase(true); // Preserve expanded stage when deleting
        return { success: true };
      } catch (err) {
        const errorMessage = 'Failed to delete attachment. Please try again.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
        setIsOperationInProgress(false);
      }
    },
    [
      caseId,
      caseData?.status,
      isOperationInProgress,
      loadCase,
      setError,
      setLoading,
      setIsOperationInProgress,
    ]
  );

  return {
    handleUpdate,
    handleAttachmentsUpload,
    handleAttachmentDelete,
  };
}


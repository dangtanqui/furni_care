import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCase,
  updateCase,
  advanceStage,
  approveCost,
  rejectCost,
  approveFinalCost,
  rejectFinalCost,
  redoCase,
  cancelCase,
  uploadAttachments,
  deleteCaseAttachment,
} from '../../api/cases';
import type { CaseDetail } from '../../api/cases';

/**
 * React Query hook for fetching a single case
 */
export function useCase(caseId: number | undefined) {
  return useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      if (!caseId) throw new Error('Case ID is required');
      const response = await getCase(caseId);
      return response.data;
    },
    enabled: !!caseId,
  });
}

/**
 * React Query mutation for updating a case
 */
export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CaseDetail> }) =>
      updateCase(id, data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch case data
      queryClient.invalidateQueries({ queryKey: ['case', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/**
 * React Query mutation for advancing stage
 */
export function useAdvanceStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => advanceStage(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/**
 * React Query mutation for approving cost
 */
export function useApproveCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => approveCost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/**
 * React Query mutation for rejecting cost
 */
export function useRejectCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rejectCost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/**
 * React Query mutation for approving final cost
 */
export function useApproveFinalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => approveFinalCost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/**
 * React Query mutation for rejecting final cost
 */
export function useRejectFinalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rejectFinalCost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/**
 * React Query mutation for redoing case
 */
export function useRedoCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => redoCase(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/**
 * React Query mutation for cancelling case
 */
export function useCancelCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelCase(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

/**
 * React Query mutation for uploading attachments
 */
export function useUploadAttachments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      stage,
      files,
      attachmentType,
    }: {
      id: number;
      stage: number;
      files: File[];
      attachmentType?: string;
    }) => uploadAttachments(id, stage, files, attachmentType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['case', variables.id] });
    },
  });
}

/**
 * React Query mutation for deleting attachment
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      attachmentId,
    }: {
      caseId: number;
      attachmentId: number;
    }) => deleteCaseAttachment(caseId, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['case', variables.caseId] });
    },
  });
}

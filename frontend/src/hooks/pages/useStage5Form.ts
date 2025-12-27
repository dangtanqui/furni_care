import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CaseDetail } from '../../api/cases';
import { CASE_STATUS, COST_STATUS, FINAL_COST_STATUS } from '../../constants/caseStatus';
import { STAGE } from '../../constants/stages';

interface Stage5FormData {
  cs_notes: string;
  final_feedback: string;
  final_rating: number;
  final_cost: string;
}

interface UseStage5FormParams {
  caseData: CaseDetail | null;
  isCS: boolean;
  canEdit: boolean;
}

/**
 * Hook for managing Stage 5 form state and logic
 */
export function useStage5Form({
  caseData,
  isCS,
  canEdit,
}: UseStage5FormParams) {
  const [form, setForm] = useState<Stage5FormData>({
    cs_notes: '',
    final_feedback: '',
    final_rating: 5,
    final_cost: '',
  });

  // Initialize form from caseData
  useEffect(() => {
    if (!caseData) return;
    
    setForm({
      cs_notes: caseData.cs_notes || '',
      final_feedback: caseData.final_feedback || '',
      final_rating: caseData.final_rating || 5,
      final_cost: caseData.final_cost ? String(caseData.final_cost) : '',
    });
  }, [
    caseData?.id,
    caseData?.cs_notes,
    caseData?.final_feedback,
    caseData?.final_rating,
    caseData?.final_cost,
  ]);

  // Fallback logic: Allow CS to edit when final cost is rejected or pending approval
  const canEditStage5Fallback = useMemo(
    () =>
      isCS &&
      (caseData?.current_stage ?? 0) >= STAGE.STAGE_5 &&
      ((caseData?.status === CASE_STATUS.REJECTED &&
        caseData?.final_cost_status === FINAL_COST_STATUS.REJECTED) ||
        (caseData?.status === CASE_STATUS.PENDING &&
          caseData?.final_cost_status === FINAL_COST_STATUS.PENDING)),
    [isCS, caseData?.current_stage, caseData?.status, caseData?.final_cost_status]
  );
  
  const editable = useMemo(() => canEdit || canEditStage5Fallback, [canEdit, canEditStage5Fallback]);

  // Helper function to compare costs (handles floating point precision)
  const costsEqual = useCallback((cost1: number | null, cost2: number | null): boolean => {
    if (cost1 === null || cost2 === null) return false;
    return Math.abs(cost1 - cost2) < 0.01; // Allow small tolerance for floating point
  }, []);

  // Check if final cost section should be shown (if cost was approved in Stage 3)
  const showFinalCostSection = useMemo(
    () =>
      caseData?.cost_required && caseData?.cost_status === COST_STATUS.APPROVED,
    [caseData?.cost_required, caseData?.cost_status]
  );

  const formFinalCost = useMemo(
    () => (form.final_cost ? Number(form.final_cost) : null),
    [form.final_cost]
  );
  const savedFinalCost = useMemo(() => caseData?.final_cost ?? null, [caseData?.final_cost]);
  const approvedFinalCost = useMemo(() => caseData?.approved_final_cost ?? null, [caseData?.approved_final_cost]);
  const estimatedCost = useMemo(() => caseData?.estimated_cost ?? null, [caseData?.estimated_cost]);

  const hasFinalCostInForm = useMemo(
    () =>
      form.final_cost !== '' &&
      form.final_cost !== null &&
      !isNaN(Number(form.final_cost)),
    [form.final_cost]
  );
  const hasFinalCostInData = useMemo(
    () => caseData?.final_cost !== null && caseData?.final_cost !== undefined,
    [caseData?.final_cost]
  );
  const finalCostMissing = useMemo(
    () => showFinalCostSection && !hasFinalCostInForm && !hasFinalCostInData,
    [showFinalCostSection, hasFinalCostInForm, hasFinalCostInData]
  );

  const formFinalCostDiffers = useMemo(
    () =>
      Boolean(
        formFinalCost !== null &&
          estimatedCost !== null &&
          !costsEqual(formFinalCost, estimatedCost)
      ),
    [formFinalCost, estimatedCost, costsEqual]
  );

  const savedFinalCostDiffers = useMemo(
    () =>
      Boolean(
        savedFinalCost !== null &&
          estimatedCost !== null &&
          !costsEqual(savedFinalCost, estimatedCost)
      ),
    [savedFinalCost, estimatedCost, costsEqual]
  );

  const formFinalCostEqualsEstimated = useMemo(
    () =>
      Boolean(
        formFinalCost !== null &&
          estimatedCost !== null &&
          costsEqual(formFinalCost, estimatedCost)
      ),
    [formFinalCost, estimatedCost, costsEqual]
  );

  // Check if form final cost differs from approved final cost (if exists) or saved final cost
  // Priority: approved_final_cost > savedFinalCost
  const referenceFinalCost = useMemo(
    () => approvedFinalCost ?? savedFinalCost,
    [approvedFinalCost, savedFinalCost]
  );

  const formFinalCostDiffersFromReference = useMemo(
    () =>
      Boolean(
        formFinalCost !== null &&
          referenceFinalCost !== null &&
          !costsEqual(formFinalCost, referenceFinalCost)
      ),
    [formFinalCost, referenceFinalCost, costsEqual]
  );

  // Check if form final cost equals approved final cost (if exists)
  const formFinalCostEqualsApproved = useMemo(
    () =>
      Boolean(
        approvedFinalCost !== null &&
          formFinalCost !== null &&
          costsEqual(formFinalCost, approvedFinalCost)
      ),
    [approvedFinalCost, formFinalCost, costsEqual]
  );

  const finalCostPendingApproval = useMemo(
    () => {
      if (!showFinalCostSection || finalCostMissing) return false;
      
      // If there's an approved_final_cost and form value matches it, no approval needed
      if (approvedFinalCost !== null && formFinalCostEqualsApproved) {
        return false;
      }
      
      // If there's an approved_final_cost but form value differs, need approval
      if (approvedFinalCost !== null) {
        return formFinalCostDiffersFromReference;
      }
      
      // If no approved_final_cost yet, use original logic
      return Boolean(
        !formFinalCostEqualsEstimated &&
          (caseData?.final_cost_status === FINAL_COST_STATUS.PENDING ||
            caseData?.final_cost_status === FINAL_COST_STATUS.REJECTED ||
            (savedFinalCostDiffers &&
              !caseData?.final_cost_status &&
              !caseData?.final_cost_approved_by) ||
            (formFinalCostDiffers &&
              !savedFinalCost &&
              !caseData?.final_cost_status &&
              !caseData?.final_cost_approved_by))
      );
    },
    [
      showFinalCostSection,
      finalCostMissing,
      approvedFinalCost,
      formFinalCostEqualsApproved,
      formFinalCostDiffersFromReference,
      formFinalCostEqualsEstimated,
      caseData?.final_cost_status,
      caseData?.final_cost_approved_by,
      savedFinalCostDiffers,
      formFinalCostDiffers,
      savedFinalCost,
    ]
  );

  const showSaveButton = useMemo(
    () => {
      if (!showFinalCostSection) return false;
      
      // If there's an approved_final_cost (was approved before), compare with it
      // Otherwise, compare with estimated_cost
      if (approvedFinalCost !== null) {
        // Was approved before - compare with approved value
        return formFinalCostDiffersFromReference;
      }
      
      // Not approved yet - compare with estimated cost
      return !formFinalCostEqualsEstimated && formFinalCostDiffers;
    },
    [
      showFinalCostSection,
      approvedFinalCost,
      formFinalCostDiffersFromReference,
      formFinalCostEqualsEstimated,
      formFinalCostDiffers,
    ]
  );

  const getUpdateData = useCallback(
    (includeFinalCost = false, status?: string) => {
      const updateData: Partial<CaseDetail> = {
        cs_notes: form.cs_notes,
        final_feedback: form.final_feedback,
        final_rating: form.final_rating,
      };

      if (status) {
        updateData.status = status as typeof CASE_STATUS[keyof typeof CASE_STATUS];
      }

      const isClosing = status === CASE_STATUS.CLOSED;
      const finalCostApproved = caseData?.final_cost_status === FINAL_COST_STATUS.APPROVED;

      if (includeFinalCost && form.final_cost) {
        const finalCost = Number(form.final_cost);
        
        // When closing case, only include final_cost if it hasn't been approved yet
        // If final_cost is already approved, don't include it in update to prevent resetting status
        if (isClosing && finalCostApproved) {
          // Don't include final_cost when closing if it's already approved
          // This prevents backend from resetting final_cost_status
        } else {
          updateData.final_cost = finalCost;
          
          // If there's an approved_final_cost (was approved before), compare with it
          // Otherwise, compare with estimated cost
          if (approvedFinalCost !== null) {
            // Was approved before - compare with approved value
            const formFinalCostDiffersFromApproved = !costsEqual(finalCost, approvedFinalCost);
            
            // If CS changed from approved value, reset to PENDING for re-approval
            if (!isClosing && formFinalCostDiffersFromApproved) {
              updateData.status = CASE_STATUS.PENDING;
              updateData.final_cost_status = FINAL_COST_STATUS.PENDING;
            }
          } else {
            // Not approved yet - compare with estimated cost
            const finalCostDiffers = estimatedCost !== null && Math.abs(finalCost - estimatedCost) >= 0.01;
            
            if (!isClosing && finalCostDiffers) {
              updateData.status = CASE_STATUS.PENDING;
              updateData.final_cost_status = FINAL_COST_STATUS.PENDING;
            }
          }
        }
      }

      return updateData;
    },
    [form, estimatedCost, caseData?.final_cost_status, approvedFinalCost, costsEqual]
  );

  return {
    form,
    setForm,
    editable,
    showFinalCostSection,
    finalCostMissing,
    finalCostPendingApproval,
    showSaveButton,
    formFinalCost,
    savedFinalCost,
    estimatedCost,
    formFinalCostDiffers,
    savedFinalCostDiffers,
    formFinalCostEqualsEstimated,
    getUpdateData,
    canEditStage5Fallback,
  };
}


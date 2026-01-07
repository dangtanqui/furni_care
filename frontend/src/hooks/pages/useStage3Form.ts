import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CaseDetail } from '../../api/cases';
import { CASE_STATUS, COST_STATUS } from '../../constants/caseStatus';
import { STAGE } from '../../constants/stages';

interface Stage3FormData {
  root_cause: string;
  solution_description: string;
  planned_execution_date: string;
  cost_required: boolean;
  estimated_cost: string;
  cost_description: string;
}

interface UseStage3FormParams {
  caseData: CaseDetail | null;
  isTechnician: boolean;
  currentUserId?: number;
  canEdit: boolean;
}

/**
 * Hook for managing Stage 3 form state and logic
 */
export function useStage3Form({
  caseData,
  isTechnician,
  currentUserId,
  canEdit,
}: UseStage3FormParams) {
  const [form, setForm] = useState<Stage3FormData>({
    root_cause: '',
    solution_description: '',
    planned_execution_date: '',
    cost_required: false,
    estimated_cost: '',
    cost_description: '',
  });
  const [checklist, setChecklist] = useState<boolean[]>([]);
  const [shouldValidateCost, setShouldValidateCost] = useState<boolean>(false);
  
  // Track initial values to detect changes
  const [initialValues, setInitialValues] = useState<{
    estimated_cost: number | null;
    cost_description: string;
    cost_attachments_count: number;
  }>({
    estimated_cost: null,
    cost_description: '',
    cost_attachments_count: 0,
  });

  // Initialize form from caseData
  useEffect(() => {
    if (!caseData) return;
    
    setForm({
      root_cause: caseData.root_cause || '',
      solution_description: caseData.solution_description || '',
      planned_execution_date: caseData.planned_execution_date || '',
      cost_required: caseData.cost_required || false,
      estimated_cost: caseData.estimated_cost ? String(caseData.estimated_cost) : '',
      cost_description: caseData.cost_description || '',
    });
    
    try {
      setChecklist(JSON.parse(caseData.solution_checklist || '[]'));
    } catch {
      setChecklist([false, false]);
    }
    
    // Track initial values for cost fields
    const costAttachments = (caseData.stage_attachments?.['3'] || []).filter(
      (att: any) => att.attachment_type === 'cost'
    );
    setInitialValues({
      estimated_cost: caseData.estimated_cost ?? null,
      cost_description: caseData.cost_description || '',
      cost_attachments_count: costAttachments.length,
    });
  }, [
    caseData?.id,
    caseData?.root_cause,
    caseData?.solution_description,
    caseData?.planned_execution_date,
    caseData?.cost_required,
    caseData?.estimated_cost,
    caseData?.cost_description,
    caseData?.solution_checklist,
    caseData?.stage_attachments,
  ]);

  const checklistItems = useMemo(() => ['Prepare materials', 'Schedule with client'], []);
  const isCurrent = useMemo(() => caseData?.current_stage === STAGE.STAGE_3, [caseData?.current_stage]);
  
  // Fallback check: only assigned technician can edit Stage 3
  const isAssignedTechnician = useMemo(
    () =>
      Boolean(
        isTechnician &&
          caseData?.assigned_to?.id &&
          currentUserId &&
          caseData.assigned_to.id === currentUserId
      ),
    [isTechnician, caseData?.assigned_to?.id, currentUserId]
  );
  
  const canEditStage3 = useMemo(
    () =>
      isAssignedTechnician &&
      (caseData?.current_stage ?? 0) >= STAGE.STAGE_3 &&
      caseData?.status !== CASE_STATUS.CLOSED &&
      caseData?.status !== CASE_STATUS.CANCELLED,
    [isAssignedTechnician, caseData?.current_stage, caseData?.status]
  );
  
  const editable = useMemo(() => canEdit || canEditStage3, [canEdit, canEditStage3]);
  const canAdvance = useMemo(
    () => !form.cost_required || caseData?.cost_status === COST_STATUS.APPROVED,
    [form.cost_required, caseData?.cost_status]
  );
  const isRejected = useMemo(
    () => caseData?.cost_status === COST_STATUS.REJECTED,
    [caseData?.cost_status]
  );

  // Check if estimated_cost is required but not entered yet
  const hasEstimatedCostInForm = useMemo(
    () =>
      form.estimated_cost !== '' &&
      form.estimated_cost !== null &&
      !isNaN(Number(form.estimated_cost)),
    [form.estimated_cost]
  );
  const hasEstimatedCostInData = useMemo(
    () =>
      caseData?.estimated_cost !== null && caseData?.estimated_cost !== undefined,
    [caseData?.estimated_cost]
  );
  const estimatedCostMissing = useMemo(
    () => form.cost_required && !hasEstimatedCostInForm && !hasEstimatedCostInData,
    [form.cost_required, hasEstimatedCostInForm, hasEstimatedCostInData]
  );

  const toggleChecklist = useCallback((idx: number) => {
    setChecklist((prev) => {
      const newChecklist = [...prev];
      newChecklist[idx] = !newChecklist[idx];
      return newChecklist;
    });
  }, []);

  const updateForm = useCallback((updates: Partial<Stage3FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    // Reset validation when user starts typing
    if (shouldValidateCost && updates.estimated_cost !== undefined) {
      setShouldValidateCost(false);
    }
  }, [shouldValidateCost]);

  const validateCost = useCallback((): boolean => {
    if (form.cost_required) {
      const costValue = form.estimated_cost.trim();
      const numValue = parseFloat(costValue);

      if (
        !costValue ||
        costValue === '' ||
        (costValue !== '0' && isNaN(numValue)) ||
        numValue < 0
      ) {
        setShouldValidateCost(true);
        const costInput = document.getElementById('estimated_cost');
        if (costInput) {
          costInput.focus();
          costInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
    }
    setShouldValidateCost(false);
    return true;
  }, [form.cost_required, form.estimated_cost]);

  const getUpdateData = useCallback(
    (includeStatus = false) => {
      const updateData: Partial<CaseDetail> = {
        root_cause: form.root_cause,
        solution_description: form.solution_description,
        planned_execution_date: form.planned_execution_date,
        solution_checklist: JSON.stringify(checklist),
        cost_required: form.cost_required,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined,
        cost_description: form.cost_description,
      };

      if (includeStatus) {
        if (form.cost_required) {
          updateData.status = CASE_STATUS.PENDING;
        } else {
          updateData.cost_required = false;
          updateData.estimated_cost = undefined;
          updateData.cost_description = undefined;
          if (caseData?.status === CASE_STATUS.PENDING) {
            updateData.status = CASE_STATUS.IN_PROGRESS;
          }
        }
      }

      return updateData;
    },
    [form, checklist, caseData?.status]
  );

  // Check if cost fields have changed from initial values
  const hasCostChanges = useMemo(() => {
    if (!form.cost_required) return false;
    
    const currentEstimatedCost = form.estimated_cost ? Number(form.estimated_cost) : null;
    const currentCostDescription = form.cost_description || '';
    
    // Compare estimated_cost (handle null and number comparison)
    const estimatedCostChanged = 
      (currentEstimatedCost === null && initialValues.estimated_cost !== null) ||
      (currentEstimatedCost !== null && initialValues.estimated_cost === null) ||
      (currentEstimatedCost !== null && initialValues.estimated_cost !== null && 
       Math.abs(currentEstimatedCost - initialValues.estimated_cost) >= 0.01);
    
    // Compare cost_description
    const costDescriptionChanged = currentCostDescription !== initialValues.cost_description;
    
    return estimatedCostChanged || costDescriptionChanged;
  }, [form.cost_required, form.estimated_cost, form.cost_description, initialValues]);

  // Check if cost has been saved before (has initial estimated_cost)
  const hasSavedCost = useMemo(
    () => initialValues.estimated_cost !== null,
    [initialValues.estimated_cost]
  );

  return {
    form,
    setForm: updateForm,
    checklist,
    toggleChecklist,
    checklistItems,
    isCurrent,
    editable,
    canAdvance,
    isRejected,
    estimatedCostMissing,
    shouldValidateCost,
    setShouldValidateCost,
    validateCost,
    getUpdateData,
    canEditStage3,
    hasCostChanges,
    hasSavedCost,
    initialValues,
  };
}

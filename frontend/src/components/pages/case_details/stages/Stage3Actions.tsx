import { memo, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../../../Button';
import type { CaseDetail } from '../../../../api/cases';
import { CASE_STATUS } from '../../../../constants/caseStatus';
import { STAGE } from '../../../../constants/stages';
import { TIMING } from '../../../../constants/timing';
import { getCase } from '../../../../api/cases';

interface Stage3ActionsProps {
  isCurrent: boolean;
  costRequired: boolean;
  canAdvance: boolean;
  isRejected: boolean;
  estimatedCostMissing: boolean;
  form: {
    root_cause: string;
    solution_description: string;
    planned_execution_date: string;
    cost_required: boolean;
    estimated_cost: string;
    cost_description: string;
  };
  checklist: boolean[];
  caseData: CaseDetail;
  onUpdate: (data: Partial<CaseDetail>, options?: { skipToast?: boolean }) => Promise<void>;
  onAdvance: () => Promise<void>;
  onCloseAccordion: () => void;
  onOpenStage: (stageNum: number) => void;
  onValidateCost: () => boolean;
  onResetValidation: () => void;
  hasCostChanges: boolean;
  hasSavedCost: boolean;
  currentCostAttachmentsCount: number;
  initialCostAttachmentsCount: number;
}

/**
 * Component for Stage 3 action buttons (Save, Update, Complete)
 */
function Stage3Actions({
  isCurrent,
  costRequired,
  canAdvance,
  isRejected,
  estimatedCostMissing,
  form,
  checklist,
  caseData,
  onUpdate,
  onAdvance,
  onCloseAccordion,
  onOpenStage,
  onValidateCost,
  onResetValidation,
  hasCostChanges,
  hasSavedCost,
  currentCostAttachmentsCount,
  initialCostAttachmentsCount,
}: Stage3ActionsProps) {
  // Check if cost attachments have changed
  const costAttachmentsChanged = currentCostAttachmentsCount !== initialCostAttachmentsCount;
  
  // Check if there are any changes to cost-related fields
  const hasAnyCostChanges = hasCostChanges || costAttachmentsChanged;
  
  // Determine if button should be disabled
  // Disable if:
  // 1. When not current stage (updating completed stage) and no changes
  // 2. When rejected and no changes (must change to resubmit)
  const shouldDisableButton = useMemo(() => {
    if (!costRequired) return false; // Not applicable if cost not required
    if (estimatedCostMissing) return true; // Always disable if cost is missing
    
    // When updating a completed stage, must have changes
    if (!isCurrent && !hasAnyCostChanges) return true;
    
    // When rejected, must have changes to resubmit
    if (isRejected && !hasAnyCostChanges) return true;
    
    return false;
  }, [costRequired, estimatedCostMissing, isCurrent, isRejected, hasAnyCostChanges]);
  const handleSave = useCallback(async () => {
    if (!onValidateCost()) return;
    onResetValidation();
    
    await onUpdate({
      ...form,
      solution_checklist: JSON.stringify(checklist),
      status: CASE_STATUS.PENDING,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined,
    });
    setTimeout(() => {
      onCloseAccordion();
    }, TIMING.ACCORDION_CLOSE_DELAY);
  }, [form, checklist, onUpdate, onCloseAccordion, onValidateCost, onResetValidation]);

  const handleComplete = useCallback(async () => {
    const updateData: Partial<CaseDetail> = {
      root_cause: form.root_cause,
      solution_description: form.solution_description,
      planned_execution_date: form.planned_execution_date,
      solution_checklist: JSON.stringify(checklist),
      cost_required: false,
      estimated_cost: undefined,
      cost_description: undefined,
    };
    if (caseData.status === CASE_STATUS.PENDING) {
      updateData.status = CASE_STATUS.IN_PROGRESS;
    }
    // Skip toast for update when completing (will show toast after advance)
    const willAdvance = caseData.current_stage === STAGE.STAGE_3 && canAdvance;
    await onUpdate(updateData, { skipToast: willAdvance });
    if (willAdvance) {
      await onAdvance();
      setTimeout(() => {
        onOpenStage(4);
      }, TIMING.STAGE_OPEN_DELAY);
    }
  }, [form, checklist, caseData, canAdvance, onUpdate, onAdvance, onOpenStage]);

  const handleUpdate = useCallback(async () => {
    if (!onValidateCost()) return;
    onResetValidation();
    
    await onUpdate({
      ...form,
      solution_checklist: JSON.stringify(checklist),
      status: CASE_STATUS.PENDING,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined,
    });
    setTimeout(() => {
      onCloseAccordion();
    }, TIMING.ACCORDION_CLOSE_DELAY);
  }, [form, checklist, onUpdate, onCloseAccordion, onValidateCost, onResetValidation]);

  const handleUpdateWithoutCost = useCallback(async () => {
    const updateData: Partial<CaseDetail> = {
      root_cause: form.root_cause,
      solution_description: form.solution_description,
      planned_execution_date: form.planned_execution_date,
      solution_checklist: JSON.stringify(checklist),
      cost_required: false,
      estimated_cost: undefined,
      cost_description: undefined,
    };
    if (caseData.status === CASE_STATUS.PENDING) {
      updateData.status = CASE_STATUS.IN_PROGRESS;
    }
    await onUpdate(updateData);
    setTimeout(async () => {
      const updatedCase = await getCase(caseData.id);
      onOpenStage(updatedCase.data.current_stage);
    }, TIMING.STAGE_OPEN_DELAY);
  }, [form, checklist, caseData, onUpdate, onOpenStage]);

  if (isCurrent) {
    // Stage is current (not completed)
    if (costRequired) {
      // Checkbox is selected
      const buttonText = hasSavedCost ? 'Update' : 'Save';
      return (
        <>
          <Button onClick={handleSave} variant="primary" disabled={shouldDisableButton}>
            {buttonText}
          </Button>
          <p className="button-message button-message-warning">
            <AlertCircle className="inline w-4 h-4 mr-1" />
            {isRejected
              ? 'Was rejected. Please update and resubmit.'
              : 'Save first, then wait for Leader approval'}
          </p>
        </>
      );
    } else {
      // Checkbox is not selected - Complete without approval
      return (
        <Button onClick={handleComplete} variant="primary">
          Complete
        </Button>
      );
    }
  } else {
    // Stage is completed
    if (costRequired) {
      // Checkbox is selected
      return (
        <>
          <Button onClick={handleUpdate} variant="primary" disabled={shouldDisableButton}>
            Update
          </Button>
          <p className="button-message button-message-warning">
            <AlertCircle className="inline w-4 h-4 mr-1" />
            {isRejected
              ? 'Was rejected. Please update and resubmit.'
              : 'Save first, then wait for Leader approval'}
          </p>
        </>
      );
    } else {
      // Checkbox is not selected - Update without setting status to pending
      return (
        <Button onClick={handleUpdateWithoutCost} variant="primary">
          Update
        </Button>
      );
    }
  }
}

export default memo(Stage3Actions);


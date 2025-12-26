import { memo, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../../../Button';
import type { CaseDetail } from '../../../../api/cases';
import { CASE_STATUS, FINAL_COST_STATUS } from '../../../../constants/caseStatus';
import { TIMING } from '../../../../constants/timing';

interface Stage5ActionsProps {
  showSaveButton: boolean;
  showFinalCostSection: boolean;
  finalCostMissing: boolean;
  finalCostPendingApproval: boolean;
  savedFinalCost: number | null;
  form: {
    cs_notes: string;
    final_feedback: string;
    final_rating: number;
    final_cost: string;
  };
  caseData: CaseDetail;
  onUpdate: (data: Partial<CaseDetail>) => Promise<void>;
  onClose: () => Promise<void>;
  onRedo: () => Promise<void>;
  onCloseAccordion: () => void;
}

/**
 * Component for Stage 5 action buttons (Save, Update, Complete, Redo)
 */
function Stage5Actions({
  showSaveButton,
  showFinalCostSection,
  finalCostMissing,
  finalCostPendingApproval,
  savedFinalCost,
  form,
  caseData,
  onUpdate,
  onClose,
  onRedo,
  onCloseAccordion,
}: Stage5ActionsProps) {
  const handleSave = useCallback(async () => {
    const updateData: Partial<CaseDetail> = {
      cs_notes: form.cs_notes,
      final_feedback: form.final_feedback,
      final_rating: form.final_rating,
    };
    if (form.final_cost !== '') {
      updateData.final_cost = Number(form.final_cost);
      const finalCost = Number(form.final_cost);
      const estimatedCost = caseData.estimated_cost;
      if (estimatedCost !== null && Math.abs(finalCost - estimatedCost) >= 0.01) {
        updateData.status = CASE_STATUS.PENDING;
        updateData.final_cost_status = FINAL_COST_STATUS.PENDING;
      }
    }
    await onUpdate(updateData);
    setTimeout(() => {
      onCloseAccordion();
    }, TIMING.ACCORDION_CLOSE_DELAY);
  }, [form, caseData, onUpdate, onCloseAccordion]);

  return (
    <>
      <div className="stage5-actions">
        {showSaveButton && showFinalCostSection ? (
          <Button onClick={handleSave} variant="primary" alwaysAutoWidth>
            {savedFinalCost !== null ? 'Update' : 'Save'}
          </Button>
        ) : (
          <Button
            onClick={onClose}
            variant="primary"
            alwaysAutoWidth
            disabled={!!(finalCostMissing || finalCostPendingApproval)}
          >
            Complete
          </Button>
        )}
        <Button onClick={onRedo} variant="secondary" alwaysAutoWidth>
          Redo → Back to Stage 3
        </Button>
      </div>
      {showSaveButton && showFinalCostSection && (
        <p className="button-message button-message-warning">
          <AlertCircle className="inline w-4 h-4 mr-1" />
          {caseData.final_cost_status === FINAL_COST_STATUS.REJECTED &&
          caseData.status === CASE_STATUS.REJECTED
            ? 'Was rejected. Please update and resubmit.'
            : 'Save first, then wait for Leader approval'}
        </p>
      )}
    </>
  );
}

export default memo(Stage5Actions);


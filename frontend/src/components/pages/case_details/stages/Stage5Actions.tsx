import { memo, useCallback, useMemo } from 'react';
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
  hasFinalCostChanged: boolean;
  form: {
    cs_notes: string;
    final_feedback: string;
    final_rating: number;
    final_cost: string;
  };
  caseData: CaseDetail;
  getUpdateData: (includeFinalCost: boolean, status?: string) => Partial<CaseDetail>;
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
  hasFinalCostChanged,
  caseData,
  getUpdateData,
  onUpdate,
  onClose,
  onRedo,
  onCloseAccordion,
}: Stage5ActionsProps) {
  // Disable Update button if final_cost hasn't changed from initial value
  const shouldDisableUpdate = useMemo(() => {
    if (!showSaveButton || !showFinalCostSection) return false;
    // If there's a saved final cost, button should be disabled if no changes
    return savedFinalCost !== null && !hasFinalCostChanged;
  }, [showSaveButton, showFinalCostSection, savedFinalCost, hasFinalCostChanged]);
  const handleSave = useCallback(async () => {
    // Use getUpdateData from hook which handles approved_final_cost logic correctly
    const updateData = getUpdateData(true);
    await onUpdate(updateData);
    setTimeout(() => {
      onCloseAccordion();
    }, TIMING.ACCORDION_CLOSE_DELAY);
  }, [getUpdateData, onUpdate, onCloseAccordion]);

  return (
    <>
      <div className="stage5-actions">
        {showSaveButton && showFinalCostSection ? (
          <Button onClick={handleSave} variant="primary" alwaysAutoWidth disabled={shouldDisableUpdate}>
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

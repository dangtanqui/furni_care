import { useMemo, useCallback, memo } from 'react';
import { Check, X } from 'lucide-react';
import Button from '../../../Button';
import FinalCostSection from './FinalCostSection';
import ClientFeedbackSection from './ClientFeedbackSection';
import Stage5Actions from './Stage5Actions';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { useStage5Form } from '../../../../hooks/pages/useStage5Form';
import { TIMING } from '../../../../constants/timing';
import { CASE_STATUS, FINAL_COST_STATUS } from '../../../../constants/caseStatus';
import { STAGE } from '../../../../constants/stages';
import '../../../../styles/components/pages/case_details/stages/Stage5Content.css';

interface Stage5ContentProps {
  canEdit: boolean;
  onCloseAccordion: () => void;
}

function Stage5Content({ canEdit, onCloseAccordion }: Stage5ContentProps) {
  const {
    caseData,
    isCS,
    isLeader,
    isTechnician,
    handleUpdate,
    handleRedo,
    handleApproveFinalCost,
    handleRejectFinalCost,
  } = useCaseDetailsContext();

  if (!caseData) return null;

  // Use custom hook for form management
  const {
    form,
    setForm,
    editable,
    showFinalCostSection,
    finalCostMissing,
    finalCostPendingApproval,
    showSaveButton,
    savedFinalCost,
    getUpdateData,
  } = useStage5Form({
    caseData,
    isCS,
    canEdit,
  });

  const handleClose = useCallback(async () => {
    try {
      // Only allow closing if final_cost is approved (when final cost section is shown)
      if (showFinalCostSection && caseData.final_cost_status !== FINAL_COST_STATUS.APPROVED) {
        alert('Final cost must be approved before closing the case.');
        return;
      }
      
      const updateData = getUpdateData(true, CASE_STATUS.CLOSED);
      await handleUpdate(updateData);
      setTimeout(() => {
        onCloseAccordion();
      }, TIMING.ACCORDION_CLOSE_DELAY);
    } catch (error) {
      alert('Failed to close case. Please try again.');
    }
  }, [getUpdateData, handleUpdate, onCloseAccordion, showFinalCostSection, caseData.final_cost_status]);


  const handleApprove = useCallback(async () => {
    await handleApproveFinalCost();
    setTimeout(() => {
      onCloseAccordion();
    }, TIMING.ACCORDION_CLOSE_DELAY);
  }, [handleApproveFinalCost, onCloseAccordion]);

  const handleReject = useCallback(async () => {
    await handleRejectFinalCost();
    setTimeout(() => {
      onCloseAccordion();
    }, TIMING.ACCORDION_CLOSE_DELAY);
  }, [handleRejectFinalCost, onCloseAccordion]);

  // Memoize leader approval logic
  const canLeaderApprove = useMemo(() => {
    const finalCostStatus = caseData.final_cost_status;
    const savedFinalCost = caseData.final_cost;
    const estimatedCost = caseData.estimated_cost;
    const finalCostDiffers =
      savedFinalCost !== null &&
      estimatedCost !== null &&
      Math.abs(savedFinalCost - estimatedCost) >= 0.01;

    return (
      isLeader &&
      savedFinalCost !== null &&
      finalCostDiffers &&
      finalCostStatus !== FINAL_COST_STATUS.APPROVED &&
      finalCostStatus !== FINAL_COST_STATUS.REJECTED &&
      caseData.status !== CASE_STATUS.CLOSED &&
      caseData.status !== CASE_STATUS.CANCELLED
    );
  }, [
    isLeader,
    caseData.final_cost_status,
    caseData.final_cost,
    caseData.estimated_cost,
    caseData.status,
  ]);

  // Memoize waiting message logic
  const shouldShowWaitingMessage = useMemo(() => {
    if (canEdit) return false;
    if (caseData.current_stage !== STAGE.STAGE_5) return false;
    if (
      caseData.status === CASE_STATUS.CLOSED ||
      caseData.status === CASE_STATUS.CANCELLED
    )
      return false;

    const isFinalCostRejected =
      caseData.final_cost_status === FINAL_COST_STATUS.REJECTED;

    if (isLeader) {
      if (isFinalCostRejected && showFinalCostSection) return true;
      if (finalCostMissing) return true;
      if (finalCostPendingApproval) return false; // Leader has buttons
      return true;
    } else if (isTechnician) {
      if (finalCostMissing) return true;
      if (finalCostPendingApproval) return true;
      return true;
    } else if (isCS) {
      if (
        !canEdit &&
        finalCostPendingApproval &&
        caseData.final_cost_status !== FINAL_COST_STATUS.REJECTED
      )
        return true;
      return false;
    }
    return false;
  }, [
    canEdit,
    caseData,
    isLeader,
    isTechnician,
    isCS,
    showFinalCostSection,
    finalCostMissing,
    finalCostPendingApproval,
  ]);

  const waitingMessage = useMemo(() => {
    const isFinalCostRejected =
      caseData.final_cost_status === FINAL_COST_STATUS.REJECTED;

    if (finalCostMissing) {
      return '⏳ Waiting for CS to enter';
    }
    if (isFinalCostRejected && showFinalCostSection) {
      return '⏳ Waiting for CS to update';
    }
    if (finalCostPendingApproval) {
      if (isLeader) {
        return null; // Leader has approve buttons
      }
      return '⏳ Waiting for Leader to approve';
    }
    if (isCS) {
      return null; // CS should be editing
    }
    return '⏳ Waiting for CS to complete';
  }, [caseData, showFinalCostSection, finalCostMissing, finalCostPendingApproval, isLeader, isCS]);

  return (
    <div className="stage5-container">
      <div>
        <label htmlFor="cs_notes" className="stage5-label">Note</label>
        {editable ? (
          <textarea
            id="cs_notes"
            name="cs_notes"
            value={form.cs_notes}
            onChange={e => setForm({ ...form, cs_notes: e.target.value })}
            className="stage5-textarea"
            autoComplete="off"
          />
        ) : (
          <p className="stage5-readonly-content">{caseData.cs_notes || '-'}</p>
        )}
      </div>

      {/* Final Cost Section - Show if cost was approved in Stage 3 */}
      {showFinalCostSection && (
        <FinalCostSection
          form={form}
          setForm={setForm}
          editable={editable}
          canEdit={canEdit}
        />
      )}

      <ClientFeedbackSection
        form={{
          final_feedback: form.final_feedback,
          final_rating: form.final_rating,
        }}
        setForm={(updates) => setForm({ ...form, ...updates })}
        editable={editable}
        caseData={caseData}
      />

      {/* Leader approve/reject buttons for final cost */}
      {canLeaderApprove && (
        <div className="stage5-final-cost-actions">
          <div className="stage5-final-cost-approve-reject-buttons">
            <Button
              onClick={handleApprove}
              variant="primary"
              leftIcon={<Check />}
              alwaysAutoWidth
            >
              Approve
            </Button>
            <Button
              onClick={handleReject}
              variant="secondary"
              leftIcon={<X />}
              alwaysAutoWidth
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {editable &&
        caseData.status !== CASE_STATUS.CLOSED &&
        caseData.status !== CASE_STATUS.CANCELLED && (
          <Stage5Actions
            showSaveButton={showSaveButton ?? false}
            showFinalCostSection={showFinalCostSection ?? false}
            finalCostMissing={finalCostMissing ?? false}
            finalCostPendingApproval={finalCostPendingApproval ?? false}
            savedFinalCost={savedFinalCost}
            form={form}
            caseData={caseData}
            onUpdate={handleUpdate}
            onClose={handleClose}
            onRedo={handleRedo}
            onCloseAccordion={onCloseAccordion}
          />
        )}

      {/* Waiting Message */}
      {shouldShowWaitingMessage && waitingMessage && (
        <div className="stage5-waiting-message">
          <p>{waitingMessage}</p>
        </div>
      )}
    </div>
  );
}

export default memo(Stage5Content);

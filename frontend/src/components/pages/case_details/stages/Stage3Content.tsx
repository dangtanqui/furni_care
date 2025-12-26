import { useMemo, useCallback, memo } from 'react';
import { Paperclip } from 'lucide-react';
import Button from '../../../Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import EmptyState from '../../../EmptyState';
import CostApprovalSection from './CostApprovalSection';
import SolutionFormFields from './SolutionFormFields';
import Stage3Actions from './Stage3Actions';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { useStage3Form } from '../../../../hooks/pages/useStage3Form';
import { TIMING } from '../../../../constants/timing';
import { CASE_STATUS, COST_STATUS } from '../../../../constants/caseStatus';
import { ATTACHMENT_TYPE } from '../../../../constants/attachmentTypes';
import type { CaseAttachmentItem } from '../../../../api/cases';
import '../../../../styles/components/pages/case_details/stages/Stage3Content.css';

interface Stage3ContentProps {
  canEdit: boolean;
  onCloseAccordion: () => void;
  onOpenStage: (stageNum: number) => void;
}

function Stage3Content({ canEdit, onCloseAccordion, onOpenStage }: Stage3ContentProps) {
  const {
    caseData,
    isLeader,
    isCS,
    isTechnician,
    currentUserId,
    handleUpdate,
    handleAdvance,
    handleCancelCase,
    handleAttachmentsUpload,
    handleAttachmentDelete,
  } = useCaseDetailsContext();

  if (!caseData) return null;

  // Use custom hook for form management
  const {
    form,
    setForm,
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
    canEditStage3,
  } = useStage3Form({
    caseData,
    isTechnician,
    currentUserId,
    canEdit,
  });

  // Memoize attachments
  const attachments = useMemo(
    () => caseData.stage_attachments?.['3'] || [],
    [caseData.stage_attachments]
  );
  const costAttachments = useMemo(
    () =>
      attachments.filter(
        (att: CaseAttachmentItem) => att.attachment_type === ATTACHMENT_TYPE.COST
      ),
    [attachments]
  );
  const stageAttachments = useMemo(
    () =>
      attachments.filter(
        (att: CaseAttachmentItem) => att.attachment_type !== ATTACHMENT_TYPE.COST
      ),
    [attachments]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (!selectedFiles.length) return;
      await handleAttachmentsUpload(3, selectedFiles);
      e.target.value = '';
    },
    [handleAttachmentsUpload]
  );

  const handleCostFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (!selectedFiles.length) return;
      await handleAttachmentsUpload(3, selectedFiles, 'cost');
      e.target.value = '';
    },
    [handleAttachmentsUpload]
  );

  const handleCancel = useCallback(async () => {
    try {
      await handleCancelCase();
      setTimeout(() => {
        onCloseAccordion();
      }, TIMING.ACCORDION_CLOSE_DELAY);
    } catch (error) {
      alert('Failed to cancel case. Please try again.');
    }
  }, [handleCancelCase, onCloseAccordion]);

  // Memoize waiting message logic
  const shouldShowWaitingMessage = useMemo(() => {
    if (canEdit || !isCurrent) return false;

    const costPendingApproval =
      caseData.cost_required &&
      caseData.status === CASE_STATUS.PENDING &&
      caseData.cost_status !== COST_STATUS.APPROVED &&
      caseData.cost_status !== COST_STATUS.REJECTED;

    if (costPendingApproval && (isCS || isTechnician)) return true;
    if (isRejected && caseData.cost_required && isLeader) return true;
    if (!isRejected && !costPendingApproval && (isCS || isLeader)) return true;
    return false;
  }, [canEdit, isCurrent, caseData, isCS, isTechnician, isLeader, isRejected]);

  const waitingMessage = useMemo(() => {
    if (isRejected && caseData.cost_required) {
      return '⏳ Waiting for Technician to update or CS to close';
    }
    const costPendingApproval =
      caseData.cost_required &&
      caseData.status === CASE_STATUS.PENDING &&
      caseData.cost_status !== COST_STATUS.APPROVED &&
      caseData.cost_status !== COST_STATUS.REJECTED;
    if (costPendingApproval) {
      return '⏳ Waiting for Leader to complete';
    }
    return '⏳ Waiting for Technician to complete';
  }, [isRejected, caseData]);

  return (
    <div className="stage3-container">
      <SolutionFormFields
        form={{
          root_cause: form.root_cause,
          solution_description: form.solution_description,
          planned_execution_date: form.planned_execution_date,
        }}
        setForm={setForm}
        editable={editable}
        caseData={caseData}
      />

      <div>
        {editable ? (
          <FileUpload
            id="stage3-attachments"
            name="stage3-attachments"
            accept="image/*,.pdf"
            onFileChange={handleFileChange}
            disabled={!editable}
          />
        ) : (
          <label className="stage3-label">Photos / Attachments</label>
        )}
        {stageAttachments.length === 0 && !canEdit ? (
          <EmptyState
            icon={<Paperclip />}
            title="No attachments"
            description="No files have been uploaded for this stage."
          />
        ) : (
          <AttachmentGrid
            attachments={stageAttachments}
            canEdit={canEdit}
            onDelete={handleAttachmentDelete}
          />
        )}
      </div>

      <div>
        <label className="stage3-label-checklist">Checklist</label>
        <div className="stage3-checklist-container">
          {checklistItems.map((item, idx) => (
            <label
              key={idx}
              htmlFor={`stage3-checklist-${idx}`}
              className="stage3-checklist-item"
            >
              <input
                id={`stage3-checklist-${idx}`}
                name={`stage3-checklist-${idx}`}
                type="checkbox"
                checked={checklist[idx] || false}
                onChange={() => editable && toggleChecklist(idx)}
                disabled={!editable}
                className="stage3-checklist-checkbox"
              />
              <span
                className={checklist[idx] ? 'stage3-checklist-completed' : ''}
              >
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Cost Section */}
      <div className="stage3-cost-section">
        <CostApprovalSection
          form={{
            cost_required: form.cost_required,
            estimated_cost: form.estimated_cost,
            cost_description: form.cost_description,
          }}
          setForm={(newForm) => {
            setForm(newForm);
            if (shouldValidateCost && newForm.estimated_cost !== undefined) {
              setShouldValidateCost(false);
            }
          }}
          editable={editable}
          canEdit={canEdit}
          costAttachments={costAttachments}
          handleCostFileChange={handleCostFileChange}
          shouldValidate={shouldValidateCost}
        />
      </div>

      {/* Action Buttons */}
      {(canEdit || canEditStage3) && (
        <Stage3Actions
          isCurrent={isCurrent}
          costRequired={form.cost_required}
          canAdvance={canAdvance}
          isRejected={isRejected}
          estimatedCostMissing={estimatedCostMissing}
          form={form}
          checklist={checklist}
          caseData={caseData}
          onUpdate={handleUpdate}
          onAdvance={handleAdvance}
          onCloseAccordion={onCloseAccordion}
          onOpenStage={onOpenStage}
          onValidateCost={validateCost}
          onResetValidation={() => setShouldValidateCost(false)}
        />
      )}

      {/* CS can cancel case when cost is rejected */}
      {isCS &&
        isRejected &&
        form.cost_required &&
        caseData.status !== CASE_STATUS.CLOSED &&
        caseData.status !== CASE_STATUS.CANCELLED && (
          <div className="stage3-cancel-section">
            <Button onClick={handleCancel} variant="primary">
              Cancel
            </Button>
          </div>
        )}

      {/* Waiting Message */}
      {shouldShowWaitingMessage && (
        <div className="stage3-waiting-message">
          <p>{waitingMessage}</p>
        </div>
      )}
    </div>
  );
}

export default memo(Stage3Content);

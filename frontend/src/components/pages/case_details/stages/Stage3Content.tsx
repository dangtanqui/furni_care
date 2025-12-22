import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../../../Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import CostApprovalSection from './CostApprovalSection';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { TIMING } from '../../../../constants/timing';
import type { CaseAttachmentItem } from '../../../../api/cases';
import type { CaseDetail as CaseDetailType } from '../../../../api/cases';
import { getCase } from '../../../../api/cases';
import '../../../../styles/components/pages/case_details/stages/Stage3Content.css';

interface Stage3ContentProps {
  canEdit: boolean;
  onCloseAccordion: () => void;
  onOpenStage: (stageNum: number) => void;
}

export default function Stage3Content({ canEdit, onCloseAccordion, onOpenStage }: Stage3ContentProps) {
  const { caseData, isLeader, isCS, isTechnician, handleUpdate, handleAdvance, handleCancelCase, handleAttachmentsUpload, handleAttachmentDelete } = useCaseDetailsContext();
  
  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;
  
  const [form, setForm] = useState({
    root_cause: nonNullCaseData.root_cause || '',
    solution_description: nonNullCaseData.solution_description || '',
    planned_execution_date: nonNullCaseData.planned_execution_date || '',
    cost_required: nonNullCaseData.cost_required || false,
    estimated_cost: nonNullCaseData.estimated_cost ? String(nonNullCaseData.estimated_cost) : '',
    cost_description: nonNullCaseData.cost_description || '',
  });
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(nonNullCaseData.solution_checklist || '[]');
    } catch { return [false, false]; }
  });
  const checklistItems = ['Prepare materials', 'Schedule with client'];
  const isCurrent = nonNullCaseData.current_stage === 3;
  const canEditStage3 = isTechnician && nonNullCaseData.current_stage >= 3 && nonNullCaseData.status !== 'closed' && nonNullCaseData.status !== 'cancelled';
  // Allow editing if canEdit OR canEditStage3 (fallback for technician)
  const editable = canEdit || canEditStage3;
  const canAdvance = !form.cost_required || nonNullCaseData.cost_status === 'approved';
  const isRejected = nonNullCaseData.cost_status === 'rejected';
  const attachments = nonNullCaseData.stage_attachments?.['3'] || [];
  const costAttachments = attachments.filter((att: CaseAttachmentItem) => att.attachment_type === 'cost');
  const stageAttachments = attachments.filter((att: CaseAttachmentItem) => att.attachment_type !== 'cost');

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      root_cause: nonNullCaseData.root_cause || '',
      solution_description: nonNullCaseData.solution_description || '',
      planned_execution_date: nonNullCaseData.planned_execution_date || '',
      cost_required: nonNullCaseData.cost_required || false,
      estimated_cost: nonNullCaseData.estimated_cost ? String(nonNullCaseData.estimated_cost) : '',
      cost_description: nonNullCaseData.cost_description || '',
    });
    try {
      setChecklist(JSON.parse(nonNullCaseData.solution_checklist || '[]'));
    } catch {
      setChecklist([false, false]);
    }
  }, [nonNullCaseData.id, nonNullCaseData.root_cause, nonNullCaseData.solution_description, nonNullCaseData.planned_execution_date, nonNullCaseData.cost_required, nonNullCaseData.estimated_cost, nonNullCaseData.cost_description, nonNullCaseData.solution_checklist]);

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await handleAttachmentsUpload(3, selectedFiles);
    e.target.value = '';
  };

  const handleCostFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await handleAttachmentsUpload(3, selectedFiles, 'cost');
    e.target.value = '';
  };


  return (
    <div className="stage3-container">
      <div>
        <label htmlFor="root_cause" className="stage3-label">Root Cause</label>
        {editable ? (
          <input
            id="root_cause"
            name="root_cause"
            type="text"
            value={form.root_cause}
            onChange={e => setForm({ ...form, root_cause: e.target.value })}
            className="stage3-input"
          />
        ) : (
          <p className="stage3-readonly-content">{nonNullCaseData.root_cause || '-'}</p>
        )}
      </div>

      <div>
        <label htmlFor="solution_description" className="stage3-label">Solution Description</label>
        {editable ? (
          <textarea
            id="solution_description"
            name="solution_description"
            value={form.solution_description}
            onChange={e => setForm({ ...form, solution_description: e.target.value })}
            className="stage3-textarea"
          />
        ) : (
          <p className="stage3-readonly-content">{nonNullCaseData.solution_description || '-'}</p>
        )}
      </div>

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
        <AttachmentGrid attachments={stageAttachments} canEdit={canEdit} onDelete={handleAttachmentDelete} />
        {!canEdit && stageAttachments.length === 0 && (
          <p className="stage3-no-attachments">No attachments</p>
        )}
      </div>

      <div>
        <label className="stage3-label-checklist">Checklist</label>
        <div className="stage3-checklist-container">
          {checklistItems.map((item, idx) => (
            <label key={idx} htmlFor={`stage3-checklist-${idx}`} className="stage3-checklist-item">
              <input
                id={`stage3-checklist-${idx}`}
                name={`stage3-checklist-${idx}`}
                type="checkbox"
                checked={checklist[idx] || false}
                onChange={() => editable && toggleChecklist(idx)}
                disabled={!editable}
                className="stage3-checklist-checkbox"
              />
              <span className={checklist[idx] ? 'stage3-checklist-completed' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="planned_execution_date" className="stage3-label">Planned Execution Date</label>
        {editable ? (
          <input
            id="planned_execution_date"
            name="planned_execution_date"
            type="date"
            value={form.planned_execution_date}
            onChange={e => setForm({ ...form, planned_execution_date: e.target.value })}
            className="stage3-input"
          />
        ) : (
          <p>{nonNullCaseData.planned_execution_date || '-'}</p>
        )}
      </div>

      {/* Cost Section */}
      <div className="stage3-cost-section">
        <CostApprovalSection
          form={{
            cost_required: form.cost_required,
            estimated_cost: form.estimated_cost,
            cost_description: form.cost_description,
          }}
          setForm={(newForm) => setForm({ ...form, ...newForm })}
          editable={editable}
          canEdit={canEdit}
          costAttachments={costAttachments}
          handleCostFileChange={handleCostFileChange}
        />
      </div>

      {(canEdit || canEditStage3) && (
        <>
          {isCurrent ? (
            /* Stage is current (not completed) */
            form.cost_required ? (
              /* Checkbox is selected */
              <>
                <Button 
                  onClick={async () => {
                    await handleUpdate({ 
                      ...form, 
                      solution_checklist: JSON.stringify(checklist), 
                      status: 'pending',
                      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
                    });
                    setTimeout(() => {
                      onCloseAccordion();
                    }, TIMING.ACCORDION_CLOSE_DELAY);
                  }} 
                  variant="primary"
                >
                  Save
                </Button>
                <p className="button-message button-message-warning">
                  <AlertCircle className="inline w-4 h-4 mr-1" /> 
                  {isRejected 
                    ? 'Cost plan was rejected. Please update and resubmit for approval'
                    : 'Save first, then wait for Leader approval'
                  }
                </p>
              </>
            ) : (
              /* Checkbox is not selected - Complete without approval, clear pending status */
              <Button 
                onClick={async () => {
                  const updateData: Partial<CaseDetailType> = { 
                    root_cause: form.root_cause,
                    solution_description: form.solution_description,
                    planned_execution_date: form.planned_execution_date,
                    solution_checklist: JSON.stringify(checklist),
                    cost_required: false,
                    estimated_cost: undefined,
                    cost_description: undefined,
                  };
                  // Only include status if it needs to be changed from pending
                  if (nonNullCaseData.status === 'pending') {
                    updateData.status = 'in_progress';
                  }
                  await handleUpdate(updateData);
                  if (nonNullCaseData.current_stage === 3 && canAdvance) {
                    await handleAdvance();
                    setTimeout(() => {
                      onOpenStage(4);
                    }, TIMING.STAGE_OPEN_DELAY);
                  }
                }} 
                variant="primary"
              >
                Complete
              </Button>
            )
          ) : (
            /* Stage is completed */
            form.cost_required ? (
              /* Checkbox is selected */
              <>
                <Button 
                  onClick={async () => {
                    await handleUpdate({ 
                      ...form, 
                      solution_checklist: JSON.stringify(checklist),
                      status: 'pending',
                      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
                    });
                    setTimeout(() => {
                      onCloseAccordion();
                    }, TIMING.ACCORDION_CLOSE_DELAY);
                  }} 
                  variant="primary"
                >
                  Update
                </Button>
                <p className="button-message button-message-warning">
                  <AlertCircle className="inline w-4 h-4 mr-1" /> 
                  {isRejected 
                    ? 'Cost plan was rejected. Please update and resubmit for approval'
                    : 'Save first, then wait for Leader approval'
                  }
                </p>
              </>
            ) : (
              /* Checkbox is not selected - Update without setting status to pending, clear pending if exists */
              <Button 
                onClick={async () => {
                  const updateData: Partial<CaseDetailType> = { 
                    root_cause: form.root_cause,
                    solution_description: form.solution_description,
                    planned_execution_date: form.planned_execution_date,
                    solution_checklist: JSON.stringify(checklist),
                    cost_required: false,
                    estimated_cost: undefined,
                    cost_description: undefined,
                  };
                  // Only include status if it needs to be changed from pending
                  if (nonNullCaseData.status === 'pending') {
                    updateData.status = 'in_progress';
                  }
                  await handleUpdate(updateData);
                  setTimeout(async () => {
                    const updatedCase = await getCase(nonNullCaseData.id);
                    onOpenStage(updatedCase.data.current_stage);
                  }, TIMING.STAGE_OPEN_DELAY);
                }} 
                variant="primary"
              >
                Update
              </Button>
            )
          )}
        </>
      )}

      {/* CS can cancel case when cost is rejected */}
      {isCS && isRejected && form.cost_required && nonNullCaseData.status !== 'closed' && nonNullCaseData.status !== 'cancelled' && (
        <div className="stage3-cancel-section">
          <Button 
            onClick={async () => {
              try {
                await handleCancelCase();
                setTimeout(() => {
                  onCloseAccordion();
                }, TIMING.ACCORDION_CLOSE_DELAY);
              } catch (error) {
                alert('Failed to cancel case. Please try again.');
              }
            }} 
            variant="primary"
          >
            Cancel
          </Button>
        </div>
      )}

      {!canEdit && isCurrent && (() => {
        // Check if cost is pending approval using caseData (not form, because CS can't edit)
        // cost_status can be 'pending', null, or undefined when waiting for approval
        const costPendingApproval = nonNullCaseData.cost_required && 
          nonNullCaseData.status === 'pending' && 
          nonNullCaseData.cost_status !== 'approved' && 
          nonNullCaseData.cost_status !== 'rejected';
        
        // When pending approval: show for CS and Technician (not Leader - Leader is approving)
        if (costPendingApproval && (isCS || isTechnician)) return true;
        // When rejected: show for Leader only (CS has Cancel button, Technician can update, Leader needs to see status)
        if (isRejected && nonNullCaseData.cost_required && isLeader) return true;
        // Otherwise: show for CS and Leader when not rejected and not pending approval (Technician is editing)
        if (!isRejected && !costPendingApproval && (isCS || isLeader)) return true;
        return false;
      })() && (
        <div className="stage3-waiting-message">
          {isRejected && nonNullCaseData.cost_required ? (
            <p>⏳ Waiting for Technician to update cost plan or CS to close case</p>
          ) : (() => {
            // Check if cost is pending approval
            const costPendingApproval = nonNullCaseData.cost_required && 
              nonNullCaseData.status === 'pending' && 
              nonNullCaseData.cost_status !== 'approved' && 
              nonNullCaseData.cost_status !== 'rejected';
            return costPendingApproval;
          })() ? (
            <p>⏳ Waiting for Leader to complete solution & plan</p>
          ) : (
            <p>⏳ Waiting for Technician to complete solution & plan</p>
          )}
        </div>
      )}
    </div>
  );
}


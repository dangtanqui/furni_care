import { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import Button from '../../../../fields/Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import type { Stage3Props } from '../../../../types/components/pages/CaseDetails';
import { getCase } from '../../../../api/cases';
import '../../../../styles/components/pages/case_details/stages/Stage3Content.css';

export default function Stage3Content({ caseData, canEdit, isLeader, isCS, isTechnician, onUpdate, onAdvance, onApproveCost, onRejectCost, onCancelCase, onUploadAttachments, onCloseAccordion, onOpenStage }: Stage3Props) {
  const [form, setForm] = useState({
    root_cause: caseData.root_cause || '',
    solution_description: caseData.solution_description || '',
    planned_execution_date: caseData.planned_execution_date || '',
    cost_required: caseData.cost_required || false,
    estimated_cost: caseData.estimated_cost || '',
    cost_description: caseData.cost_description || '',
  });
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(caseData.solution_checklist || '[]');
    } catch { return [false, false]; }
  });
  const checklistItems = ['Prepare materials', 'Schedule with client'];
  const isCurrent = caseData.current_stage === 3;
  const canAdvance = !form.cost_required || caseData.cost_status === 'approved';
  const showSavePlan = caseData.status !== 'pending' && form.cost_required && caseData.cost_status !== 'approved' && caseData.cost_status !== 'rejected';
  const isRejected = caseData.cost_status === 'rejected';
  // Check pending approval using caseData (not form) to ensure consistency
  // cost_status can be 'pending', null, or undefined when waiting for approval
  const isPendingApproval = caseData.cost_required && 
    caseData.status === 'pending' && 
    caseData.cost_status !== 'approved' && 
    caseData.cost_status !== 'rejected';
  const attachments = caseData.stage_attachments?.['3'] || [];
  const costAttachments = attachments.filter((att: any) => att.attachment_type === 'cost');
  const stageAttachments = attachments.filter((att: any) => att.attachment_type !== 'cost');

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      root_cause: caseData.root_cause || '',
      solution_description: caseData.solution_description || '',
      planned_execution_date: caseData.planned_execution_date || '',
      cost_required: caseData.cost_required || false,
      estimated_cost: caseData.estimated_cost || '',
      cost_description: caseData.cost_description || '',
    });
    try {
      setChecklist(JSON.parse(caseData.solution_checklist || '[]'));
    } catch {
      setChecklist([false, false]);
    }
  }, [caseData.id, caseData.root_cause, caseData.solution_description, caseData.planned_execution_date, caseData.cost_required, caseData.estimated_cost, caseData.cost_description, caseData.solution_checklist]);

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await onUploadAttachments(3, selectedFiles);
    e.target.value = '';
  };

  const handleCostFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await onUploadAttachments(3, selectedFiles, 'cost');
    e.target.value = '';
  };

  const handleSubmit = async () => {
    await onUpdate({ 
      ...form, 
      solution_checklist: JSON.stringify(checklist),
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
    });
    // Only advance if Stage 3 is the current stage AND can advance (cost approved or not required)
    if (caseData.current_stage === 3 && canAdvance) {
      await onAdvance();
      // Open Stage 4 after advancing
      setTimeout(() => {
        onOpenStage(4);
      }, 100);
    } else {
      // If updating a completed stage or cannot advance, reload case data to get updated current_stage, then open it
      const updatedCase = await getCase(caseData.id);
      setTimeout(() => {
        onOpenStage(updatedCase.data.current_stage);
      }, 100);
    }
  };

  return (
    <div className="stage3-container">
      <div>
        <label htmlFor="root_cause" className="stage3-label">Root Cause</label>
        {canEdit ? (
          <input
            id="root_cause"
            name="root_cause"
            type="text"
            value={form.root_cause}
            onChange={e => setForm({ ...form, root_cause: e.target.value })}
            className="stage3-input"
          />
        ) : (
          <p className="stage3-readonly-content">{caseData.root_cause || '-'}</p>
        )}
      </div>

      <div>
        <label htmlFor="solution_description" className="stage3-label">Solution Description</label>
        {canEdit ? (
          <textarea
            id="solution_description"
            name="solution_description"
            value={form.solution_description}
            onChange={e => setForm({ ...form, solution_description: e.target.value })}
            className="stage3-textarea"
          />
        ) : (
          <p className="stage3-readonly-content">{caseData.solution_description || '-'}</p>
        )}
      </div>

      <div>
        {canEdit ? (
          <FileUpload
            id="stage3-attachments"
            name="stage3-attachments"
            accept="image/*,.pdf"
            onFileChange={handleFileChange}
            disabled={!canEdit}
          />
        ) : (
          <label className="stage3-label">Photos / Attachments</label>
        )}
        <AttachmentGrid attachments={stageAttachments} />
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
                onChange={() => canEdit && toggleChecklist(idx)}
                disabled={!canEdit}
                className="stage3-checklist-checkbox"
              />
              <span className={checklist[idx] ? 'stage3-checklist-completed' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="planned_execution_date" className="stage3-label">Planned Execution Date</label>
        {canEdit ? (
          <input
            id="planned_execution_date"
            name="planned_execution_date"
            type="date"
            value={form.planned_execution_date}
            onChange={e => setForm({ ...form, planned_execution_date: e.target.value })}
            className="stage3-input"
          />
        ) : (
          <p>{caseData.planned_execution_date || '-'}</p>
        )}
      </div>

      {/* Cost Section */}
      <div className="stage3-cost-section">
        <label htmlFor="cost_required" className="stage3-cost-checkbox-label">
          <input
            id="cost_required"
            name="cost_required"
            type="checkbox"
            checked={form.cost_required}
            onChange={e => setForm({ ...form, cost_required: e.target.checked })}
            disabled={!canEdit}
          />
          <span className="font-medium">Cost Required</span>
        </label>

        {form.cost_required && (
          <div className="stage3-cost-space-y">
            <div className="stage3-cost-grid">
              <div className="stage3-cost-flex-col">
                <label htmlFor="estimated_cost" className="stage3-label">Estimated Cost</label>
                {canEdit ? (
                  <div className="stage3-cost-input-wrapper">
                    <span className="stage3-cost-currency">$</span>
                    <input
                      id="estimated_cost"
                      name="estimated_cost"
                      type="number"
                      value={form.estimated_cost}
                      onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
                      className="stage3-cost-input"
                      placeholder="0.00"
                    />
                  </div>
                ) : (
                  <p className="stage3-cost-display">${caseData.estimated_cost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
              </div>
              <div className="stage3-cost-flex-col">
                <label className="stage3-label">Cost Status</label>
                <p className={
                  caseData.cost_status === 'approved' ? 'stage3-cost-status-approved' :
                  caseData.cost_status === 'rejected' ? 'stage3-cost-status-rejected' :
                  'stage3-cost-status-pending'
                }>
                  {caseData.cost_status || 'Pending'}
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="cost_description" className="stage3-label">Cost Description</label>
              {canEdit ? (
                <input
                  id="cost_description"
                  name="cost_description"
                  type="text"
                  value={form.cost_description}
                  onChange={e => setForm({ ...form, cost_description: e.target.value })}
                  className="stage3-input"
                />
              ) : (
                <p>{caseData.cost_description || '-'}</p>
              )}
            </div>
            <div>
              {canEdit ? (
                <FileUpload
                  id="cost-attachments"
                  name="cost-attachments"
                  accept="image/*,.pdf"
                  onFileChange={handleCostFileChange}
                  label="Cost Attachments"
                  uploadText="Click to upload cost documents"
                  disabled={!canEdit}
                />
              ) : (
                <label className="stage3-label">Cost Attachments</label>
              )}
              <AttachmentGrid attachments={costAttachments} />
            </div>

            {isLeader && caseData.status === 'pending' && caseData.cost_status !== 'approved' && caseData.cost_status !== 'rejected' && (
              <div className="stage3-cost-actions">
                <Button onClick={onApproveCost} variant="primary" leftIcon={<Check />}>
                  Approve Cost
                </Button>
                <Button onClick={onRejectCost} variant="danger" leftIcon={<X />}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {canEdit && !isLeader && (
        <div className="button-container">
          {canAdvance ? (
            <Button onClick={handleSubmit} variant={isCurrent ? 'primary' : 'secondary'}>
              {isCurrent ? 'Complete' : 'Update'}
            </Button>
          ) : showSavePlan ? (
            <>
              <Button 
                onClick={async () => {
                  await onUpdate({ 
                    ...form, 
                    solution_checklist: JSON.stringify(checklist), 
                    status: 'pending',
                    estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
                  });
                  // Wait a bit for the update to complete before closing accordion
                  setTimeout(() => {
                    onCloseAccordion();
                  }, 100);
                }} 
                variant="primary"
              >
                Save Plan
              </Button>
              <p className="button-message button-message-warning">
                <AlertCircle className="inline w-4 h-4 mr-1" /> Save first, then wait for Leader approval
              </p>
            </>
          ) : (
            <>
              {/* When cost is rejected */}
              {isRejected && caseData.cost_required ? (
                <>
                  <Button 
                    onClick={async () => {
                      await onUpdate({ 
                        ...form, 
                        solution_checklist: JSON.stringify(checklist),
                        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
                      });
                      setTimeout(() => {
                        onCloseAccordion();
                      }, 100);
                    }} 
                    variant="secondary"
                  >
                    Update Plan
                  </Button>
                  <p className="button-message button-message-error">
                    <AlertCircle className="inline w-4 h-4 mr-1" /> Cost has been rejected. Please update the cost plan.
                  </p>
                </>
              ) : isPendingApproval ? (
                <>
                  <Button 
                    onClick={async () => {
                      await onUpdate({ 
                        ...form, 
                        solution_checklist: JSON.stringify(checklist), 
                        status: 'pending',
                        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
                      });
                      setTimeout(() => {
                        onCloseAccordion();
                      }, 100);
                    }} 
                    variant="secondary"
                  >
                    Update Plan
                  </Button>
                  <p className="button-message button-message-warning">
                    <AlertCircle className="inline w-4 h-4 mr-1" /> Waiting for Leader approval. You can still update the plan.
                  </p>
                </>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* CS can cancel case when cost is rejected */}
      {isCS && isRejected && form.cost_required && caseData.status !== 'closed' && caseData.status !== 'cancelled' && (
        <div className="stage3-cancel-section">
          <Button 
            onClick={async () => {
              try {
                await onCancelCase();
                setTimeout(() => {
                  onCloseAccordion();
                }, 100);
              } catch (error) {
                console.error('Failed to cancel case:', error);
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
        const costPendingApproval = caseData.cost_required && 
          caseData.status === 'pending' && 
          caseData.cost_status !== 'approved' && 
          caseData.cost_status !== 'rejected';
        
        // When pending approval: show for CS and Technician (not Leader - Leader is approving)
        if (costPendingApproval && (isCS || isTechnician)) return true;
        // When rejected: show for Leader only (CS has Cancel button, Technician can update, Leader needs to see status)
        if (isRejected && caseData.cost_required && isLeader) return true;
        // Otherwise: show for CS and Leader when not rejected and not pending approval (Technician is editing)
        if (!isRejected && !costPendingApproval && (isCS || isLeader)) return true;
        return false;
      })() && (
        <div className="stage3-waiting-message">
          {isRejected && caseData.cost_required ? (
            <p>⏳ Waiting for Technician to update cost plan or CS to close case</p>
          ) : (() => {
            // Check if cost is pending approval
            const costPendingApproval = caseData.cost_required && 
              caseData.status === 'pending' && 
              caseData.cost_status !== 'approved' && 
              caseData.cost_status !== 'rejected';
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


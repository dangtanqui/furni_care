import { useState, useEffect } from 'react';
import Button from '../../../Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import SignatureCanvas from './SignatureCanvas';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { TIMING } from '../../../../constants/timing';
import { getCase } from '../../../../api/cases';
import '../../../../styles/components/pages/case_details/stages/Stage4Content.css';

interface Stage4ContentProps {
  canEdit: boolean;
  onOpenStage: (stageNum: number) => void;
}

export default function Stage4Content({ canEdit, onOpenStage }: Stage4ContentProps) {
  const { caseData, isCS, isLeader, handleUpdate, handleAdvance, handleAttachmentsUpload, handleAttachmentDelete } = useCaseDetailsContext();
  
  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;
  
  const [form, setForm] = useState({
    execution_report: nonNullCaseData.execution_report || '',
    client_feedback: nonNullCaseData.client_feedback || '',
    client_rating: nonNullCaseData.client_rating || 5,
    client_signature: nonNullCaseData.client_signature || '',
  });
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(nonNullCaseData.execution_checklist || '[]');
    } catch { return [false, false]; }
  });
  const isCurrent = nonNullCaseData.current_stage === 4;
  const attachments = nonNullCaseData.stage_attachments?.['4'] || [];
  const checklistItems = ['Work completed as planned', 'Client satisfied with work'];

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      execution_report: nonNullCaseData.execution_report || '',
      client_feedback: nonNullCaseData.client_feedback || '',
      client_rating: nonNullCaseData.client_rating || 5,
      client_signature: nonNullCaseData.client_signature || '',
    });
    try {
      setChecklist(JSON.parse(nonNullCaseData.execution_checklist || '[]'));
    } catch {
      setChecklist([false, false]);
    }
  }, [nonNullCaseData.id, nonNullCaseData.execution_report, nonNullCaseData.client_feedback, nonNullCaseData.client_rating, nonNullCaseData.execution_checklist, nonNullCaseData.client_signature]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await handleAttachmentsUpload(4, selectedFiles);
    e.target.value = '';
  };

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };


  return (
    <div className="stage4-container">
      <div>
        <label htmlFor="execution_report" className="stage4-label">Execution Report</label>
        {canEdit ? (
          <textarea
            id="execution_report"
            name="execution_report"
            value={form.execution_report}
            onChange={e => setForm({ ...form, execution_report: e.target.value })}
            className="stage4-textarea"
            placeholder="Document execution details..."
          />
        ) : (
          <p className="stage4-readonly-content">{nonNullCaseData.execution_report || '-'}</p>
        )}
      </div>

      <div>
        {canEdit ? (
          <FileUpload
            id="stage4-attachments"
            name="stage4-attachments"
            accept="image/*,.pdf"
            onFileChange={handleFileChange}
            disabled={!canEdit}
          />
        ) : (
          <label className="stage4-label">Photos / Attachments</label>
        )}
        <AttachmentGrid attachments={attachments} canEdit={canEdit} onDelete={handleAttachmentDelete} />
        {!canEdit && attachments.length === 0 && (
          <p className="stage4-no-attachments">No attachments</p>
        )}
      </div>

      <div>
        <label className="stage4-checklist-label">Execution Checklist</label>
        <div className="stage4-checklist-container">
          {checklistItems.map((item, idx) => (
            <label key={idx} htmlFor={`stage4-checklist-${idx}`} className="stage4-checklist-item">
              <input
                id={`stage4-checklist-${idx}`}
                name={`stage4-checklist-${idx}`}
                type="checkbox"
                checked={checklist[idx] || false}
                onChange={() => canEdit && toggleChecklist(idx)}
                disabled={!canEdit}
                className="stage4-checklist-checkbox"
              />
              <span className={checklist[idx] ? 'stage4-checklist-completed' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <SignatureCanvas
        value={form.client_signature}
        onChange={(signature) => setForm({ ...form, client_signature: signature })}
        canEdit={canEdit}
      />

      <div className="stage4-feedback-section">
        <h4 className="stage4-feedback-title">Client Feedback</h4>
        <div className="space-y-3">
          <div>
            <label className="stage4-rating-label">Rating</label>
            <div className="stage4-rating-container">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => canEdit && setForm({ ...form, client_rating: n })}
                  disabled={!canEdit}
                  className={`stage4-rating-button ${form.client_rating >= n ? 'stage4-rating-button-active' : 'stage4-rating-button-inactive'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="client_feedback" className="stage4-label">Feedback</label>
            {canEdit ? (
              <textarea
                id="client_feedback"
                name="client_feedback"
                value={form.client_feedback}
                onChange={e => setForm({ ...form, client_feedback: e.target.value })}
                className="stage4-feedback-textarea"
              />
            ) : (
              <p>{nonNullCaseData.client_feedback || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {canEdit && (
        <Button 
          onClick={async () => {
            await handleUpdate({
              ...form,
              execution_checklist: JSON.stringify(checklist),
            });
            // Only advance if Stage 4 is the current stage
            if (isCurrent) {
              // Advance stage after successful update
              await handleAdvance();
              // Open Stage 5 after advancing
              setTimeout(() => {
                onOpenStage(5);
              }, TIMING.STAGE_OPEN_DELAY);
            } else {
              // If updating a completed stage, reload case data to get updated current_stage, then open it
              const updatedCase = await getCase(nonNullCaseData.id);
              setTimeout(() => {
                onOpenStage(updatedCase.data.current_stage);
              }, TIMING.STAGE_OPEN_DELAY);
            }
          }} 
          variant="primary"
        >
          {isCurrent ? 'Complete' : 'Update'}
        </Button>
      )}

      {!canEdit && isCurrent && (isCS || isLeader) && (
        <div className="stage4-waiting-message">
          <p>⏳ Waiting for Technician to complete</p>
        </div>
      )}
    </div>
  );
}


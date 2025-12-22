import { useState, useEffect } from 'react';
import Button from '../../../Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { TIMING } from '../../../../constants/timing';
import { getCase } from '../../../../api/cases';
import '../../../../styles/components/pages/case_details/stages/Stage2Content.css';

interface Stage2ContentProps {
  canEdit: boolean;
  onOpenStage: (stageNum: number) => void;
}

export default function Stage2Content({ canEdit, onOpenStage }: Stage2ContentProps) {
  const { caseData, isCS, isLeader, handleUpdate, handleAdvance, handleAttachmentsUpload, handleAttachmentDelete } = useCaseDetailsContext();
  
  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;
  
  const [report, setReport] = useState(nonNullCaseData.investigation_report || '');
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(nonNullCaseData.investigation_checklist || '[]');
    } catch { return [false, false, false]; }
  });
  const isCurrent = nonNullCaseData.current_stage === 2;
  const checklistItems = ['Check furniture condition', 'Document damage areas', 'Take measurements'];
  const attachments = nonNullCaseData.stage_attachments?.['2'] || [];

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setReport(nonNullCaseData.investigation_report || '');
    try {
      setChecklist(JSON.parse(nonNullCaseData.investigation_checklist || '[]'));
    } catch {
      setChecklist([false, false, false]);
    }
  }, [nonNullCaseData.id, nonNullCaseData.investigation_report, nonNullCaseData.investigation_checklist]);

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await handleAttachmentsUpload(2, selectedFiles);
    e.target.value = '';
  };

  const handleFinish = async () => {
    await handleUpdate({ investigation_report: report, investigation_checklist: JSON.stringify(checklist) });
    // Only advance if Stage 2 is the current stage
    if (nonNullCaseData.current_stage === 2) {
      await handleAdvance();
      // Open Stage 3 after advancing
      setTimeout(() => {
        onOpenStage(3);
      }, TIMING.STAGE_OPEN_DELAY);
    } else {
      // If updating a completed stage, reload case data to get updated current_stage, then open it
      const updatedCase = await getCase(nonNullCaseData.id);
      setTimeout(() => {
        onOpenStage(updatedCase.data.current_stage);
      }, TIMING.STAGE_OPEN_DELAY);
    }
  };

  return (
    <div className="stage2-container">
      <div>
        <label htmlFor="investigation_report" className="stage2-label">Investigation Report</label>
        {canEdit ? (
          <textarea
            id="investigation_report"
            name="investigation_report"
            value={report}
            onChange={e => setReport(e.target.value)}
            className="stage2-textarea"
            placeholder="Document findings from site investigation..."
          />
        ) : (
          <p className="stage2-readonly-content">{nonNullCaseData.investigation_report || 'No report yet'}</p>
        )}
      </div>

      <div>
        {canEdit ? (
          <FileUpload
            id="stage2-attachments"
            name="stage2-attachments"
            accept="image/*,.pdf"
            onFileChange={handleFileChange}
            disabled={!canEdit}
          />
        ) : (
          <label className="stage2-label">Photos / Attachments</label>
        )}
        <AttachmentGrid attachments={attachments} canEdit={canEdit} onDelete={handleAttachmentDelete} />
        {!canEdit && attachments.length === 0 && (
          <p className="stage2-no-attachments">No attachments</p>
        )}
      </div>

      <div>
        <label className="stage2-label-checklist">Checklist</label>
        <div className="stage2-checklist-container">
          {checklistItems.map((item, idx) => (
            <label key={idx} htmlFor={`stage2-checklist-${idx}`} className="stage2-checklist-item">
              <input
                id={`stage2-checklist-${idx}`}
                name={`stage2-checklist-${idx}`}
                type="checkbox"
                checked={checklist[idx] || false}
                onChange={() => canEdit && toggleChecklist(idx)}
                disabled={!canEdit}
                className="stage2-checklist-checkbox"
              />
              <span className={checklist[idx] ? 'stage2-checklist-completed' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {canEdit && (
        <Button onClick={handleFinish} variant="primary">
          {isCurrent ? 'Complete' : 'Update'}
        </Button>
      )}

      {!canEdit && isCurrent && (isCS || isLeader) && (
        <div className="stage2-waiting-message">
          <p>⏳ Waiting for Technician to complete</p>
        </div>
      )}
    </div>
  );
}


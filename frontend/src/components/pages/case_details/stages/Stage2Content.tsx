import { useState, useEffect } from 'react';
import Button from '../../../../fields/Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import type { Stage2Props } from '../../../../types/components/pages/CaseDetails';
import { getCase } from '../../../../api/cases';
import '../../../../styles/components/pages/case_details/stages/Stage2Content.css';

export default function Stage2Content({ caseData, canEdit, onUpdate, onAdvance, isCS, isLeader, onUploadAttachments, onOpenStage }: Stage2Props) {
  const [report, setReport] = useState(caseData.investigation_report || '');
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(caseData.investigation_checklist || '[]');
    } catch { return [false, false, false]; }
  });
  const isCurrent = caseData.current_stage === 2;
  const checklistItems = ['Check furniture condition', 'Document damage areas', 'Take measurements'];
  const attachments = caseData.stage_attachments?.['2'] || [];

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setReport(caseData.investigation_report || '');
    try {
      setChecklist(JSON.parse(caseData.investigation_checklist || '[]'));
    } catch {
      setChecklist([false, false, false]);
    }
  }, [caseData.id, caseData.investigation_report, caseData.investigation_checklist]);

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await onUploadAttachments(2, selectedFiles);
    e.target.value = '';
  };

  const handleFinish = async () => {
    await onUpdate({ investigation_report: report, investigation_checklist: JSON.stringify(checklist) });
    // Only advance if Stage 2 is the current stage
    if (caseData.current_stage === 2) {
      await onAdvance();
      // Open Stage 3 after advancing
      setTimeout(() => {
        onOpenStage(3);
      }, 100);
    } else {
      // If updating a completed stage, reload case data to get updated current_stage, then open it
      const updatedCase = await getCase(caseData.id);
      setTimeout(() => {
        onOpenStage(updatedCase.data.current_stage);
      }, 100);
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
          <p className="stage2-readonly-content">{caseData.investigation_report || 'No report yet'}</p>
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
        <AttachmentGrid attachments={attachments} />
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

      {canEdit && isCurrent && (
        <Button onClick={handleFinish} variant="primary">
          Complete
        </Button>
      )}

      {!canEdit && isCurrent && (isCS || isLeader) && (
        <div className="stage2-waiting-message">
          <p>⏳ Waiting for Technician to complete investigation</p>
        </div>
      )}
    </div>
  );
}


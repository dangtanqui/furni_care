import { Paperclip } from 'lucide-react';
import Button from '../../../Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import EmptyState from '../../../EmptyState';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { TIMING } from '../../../../constants/timing';
import { getCase } from '../../../../api/cases';
import type { CaseAttachmentItem } from '../../../../api/cases';

interface SolutionFormSectionProps {
  form: {
    root_cause: string;
    solution_description: string;
    solution_checklist: boolean[];
    cost_required: boolean;
    estimated_cost: string;
    cost_description: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  checklist: boolean[];
  setChecklist: React.Dispatch<React.SetStateAction<boolean[]>>;
  editable: boolean;
  canEdit: boolean;
  isCurrent: boolean;
  canAdvance: boolean;
  stageAttachments: CaseAttachmentItem[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onCloseAccordion: () => void;
  onOpenStage: (stageNum: number) => void;
}

export default function SolutionFormSection({
  form,
  setForm,
  checklist,
  setChecklist,
  editable,
  canEdit,
  isCurrent,
  canAdvance,
  stageAttachments,
  handleFileChange,
  onOpenStage,
}: SolutionFormSectionProps) {
  const { caseData, handleUpdate, handleAdvance, handleAttachmentDelete } = useCaseDetailsContext();

  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const checklistItems = ['Identify root cause', 'Propose solution', 'Estimate timeline'];

  return (
    <>
      <div>
        <label htmlFor="root_cause" className="stage3-label">Root Cause</label>
        {editable ? (
          <textarea
            id="root_cause"
            name="root_cause"
            value={form.root_cause}
            onChange={e => setForm({ ...form, root_cause: e.target.value })}
            className="stage3-textarea"
            placeholder="Describe the root cause of the issue..."
            autoComplete="off"
          />
        ) : (
          <p className="stage3-readonly-content">{nonNullCaseData.root_cause || 'No root cause documented'}</p>
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
            placeholder="Describe the proposed solution..."
            autoComplete="off"
          />
        ) : (
          <p className="stage3-readonly-content">{nonNullCaseData.solution_description || 'No solution documented'}</p>
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
        {stageAttachments.length === 0 && !editable ? (
          <EmptyState
            icon={<Paperclip />}
            title="No attachments"
            description="No files have been uploaded for this stage."
          />
        ) : (
          <AttachmentGrid attachments={stageAttachments} canEdit={canEdit} onDelete={handleAttachmentDelete} />
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

      {editable && (
        <Button
          onClick={async () => {
            await handleUpdate({
              ...form,
              solution_checklist: JSON.stringify(checklist),
              estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
            });
            if (isCurrent && canAdvance) {
              await handleAdvance();
              setTimeout(() => {
                onOpenStage(4);
              }, TIMING.STAGE_OPEN_DELAY);
            } else {
              const updatedCase = await getCase(nonNullCaseData.id);
              setTimeout(() => {
                onOpenStage(updatedCase.data.current_stage);
              }, TIMING.STAGE_OPEN_DELAY);
            }
          }}
          variant="primary"
        >
          {isCurrent && canAdvance ? 'Complete' : 'Update'}
        </Button>
      )}
    </>
  );
}

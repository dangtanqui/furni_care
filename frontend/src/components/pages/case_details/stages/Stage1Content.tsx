import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import Button from '../../../Button';
import Select from '../../../Select';
import AttachmentGrid from '../../../AttachmentGrid';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { TIMING } from '../../../../constants/timing';
import '../../../../styles/components/pages/case_details/stages/Stage1Content.css';

interface Stage1ContentProps {
  canEdit: boolean;
  onOpenStage: (stageNum: number) => void;
}

export default function Stage1Content({ canEdit, onOpenStage }: Stage1ContentProps) {
  const { caseData, technicians, isCS, handleUpdate, handleAdvance, handleAttachmentDelete } = useCaseDetailsContext();
  
  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;
  
  const [assignedTo, setAssignedTo] = useState('');
  const attachments = nonNullCaseData.stage_attachments?.['1'] || [];
  const isCurrent = nonNullCaseData.current_stage === 1;
  const currentAssignedId = nonNullCaseData.assigned_to?.id?.toString() || '';
  
  // Initialize assignedTo with current assigned technician
  useEffect(() => {
    if (currentAssignedId) {
      setAssignedTo(currentAssignedId);
    }
  }, [currentAssignedId]);

  return (
    <div className="stage1-container">
      <div className="stage1-grid">
        <div>
          <label className="stage1-label">Client</label>
          <p className="stage1-content">{nonNullCaseData.client.name}</p>
        </div>
        <div>
          <label className="stage1-label">Site</label>
          <p className="stage1-content">{nonNullCaseData.site.name} ({nonNullCaseData.site.city})</p>
        </div>
        <div>
          <label className="stage1-label">Contact Person</label>
          <p className="stage1-content">{nonNullCaseData.contact.name} - {nonNullCaseData.contact.phone}</p>
        </div>
        <div>
          <label className="stage1-label">Case Type</label>
          <p className="stage1-content">{nonNullCaseData.case_type}</p>
        </div>
      </div>
      
      <div>
        <label className="stage1-label">Description</label>
        <p className="stage1-content">{nonNullCaseData.description || '-'}</p>
      </div>

      <div>
        <label className="stage1-label">Photos / Attachments</label>
        <AttachmentGrid attachments={attachments} canEdit={canEdit} onDelete={handleAttachmentDelete} />
        {attachments.length === 0 && (
          <p className="stage1-no-attachments">No attachments</p>
        )}
      </div>

      {isCS && canEdit && (
        <div className="stage1-assign-section">
          <div className="stage1-assign-container">
            <div className="stage1-assign-row">
              <User className="stage1-user-icon" />
              <Select
                id="assigned_to"
                name="assigned_to"
                value={assignedTo || currentAssignedId || ''}
                onChange={(value) => setAssignedTo(value)}
                options={technicians.map((t) => ({ value: String(t.id), label: t.name }))}
                placeholder="Assign Technician"
                className="stage1-select-flex"
              />
            </div>
            <Button
              onClick={async () => {
                const selectedId = assignedTo || currentAssignedId;
                if (!selectedId || selectedId === '') return;
                try {
                  await handleUpdate({ assigned_to_id: Number(selectedId) });
                  if (isCurrent) {
                    await handleAdvance();
                    // Open Stage 2 after advancing
                    setTimeout(() => {
                      onOpenStage(2);
                    }, TIMING.STAGE_OPEN_DELAY);
                  }
                } catch (error) {
                  // Error is handled by useCaseDetails hook
                }
              }}
              variant="primary"
              disabled={(!assignedTo || assignedTo === '') && !currentAssignedId}
            >
              {isCurrent ? 'Complete' : 'Update'}
            </Button>
          </div>
        </div>
      )}

      {!canEdit && isCurrent && !isCS && (
        <div className="stage1-waiting-message">
          <p>⏳ Waiting for CS to complete input & categorization</p>
        </div>
      )}
    </div>
  );
}


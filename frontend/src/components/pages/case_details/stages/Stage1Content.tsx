import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import Button from '../../../../fields/Button';
import Select from '../../../Select';
import AttachmentGrid from '../../../AttachmentGrid';
import type { Stage1Props } from '../../../../types/components/pages/CaseDetails';
import '../../../../styles/components/pages/case_details/stages/Stage1Content.css';

export default function Stage1Content({ caseData, canEdit, isCS, technicians, onUpdate, onAdvance, onOpenStage, onDeleteAttachment }: Stage1Props) {
  const [assignedTo, setAssignedTo] = useState('');
  const attachments = caseData.stage_attachments?.['1'] || [];
  const isCurrent = caseData.current_stage === 1;
  const currentAssignedId = caseData.assigned_to?.id?.toString() || '';
  
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
          <p className="stage1-content">{caseData.client.name}</p>
        </div>
        <div>
          <label className="stage1-label">Site</label>
          <p className="stage1-content">{caseData.site.name} ({caseData.site.city})</p>
        </div>
        <div>
          <label className="stage1-label">Contact Person</label>
          <p className="stage1-content">{caseData.contact.name} - {caseData.contact.phone}</p>
        </div>
        <div>
          <label className="stage1-label">Case Type</label>
          <p className="stage1-content stage1-capitalize">{caseData.case_type}</p>
        </div>
      </div>
      
      <div>
        <label className="stage1-label">Description</label>
        <p className="stage1-content">{caseData.description || '-'}</p>
      </div>

      <div>
        <label className="stage1-label">Photos / Attachments</label>
        <AttachmentGrid attachments={attachments} canEdit={canEdit} onDelete={onDeleteAttachment} />
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
                options={technicians.map((t: any) => ({ value: String(t.id), label: t.name }))}
                placeholder="Assign Technician"
                className="stage1-select-flex"
              />
            </div>
            <Button
              onClick={async () => {
                const selectedId = assignedTo || currentAssignedId;
                if (!selectedId || selectedId === '') return;
                try {
                  await onUpdate({ assigned_to_id: Number(selectedId) });
                  if (isCurrent) {
                    await onAdvance();
                    // Open Stage 2 after advancing
                    setTimeout(() => {
                      onOpenStage(2);
                    }, 100);
                  }
                } catch (error) {
                  console.error('Failed to assign technician:', error);
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


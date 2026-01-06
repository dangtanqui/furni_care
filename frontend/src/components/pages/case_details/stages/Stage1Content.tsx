import { useState, useEffect, useRef, memo } from 'react';
import { User, Paperclip } from 'lucide-react';
import Button from '../../../Button';
import Select from '../../../Select';
import AttachmentGrid from '../../../AttachmentGrid';
import EmptyState from '../../../EmptyState';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { TIMING } from '../../../../constants/timing';
import type { CaseDetail } from '../../../../api/cases';
import '../../../../styles/components/pages/case_details/stages/Stage1Content.css';

interface Stage1ContentProps {
  canEdit: boolean;
  onOpenStage: (stageNum: number) => void;
}

function Stage1Content({ canEdit, onOpenStage }: Stage1ContentProps) {
  const { caseData, technicians, isCS, isTechnician, isLeader, handleUpdate, handleAdvance } = useCaseDetailsContext();
  
  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;
  
  const [assignedTo, setAssignedTo] = useState('');
  const attachments = nonNullCaseData.stage_attachments?.['1'] || [];
  const isCurrent = nonNullCaseData.current_stage === 1;
  const currentAssignedId = nonNullCaseData.assigned_to?.id?.toString() || '';
  const isAdvancingRef = useRef(false);
  
  // Initialize assignedTo with current assigned technician
  useEffect(() => {
    if (currentAssignedId) {
      setAssignedTo(currentAssignedId);
    }
  }, [currentAssignedId]);

  // Check if selected technician is the same as current assigned technician (when current_stage > 1)
  const selectedId = assignedTo || currentAssignedId;
  const isSelectingCurrentTechnician = nonNullCaseData.current_stage > 1 && 
                                       selectedId && 
                                       selectedId === currentAssignedId;
  
  // Check if technicians list is available
  const hasTechnicians = technicians && technicians.length > 0;

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
        {attachments.length === 0 ? (
          <EmptyState
            icon={<Paperclip />}
            title="No attachments"
            description="No files have been uploaded for this stage."
          />
        ) : (
          <AttachmentGrid attachments={attachments} canEdit={canEdit} />
        )}
      </div>

      {/* Show Assigned Technician for all roles (CS, technician, leader) */}
      {/* Always show assigned technician section, regardless of status (show "-" if not assigned) */}
      {/* CS sees this when cannot edit (e.g., cancelled case), technician and leader always see this */}
      {(isCS || isTechnician || isLeader) && !(isCS && canEdit) && (
        <div>
          <label className="stage1-label">Assigned Technician</label>
          <p className="stage1-content">
            {nonNullCaseData.assigned_to ? nonNullCaseData.assigned_to.name : '-'}
          </p>
        </div>
      )}

      {/* CS sees dropdown to assign when can edit */}
      {isCS && canEdit && (
        <div className="stage1-assign-section">
          <div className="stage1-assign-container">
            <div className="stage1-assign-row">
              <User className="stage1-user-icon" />
              <div className="stage1-select-flex">
                <label htmlFor="assigned_to" id="assigned_to-label" className="sr-only">Assign Technician</label>
                <Select
                  id="assigned_to"
                  name="assigned_to"
                  value={assignedTo || currentAssignedId || ''}
                  onChange={(value) => setAssignedTo(value)}
                  options={hasTechnicians ? technicians.map((t) => ({ value: String(t.id), label: t.name })) : []}
                  placeholder={hasTechnicians ? "Assign Technician" : "Loading technicians..."}
                />
              </div>
            </div>
            <Button
              onClick={async () => {
                const selectedId = assignedTo || currentAssignedId;
                if (!selectedId || selectedId === '') return;
                
                // Prevent duplicate calls
                if (isAdvancingRef.current) return;
                
                try {
                  // Store isCurrent before update to avoid race condition
                  const wasCurrent = isCurrent;
                  
                  // If current_stage >= 3, rollback to stage 2 when updating Stage 1
                  const updateData: Partial<CaseDetail> & { assigned_to_id: number } = { 
                    assigned_to_id: Number(selectedId),
                    status: 'in_progress' // Set status to in_progress when reassigning
                  };
                  if (nonNullCaseData.current_stage >= 3) {
                    updateData.current_stage = 2;
                  }
                  
                  // Skip toast for update since we'll show toast after advance
                  await handleUpdate(updateData, { skipToast: wasCurrent });
                  
                  // Only advance if it was current stage before update (to prevent duplicate calls)
                  if (wasCurrent && !isAdvancingRef.current) {
                    isAdvancingRef.current = true;
                    try {
                      await handleAdvance();
                      // Open Stage 2 after advancing
                      setTimeout(() => {
                        onOpenStage(2);
                      }, TIMING.STAGE_OPEN_DELAY);
                    } finally {
                      isAdvancingRef.current = false;
                    }
                  } else {
                    // When updating at stage 1 but case is not at stage 1, jump to current stage (or stage 2 if rolled back)
                    const targetStage = nonNullCaseData.current_stage >= 3 ? 2 : nonNullCaseData.current_stage;
                    setTimeout(() => {
                      onOpenStage(targetStage);
                    }, TIMING.STAGE_OPEN_DELAY);
                  }
                } catch (error) {
                  isAdvancingRef.current = false;
                  // Error is handled by useCaseDetails hook
                }
              }}
              variant="primary"
              disabled={
                (!selectedId || selectedId === '') || 
                isSelectingCurrentTechnician ||
                isAdvancingRef.current
              }
            >
              {isCurrent ? 'Complete' : 'Update'}
            </Button>
          </div>
        </div>
      )}

      {!canEdit && isCurrent && !isCS && (
        <div className="stage1-waiting-message">
          <p>⏳ Waiting for CS to complete</p>
        </div>
      )}
    </div>
  );
}

export default memo(Stage1Content);


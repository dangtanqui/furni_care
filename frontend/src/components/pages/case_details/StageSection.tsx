import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { StageSectionProps } from '../../../types/components/pages/CaseDetails';
import Stage1Content from './stages/Stage1Content';
import Stage2Content from './stages/Stage2Content';
import Stage3Content from './stages/Stage3Content';
import Stage4Content from './stages/Stage4Content';
import Stage5Content from './stages/Stage5Content';
import '../../../styles/components/pages/case_details/StageSection.css';

export default function StageSection({
  stage, caseData, expanded, onToggle, onOpenStage, canEdit, isCS, isLeader, isTechnician, technicians,
  onUpdate, onAdvance, onApproveCost, onRejectCost, onCancelCase, onRedo,
  onUploadAttachments, onDeleteAttachment
}: StageSectionProps) {
  // Stage is current if it matches current_stage and case is not closed/cancelled
  const isCurrent = stage.num === caseData.current_stage && caseData.status !== 'closed' && caseData.status !== 'cancelled';
  // Stage is completed if it's not current AND (it's before current_stage OR case is closed/cancelled and it's Stage 5)
  const isCompleted = !isCurrent && (stage.num < caseData.current_stage || ((caseData.status === 'closed' || caseData.status === 'cancelled') && stage.num === 5));

  return (
    <div className={`stage-section-card ${isCurrent ? 'stage-section-card-current' : ''}`}>
      <div
        className="stage-section-header"
        onClick={onToggle}
      >
        <div className="stage-section-header-left">
          <div className={`stage-section-number-circle ${
            isCompleted ? 'stage-section-number-completed' :
            isCurrent ? 'stage-section-number-current' :
            'stage-section-number-default'
          }`}>
            {isCompleted ? <Check className="stage-section-check-icon" /> : stage.num}
          </div>
          <span className="stage-section-title">Stage {stage.num} - {stage.name}</span>
        </div>
        <div className="stage-section-header-right">
          {isCompleted && <span className="stage-section-badge-completed">Completed</span>}
          {isCurrent && <span className="stage-section-badge-current">Current</span>}
          {expanded ? <ChevronUp className="stage-section-chevron-icon" /> : <ChevronDown className="stage-section-chevron-icon" />}
        </div>
      </div>

      <div className={`stage-section-content ${expanded ? '' : 'stage-section-content-hidden'}`}>
        {stage.num === 1 && (
          <Stage1Content
            caseData={caseData}
            canEdit={canEdit}
            isCS={isCS}
            technicians={technicians}
            onUpdate={onUpdate}
            onAdvance={onAdvance}
            onOpenStage={onOpenStage}
            onDeleteAttachment={onDeleteAttachment}
          />
        )}
        {stage.num === 2 && (
          <Stage2Content
            caseData={caseData}
            canEdit={canEdit}
            isCS={isCS}
            isLeader={isLeader}
            onUpdate={onUpdate}
            onAdvance={onAdvance}
            onUploadAttachments={onUploadAttachments}
            onDeleteAttachment={onDeleteAttachment}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 3 && (
          <Stage3Content
            caseData={caseData}
            canEdit={canEdit}
            isLeader={isLeader}
            isCS={isCS}
            isTechnician={isTechnician}
            onUpdate={onUpdate}
            onAdvance={onAdvance}
            onApproveCost={onApproveCost}
            onRejectCost={onRejectCost}
            onCancelCase={onCancelCase}
            onUploadAttachments={onUploadAttachments}
            onDeleteAttachment={onDeleteAttachment}
            onCloseAccordion={() => onToggle()}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 4 && (
          <Stage4Content
            caseData={caseData}
            canEdit={canEdit}
            isCS={isCS}
            isLeader={isLeader}
            onUpdate={onUpdate}
            onAdvance={onAdvance}
            onOpenStage={onOpenStage}
            onUploadAttachments={onUploadAttachments}
            onDeleteAttachment={onDeleteAttachment}
          />
        )}
        {stage.num === 5 && (
          <Stage5Content
            caseData={caseData}
            canEdit={canEdit}
            isCS={isCS}
            onUpdate={onUpdate}
            onRedo={onRedo}
          />
        )}
      </div>
    </div>
  );
}


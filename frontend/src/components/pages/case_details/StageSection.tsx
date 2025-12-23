import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useCaseDetailsContext } from '../../../contexts/CaseDetailsContext';
import Stage1Content from './stages/Stage1Content';
import Stage2Content from './stages/Stage2Content';
import Stage3Content from './stages/Stage3Content';
import Stage4Content from './stages/Stage4Content';
import Stage5Content from './stages/Stage5Content';
import '../../../styles/components/pages/case_details/StageSection.css';

interface StageSectionProps {
  stage: { num: number; name: string };
  expanded: boolean;
  onToggle: () => void;
  onOpenStage: (stageNum: number) => void;
  canEdit: boolean;
}

export default function StageSection({
  stage, expanded, onToggle, onOpenStage, canEdit
}: StageSectionProps) {
  const { caseData } = useCaseDetailsContext();
  
  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;
  
  // Stage is current if it matches current_stage and case is not closed
  // Note: cancelled cases still show their current_stage as "current" (but cannot be edited)
  const isCurrent = stage.num === nonNullCaseData.current_stage && nonNullCaseData.status !== 'closed';
  // Stage is completed if it's not current AND (it's before current_stage OR case is closed and it's Stage 5)
  // Note: cancelled cases keep their current_stage, no stages are marked as completed
  const isCompleted = !isCurrent && (stage.num < nonNullCaseData.current_stage || (nonNullCaseData.status === 'closed' && stage.num === 5));

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
            canEdit={canEdit}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 2 && (
          <Stage2Content
            canEdit={canEdit}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 3 && (
          <Stage3Content
            canEdit={canEdit}
            onCloseAccordion={() => onToggle()}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 4 && (
          <Stage4Content
            canEdit={canEdit}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 5 && (
          <Stage5Content
            canEdit={canEdit}
            onCloseAccordion={() => onToggle()}
          />
        )}
      </div>
    </div>
  );
}


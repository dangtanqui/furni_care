import { useMemo } from 'react';
import type { CaseDetailType } from '../../../types/components/pages/CaseDetails';
import { Check } from 'lucide-react';
import { STAGES } from '../../../constants/pages/CaseDetails';
import { getStatusColorClass, getPriorityColorClass } from '../../../utils/caseHelpers';
import '../../../styles/components/pages/case_details/CaseHeader.css';

interface CaseHeaderProps {
  caseData: CaseDetailType;
}

export default function CaseHeader({ caseData }: CaseHeaderProps) {

  const stageProgress = useMemo(() => {
    return STAGES.map((s, i) => {
      const isStageCurrent = s.num === caseData.current_stage && caseData.status !== 'closed' && caseData.status !== 'cancelled';
      const isStageCompleted = !isStageCurrent && (s.num < caseData.current_stage || (caseData.status === 'closed' && s.num === 5));
      return {
        stage: s,
        index: i,
        isStageCurrent,
        isStageCompleted,
      };
    });
  }, [caseData.current_stage, caseData.status]);

  return (
    <div className="case-header-card">
      <div className="case-header-grid">
        <div className="case-header-field case-header-order-1">
          <span className="case-header-label">Case ID:</span>
          <span className="case-header-value">{caseData.case_number}</span>
        </div>
        <div className="case-header-field case-header-order-2">
          <span className="case-header-label">Client:</span>
          <span className="case-header-value">{caseData.client.name}</span>
        </div>
        <div className="case-header-field case-header-order-3">
          <span className="case-header-label">Current Stage:</span>
          <span className="case-header-stage-value">{caseData.current_stage} - {caseData.stage_name}</span>
          {caseData.attempt_number > 1 && (
            <span className="case-header-attempt-badge">Attempt #{caseData.attempt_number}</span>
          )}
        </div>
        <div className="case-header-field case-header-order-4">
          <span className="case-header-label">Status:</span>
          <span 
            className={`px-3 py-1 rounded-full text-sm ${getStatusColorClass(caseData.status)}`}
            role="status"
            aria-label={`Case status: ${caseData.status}`}
          >
            {caseData.status}
          </span>
        </div>
        <div className="case-header-field case-header-order-5">
          <span className="case-header-label">Priority:</span>
          <span 
            className={getPriorityColorClass(caseData.priority)}
            role="status"
            aria-label={`Case priority: ${caseData.priority}`}
          >
            {caseData.priority}
          </span>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="case-header-progress">
        {stageProgress.map(({ stage, index, isStageCurrent, isStageCompleted }) => (
          <div key={stage.num} className="case-header-progress-item">
            <div 
              className={`case-header-progress-circle ${
                isStageCompleted ? 'case-header-progress-circle-completed' :
                isStageCurrent ? 'case-header-progress-circle-current' :
                'case-header-progress-circle-default'
              }`}
              role="img"
              aria-label={
                isStageCompleted ? `Stage ${stage.num} completed` :
                isStageCurrent ? `Stage ${stage.num} current` :
                `Stage ${stage.num} pending`
              }
            >
              {isStageCompleted ? <Check className="case-header-check-icon" aria-hidden="true" /> : stage.num}
            </div>
            {index < STAGES.length - 1 && (
              <div 
                className={`case-header-progress-connector ${isStageCompleted ? 'case-header-progress-connector-completed' : 'case-header-progress-connector-default'}`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


import type { CaseDetailType } from '../../../types/components/pages/CaseDetails';
import { Check } from 'lucide-react';
import { STAGES } from '../../../constants/pages/CaseDetails';
import { statusColors } from '../../../constants/pages/CaseList';
import '../../../styles/components/pages/case_details/CaseHeader.css';

interface CaseHeaderProps {
  caseData: CaseDetailType;
}

export default function CaseHeader({ caseData }: CaseHeaderProps) {
  return (
    <div className="case-header-card">
      <div className="case-header-grid">
        <div className="case-header-field">
          <span className="case-header-label">Case ID:</span>
          <span className="case-header-value">{caseData.case_number}</span>
        </div>
        <div className="case-header-field">
          <span className="case-header-label">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm capitalize ${statusColors[caseData.status] || statusColors.open}`}>
            {caseData.status.replace('_', ' ')}
          </span>
        </div>
        <div className="case-header-field">
          <span className="case-header-label">Client:</span>
          <span className="case-header-value">{caseData.client.name}</span>
        </div>
        <div className="case-header-field">
          <span className="case-header-label">Priority:</span>
          <span className={
            caseData.priority === 'high' ? 'case-header-priority-high' :
            caseData.priority === 'medium' ? 'case-header-priority-medium' :
            'case-header-priority-low'
          }>
            {caseData.priority.charAt(0).toUpperCase() + caseData.priority.slice(1)}
          </span>
        </div>
      </div>
      <div className="case-header-stage-info">
        <span className="case-header-label">Current Stage:</span>
        <span className="case-header-stage-value">{caseData.current_stage} - {caseData.stage_name}</span>
        {caseData.attempt_number > 1 && (
          <span className="case-header-attempt-badge">Attempt #{caseData.attempt_number}</span>
        )}
      </div>

      {/* Stage Progress */}
      <div className="case-header-progress">
        {STAGES.map((s, i) => {
          const isStageCurrent = s.num === caseData.current_stage && caseData.status !== 'closed' && caseData.status !== 'cancelled';
          const isStageCompleted = !isStageCurrent && (s.num < caseData.current_stage || (caseData.status === 'closed' && s.num === 5));
          return (
            <div key={s.num} className="case-header-progress-item">
              <div className={`case-header-progress-circle ${
                isStageCompleted ? 'case-header-progress-circle-completed' :
                isStageCurrent ? 'case-header-progress-circle-current' :
                'case-header-progress-circle-default'
              }`}>
                {isStageCompleted ? <Check className="case-header-check-icon" /> : s.num}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`case-header-progress-connector ${isStageCompleted ? 'case-header-progress-connector-completed' : 'case-header-progress-connector-default'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


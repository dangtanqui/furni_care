import { memo } from 'react';
import type { CaseDetail } from '../../../../api/cases';

interface ClientFeedbackSectionProps {
  form: {
    final_feedback: string;
    final_rating: number;
  };
  setForm: (updates: Partial<{ final_feedback: string; final_rating: number }>) => void;
  editable: boolean;
  caseData: CaseDetail;
}

/**
 * Component for client feedback section (rating and feedback)
 */
function ClientFeedbackSection({ form, setForm, editable, caseData }: ClientFeedbackSectionProps) {
  return (
    <div className="stage5-feedback-section">
      <h4 className="stage5-feedback-title">Client Feedback</h4>
      <div className="space-y-3">
        <div>
          <label className="stage5-rating-label" id="stage5-rating-label">Rating</label>
          {editable ? (
            <div className="stage5-rating-container" role="group" aria-labelledby="stage5-rating-label">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setForm({ final_rating: n })}
                  className={`stage5-rating-button ${form.final_rating >= n ? 'stage5-rating-button-active' : 'stage5-rating-button-inactive'}`}
                  aria-label={`Rate ${n} out of 5`}
                  aria-pressed={form.final_rating >= n}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <p>{caseData.final_rating ? `${caseData.final_rating}/5` : '-'}</p>
          )}
        </div>
        <div>
          <label htmlFor="final_feedback" className="stage5-label">Feedback</label>
          {editable ? (
            <textarea
              id="final_feedback"
              name="final_feedback"
              value={form.final_feedback}
              onChange={e => setForm({ final_feedback: e.target.value })}
              className="stage5-feedback-textarea"
              autoComplete="off"
            />
          ) : (
            <p>{caseData.final_feedback || '-'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ClientFeedbackSection);


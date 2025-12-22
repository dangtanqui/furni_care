import { useState, useEffect } from 'react';
import Button from '../../../Button';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import '../../../../styles/components/pages/case_details/stages/Stage5Content.css';

interface Stage5ContentProps {
  canEdit: boolean;
}

export default function Stage5Content({ canEdit }: Stage5ContentProps) {
  const { caseData, isCS, handleUpdate, handleRedo } = useCaseDetailsContext();
  
  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;
  
  const [form, setForm] = useState({
    cs_notes: nonNullCaseData.cs_notes || '',
    final_feedback: nonNullCaseData.final_feedback || '',
    final_rating: nonNullCaseData.final_rating || 5,
  });

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      cs_notes: nonNullCaseData.cs_notes || '',
      final_feedback: nonNullCaseData.final_feedback || '',
      final_rating: nonNullCaseData.final_rating || 5,
    });
  }, [nonNullCaseData.id, nonNullCaseData.cs_notes, nonNullCaseData.final_feedback, nonNullCaseData.final_rating]);

  const handleClose = async () => {
    try {
      await handleUpdate({ ...form, status: 'closed' });
    } catch (error) {
      alert('Failed to close case. Please try again.');
    }
  };

  return (
    <div className="stage5-container">
      <div>
        <label htmlFor="cs_notes" className="stage5-label">Note</label>
        {canEdit ? (
          <textarea
            id="cs_notes"
            name="cs_notes"
            value={form.cs_notes}
            onChange={e => setForm({ ...form, cs_notes: e.target.value })}
            className="stage5-textarea"
          />
        ) : (
          <p className="stage5-readonly-content">{nonNullCaseData.cs_notes || '-'}</p>
        )}
      </div>

      <div className="stage5-feedback-section">
        <h4 className="stage5-feedback-title">Client Feedback</h4>
        <div className="space-y-3">
          <div>
            <label className="stage5-rating-label">Rating</label>
            {canEdit ? (
              <div className="stage5-rating-container">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, final_rating: n })}
                    className={`stage5-rating-button ${form.final_rating >= n ? 'stage5-rating-button-active' : 'stage5-rating-button-inactive'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : (
              <p>{nonNullCaseData.final_rating ? `${nonNullCaseData.final_rating}/5` : '-'}</p>
            )}
          </div>
          <div>
            <label htmlFor="final_feedback" className="stage5-label">Feedback</label>
            {canEdit ? (
              <textarea
                id="final_feedback"
                name="final_feedback"
                value={form.final_feedback}
                onChange={e => setForm({ ...form, final_feedback: e.target.value })}
                className="stage5-feedback-textarea"
              />
            ) : (
              <p>{nonNullCaseData.final_feedback || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {canEdit && nonNullCaseData.status !== 'closed' && nonNullCaseData.status !== 'cancelled' && (
        <div className="stage5-actions">
          <Button onClick={handleClose} variant="primary" alwaysAutoWidth>
            Complete
          </Button>
          <Button onClick={handleRedo} variant="secondary" alwaysAutoWidth>
            Redo → Back to Stage 3
          </Button>
        </div>
      )}

      {!canEdit && nonNullCaseData.current_stage === 5 && !isCS && nonNullCaseData.status !== 'closed' && nonNullCaseData.status !== 'cancelled' && (
        <div className="stage5-waiting-message">
          <p>⏳ Waiting for CS to complete closing</p>
        </div>
      )}
    </div>
  );
}


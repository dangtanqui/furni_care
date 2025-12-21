import { useState, useEffect } from 'react';
import type { Stage5Props } from '../../../../types/components/pages/CaseDetails';
import Button from '../../../../fields/Button';
import '../../../../styles/components/pages/case_details/stages/Stage5Content.css';

export default function Stage5Content({ caseData, canEdit, isCS, onUpdate, onRedo }: Stage5Props) {
  const [form, setForm] = useState({
    cs_notes: caseData.cs_notes || '',
    final_feedback: caseData.final_feedback || '',
    final_rating: caseData.final_rating || 5,
  });

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      cs_notes: caseData.cs_notes || '',
      final_feedback: caseData.final_feedback || '',
      final_rating: caseData.final_rating || 5,
    });
  }, [caseData.id, caseData.cs_notes, caseData.final_feedback, caseData.final_rating]);

  const handleClose = async () => {
    try {
      await onUpdate({ ...form, status: 'closed' });
    } catch (error) {
      console.error('Failed to close case:', error);
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
          <p className="stage5-readonly-content">{caseData.cs_notes || '-'}</p>
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
              <p>{caseData.final_rating ? `${caseData.final_rating}/5` : '-'}</p>
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
              <p>{caseData.final_feedback || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {canEdit && caseData.status !== 'closed' && caseData.status !== 'cancelled' && (
        <div className="stage5-actions">
          <Button onClick={handleClose} variant="primary" alwaysAutoWidth>
            Complete
          </Button>
          <Button onClick={onRedo} variant="secondary" alwaysAutoWidth>
            Redo → Back to Stage 3
          </Button>
        </div>
      )}

      {!canEdit && caseData.current_stage === 5 && !isCS && caseData.status !== 'closed' && caseData.status !== 'cancelled' && (
        <div className="stage5-waiting-message">
          <p>⏳ Waiting for CS to complete closing</p>
        </div>
      )}
    </div>
  );
}


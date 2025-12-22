import { useState, useEffect } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import Button from '../../../Button';
import FinalCostSection from './FinalCostSection';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { TIMING } from '../../../../constants/timing';
import '../../../../styles/components/pages/case_details/stages/Stage5Content.css';

interface Stage5ContentProps {
  canEdit: boolean;
  onCloseAccordion: () => void;
}

export default function Stage5Content({ canEdit, onCloseAccordion }: Stage5ContentProps) {
  const { caseData, isCS, isLeader, isTechnician, handleUpdate, handleRedo, handleApproveFinalCost, handleRejectFinalCost } = useCaseDetailsContext();
  
  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;

  // Fallback logic: Allow CS to edit when final cost is rejected or pending approval
  const canEditStage5Fallback = isCS && 
    nonNullCaseData.current_stage >= 5 && 
    (
      (nonNullCaseData.status === 'rejected' && nonNullCaseData.final_cost_status === 'rejected') ||
      (nonNullCaseData.status === 'pending' && nonNullCaseData.final_cost_status === 'pending')
    );
  // Allow editing if canEdit OR canEditStage5Fallback (fallback for CS when final cost rejected or pending)
  const editable = canEdit || canEditStage5Fallback;

  const [form, setForm] = useState({
    cs_notes: nonNullCaseData.cs_notes || '',
    final_feedback: nonNullCaseData.final_feedback || '',
    final_rating: nonNullCaseData.final_rating || 5,
    final_cost: nonNullCaseData.final_cost ? String(nonNullCaseData.final_cost) : '',
  });

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      cs_notes: nonNullCaseData.cs_notes || '',
      final_feedback: nonNullCaseData.final_feedback || '',
      final_rating: nonNullCaseData.final_rating || 5,
      final_cost: nonNullCaseData.final_cost ? String(nonNullCaseData.final_cost) : '',
    });
  }, [nonNullCaseData.id, nonNullCaseData.cs_notes, nonNullCaseData.final_feedback, nonNullCaseData.final_rating, nonNullCaseData.final_cost]);

  const handleClose = async () => {
    try {
      const updateData: any = { ...form, status: 'closed' };
      
      // If final_cost is in form, include it in the update
      // If final_cost = estimated_cost, backend will auto-approve (no approval needed)
      if (form.final_cost) {
        updateData.final_cost = Number(form.final_cost);
      }
      
      await handleUpdate(updateData);
      setTimeout(() => {
        onCloseAccordion();
      }, TIMING.ACCORDION_CLOSE_DELAY);
    } catch (error) {
      alert('Failed to close case. Please try again.');
    }
  };

  // Check if final cost section should be shown (if cost was approved in Stage 3)
  const showFinalCostSection = nonNullCaseData.cost_required && nonNullCaseData.cost_status === 'approved';
  
  // Check if final_cost is required but not entered yet
  // Check both form state (what user is typing) and saved data (what's in database)
  // Allow 0 as a valid value (price can be 0)
  const finalCostRequired = showFinalCostSection;
  const hasFinalCostInForm = form.final_cost !== '' && form.final_cost !== null && !isNaN(Number(form.final_cost));
  const hasFinalCostInData = nonNullCaseData.final_cost !== null && nonNullCaseData.final_cost !== undefined;
  const finalCostMissing = finalCostRequired && !hasFinalCostInForm && !hasFinalCostInData;
  
  // Check if final_cost differs from estimated_cost (if same, no approval needed)
  // Check both form state and saved data
  // Use Math.abs to handle floating point comparison (e.g., 7.0 vs 7)
  const formFinalCost = form.final_cost ? Number(form.final_cost) : null;
  const savedFinalCost = nonNullCaseData.final_cost;
  const estimatedCost = nonNullCaseData.estimated_cost;
  
  // Helper function to compare costs (handles floating point precision)
  const costsEqual = (cost1: number | null, cost2: number | null): boolean => {
    if (cost1 === null || cost2 === null) return false;
    return Math.abs(cost1 - cost2) < 0.01; // Allow small tolerance for floating point
  };
  
  // Check if final cost in form differs from estimated
  const formFinalCostDiffers = Boolean(
    formFinalCost !== null && 
    estimatedCost !== null && 
    !costsEqual(formFinalCost, estimatedCost)
  );
  
  // Check if saved final cost differs from estimated
  const savedFinalCostDiffers = Boolean(
    savedFinalCost !== null && 
    estimatedCost !== null && 
    !costsEqual(savedFinalCost, estimatedCost)
  );
  
  // Check if final_cost in form equals estimated_cost (can complete directly, no approval needed)
  const formFinalCostEqualsEstimated = Boolean(
    formFinalCost !== null && 
    estimatedCost !== null && 
    costsEqual(formFinalCost, estimatedCost)
  );
  
  // Final cost needs approval if:
  // 1. Status is 'pending' or 'rejected' in database, OR
  // 2. Final cost (in form or saved) differs from estimated AND no approval yet
  // Note: If final_cost in form = estimated_cost, no approval needed - can complete directly
  const finalCostPendingApproval = Boolean(
    showFinalCostSection && 
    !finalCostMissing &&
    // If formFinalCost equals estimated, no approval needed (even if previously pending)
    !formFinalCostEqualsEstimated &&
    (
      nonNullCaseData.final_cost_status === 'pending' || 
      nonNullCaseData.final_cost_status === 'rejected' ||
      (savedFinalCostDiffers && !nonNullCaseData.final_cost_status && !nonNullCaseData.final_cost_approved_by) ||
      (formFinalCostDiffers && !savedFinalCost && !nonNullCaseData.final_cost_status && !nonNullCaseData.final_cost_approved_by)
    )
  );
  
  // Show Save/Update button only if:
  // - Final cost in form differs from estimated (needs to save/update and get approval)
  // - Final cost has not been approved yet
  // Don't show Save if final_cost in form equals estimated (can complete directly, even if previously pending)
  const showSaveButton = Boolean(
    showFinalCostSection && 
    !formFinalCostEqualsEstimated && // Don't show Save if form cost equals estimated
    formFinalCostDiffers && // Show Save if form cost differs from estimated (regardless of saved state)
    nonNullCaseData.final_cost_status !== 'approved' // Don't show Save if already approved
  );

  return (
    <div className="stage5-container">
      <div>
        <label htmlFor="cs_notes" className="stage5-label">Note</label>
        {editable ? (
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

      {/* Final Cost Section - Show if cost_required is true */}
      {showFinalCostSection && (
        <FinalCostSection
          form={form}
          setForm={setForm}
          editable={editable}
          canEdit={canEdit}
        />
      )}

      <div className="stage5-feedback-section">
        <h4 className="stage5-feedback-title">Client Feedback</h4>
        <div className="space-y-3">
          <div>
            <label className="stage5-rating-label">Rating</label>
            {editable ? (
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
            {editable ? (
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

      {/* Leader approve/reject buttons for final cost - similar to Stage 3 */}
      {showFinalCostSection && (() => {
        const finalCostStatus = nonNullCaseData.final_cost_status;
        const finalCostDiffers = savedFinalCost !== null && 
          estimatedCost !== null && 
          Math.abs(savedFinalCost - estimatedCost) >= 0.01;
        
        // Leader can approve/reject when:
        // - final_cost is set (including 0) and differs from estimated, AND
        // - final_cost_status is 'pending' or null (not yet approved/rejected), AND
        // - case is not closed/cancelled
        return isLeader && 
          savedFinalCost !== null && 
          finalCostDiffers &&
          finalCostStatus !== 'approved' &&
          finalCostStatus !== 'rejected' &&
          nonNullCaseData.status !== 'closed' && 
          nonNullCaseData.status !== 'cancelled';
      })() && (
        <div className="stage5-final-cost-actions">
          <div className="stage5-final-cost-approve-reject-buttons">
            <Button 
              onClick={async () => {
                await handleApproveFinalCost();
                setTimeout(() => {
                  onCloseAccordion();
                }, TIMING.ACCORDION_CLOSE_DELAY);
              }} 
              variant="primary" 
              leftIcon={<Check />} 
              alwaysAutoWidth
            >
              Approve
            </Button>
            <Button 
              onClick={async () => {
                await handleRejectFinalCost();
                setTimeout(() => {
                  onCloseAccordion();
                }, TIMING.ACCORDION_CLOSE_DELAY);
              }} 
              variant="secondary" 
              leftIcon={<X />} 
              alwaysAutoWidth
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      {editable && nonNullCaseData.status !== 'closed' && nonNullCaseData.status !== 'cancelled' && (
        <>
          <div className="stage5-actions">
            {showSaveButton && showFinalCostSection ? (
              <Button 
                onClick={async () => {
                  const updateData: any = { ...form };
                  if (form.final_cost !== '') {
                    updateData.final_cost = Number(form.final_cost);
                  }
                  await handleUpdate(updateData);
                  setTimeout(() => {
                    onCloseAccordion();
                  }, TIMING.ACCORDION_CLOSE_DELAY);
                }} 
                variant="primary" 
                alwaysAutoWidth
              >
                {savedFinalCost !== null ? 'Update' : 'Save'}
              </Button>
            ) : (
              <Button 
                onClick={handleClose} 
                variant="primary" 
                alwaysAutoWidth
                disabled={Boolean(finalCostMissing || finalCostPendingApproval)}
              >
                Complete
              </Button>
            )}
            <Button onClick={handleRedo} variant="secondary" alwaysAutoWidth>
              Redo → Back to Stage 3
            </Button>
          </div>
          {showSaveButton && showFinalCostSection && (
            <p className="button-message button-message-warning">
              <AlertCircle className="inline w-4 h-4 mr-1" /> 
              {(nonNullCaseData.final_cost_status === 'rejected' && nonNullCaseData.status === 'rejected')
                ? 'Was rejected. Please update and resubmit.'
                : 'Save first, then wait for Leader approval'
              }
            </p>
          )}
        </>
      )}

      {!canEdit && nonNullCaseData.current_stage === 5 && nonNullCaseData.status !== 'closed' && nonNullCaseData.status !== 'cancelled' && (() => {
        // Determine what to show based on role and status
        const isFinalCostRejected = nonNullCaseData.final_cost_status === 'rejected';
        
        if (isLeader) {
          // Leader sees:
          // - If final cost is rejected: show message that CS needs to update
          // - If final cost is pending approval: can approve (no message, buttons show above)
          // - If final cost is missing: waiting for CS to enter
          // - Otherwise: waiting for CS to complete
          if (isFinalCostRejected && showFinalCostSection) {
            return true; // Show message: waiting for CS to update
          }
          if (finalCostMissing) {
            return true; // Show message: waiting for CS to enter final cost
          }
          if (finalCostPendingApproval) {
            return false; // Don't show message, buttons are shown above
          }
          return true; // Show message: waiting for CS to complete
        } else if (isTechnician) {
          // Technician sees:
          // - If final cost is pending/rejected: waiting for Leader approval or CS update
          // - If final cost is missing: waiting for CS to enter
          // - Otherwise: waiting for CS to complete
          if (finalCostMissing) {
            return true; // Show message: waiting for CS to enter final cost
          }
          if (finalCostPendingApproval) {
            return true; // Show message: waiting for approval/update
          }
          return true; // Show message: waiting for CS to complete
        } else if (isCS) {
          // CS (not editing) sees:
          // - If final cost is pending: waiting for Leader to approve
          // - If final cost is rejected: CS should be editing (canEdit should be true), don't show message
          // - Otherwise: should be editing (shouldn't see message)
          // Only show message if CS cannot edit (e.g., waiting for Leader approval on pending cost)
          if (!canEdit && finalCostPendingApproval && nonNullCaseData.final_cost_status !== 'rejected') {
            return true; // Show message: waiting for Leader approval (only if CS cannot edit)
          }
          return false; // CS should be editing or can edit, don't show message
        }
        return false;
      })() && (
        <div className="stage5-waiting-message">
          {(() => {
            const isFinalCostRejected = nonNullCaseData.final_cost_status === 'rejected';
            
            if (finalCostMissing) {
              return <p>⏳ Waiting for CS to enter</p>;
            }
            if (isFinalCostRejected && showFinalCostSection) {
              // When final cost is rejected, show message for Leader
              if (isLeader) {
                return <p>⏳ Waiting for CS to update</p>;
              }
              return <p>⏳ Waiting for CS to update</p>;
            }
            if (finalCostPendingApproval) {
              if (isLeader) {
                return null; // Leader has approve buttons, no message needed
              }
              return <p>⏳ Waiting for Leader to approve</p>;
            }
            if (isCS) {
              return null; // CS should be editing, no message
            }
            return <p>⏳ Waiting for CS to complete</p>;
          })()}
        </div>
      )}
    </div>
  );
}


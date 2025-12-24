import { useState, useEffect } from 'react';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';

interface FinalCostSectionProps {
  form: {
    final_cost: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  editable: boolean;
  canEdit: boolean;
}

export default function FinalCostSection({
  form,
  setForm,
  editable,
  canEdit: _canEdit, // Not used currently but kept for interface compatibility
}: FinalCostSectionProps) {
  const { caseData } = useCaseDetailsContext();
  const [finalCostError, setFinalCostError] = useState<string>('');
  const [finalCostTouched, setFinalCostTouched] = useState<boolean>(false);

  if (!caseData) return null;
  
  const nonNullCaseData = caseData;

  // Validate final_cost when cost_required is true and cost_status is approved
  // Only show error if field is empty or invalid (not a number)
  // Allow 0 as a valid value
  useEffect(() => {
    const isRequired = nonNullCaseData.cost_required && nonNullCaseData.cost_status === 'approved';
    if (isRequired && editable) {
      const costValue = form.final_cost.trim();
      const numValue = parseFloat(costValue);
      
      // If field is empty and not touched, don't show error yet
      if (!costValue && !finalCostTouched) {
        setFinalCostError('');
        return;
      }
      
      // Show error only if touched and empty, or if value is not a valid number
      // Allow 0 as valid value
      if (finalCostTouched || costValue) {
        if (!costValue || (costValue !== '0' && isNaN(numValue))) {
          setFinalCostError('is required');
        } else {
          setFinalCostError('');
        }
      }
    } else {
      setFinalCostError('');
    }
  }, [nonNullCaseData.cost_required, nonNullCaseData.cost_status, form.final_cost, editable, finalCostTouched]);

  // Only show if cost was approved in Stage 3
  if (!nonNullCaseData.cost_required || nonNullCaseData.cost_status !== 'approved') {
    return null;
  }

  const finalCostStatus = nonNullCaseData.final_cost_status;
  // Only show 'approved' if there's an actual approval (has final_cost_approved_by)
  const isApproved = finalCostStatus === 'approved' && nonNullCaseData.final_cost_approved_by;
  const isRejected = finalCostStatus === 'rejected';
  const isPendingApproval = finalCostStatus === 'pending';
  // If status is nil and final_cost is set and equals estimated_cost, no approval needed
  const noApprovalNeeded = !finalCostStatus && 
    nonNullCaseData.final_cost && 
    nonNullCaseData.final_cost > 0 && 
    nonNullCaseData.estimated_cost &&
    nonNullCaseData.final_cost === nonNullCaseData.estimated_cost;
  

  return (
    <div className="stage5-final-cost-section">
      <h4 className="stage5-final-cost-title">Final Cost</h4>
      <div className="stage5-final-cost-grid">
        <div className="stage5-final-cost-flex-col">
          <label htmlFor="final_cost" className={`stage5-label ${finalCostError ? 'stage5-label-error' : ''}`}>
            Final Cost {nonNullCaseData.cost_required && nonNullCaseData.cost_status === 'approved' && editable && <span className="text-red-500">*</span>}
          </label>
          {editable ? (
            <>
              <div className="stage5-final-cost-input-with-prefix">
                <span className="stage5-final-cost-prefix">$</span>
                <input
                  id="final_cost"
                  name="final_cost"
                  type="number"
                  value={form.final_cost}
                  onChange={e => setForm({ ...form, final_cost: e.target.value })}
                  onBlur={() => setFinalCostTouched(true)}
                  className={`stage5-final-cost-input ${finalCostError ? 'stage5-input-error' : ''}`}
                  placeholder="0"
                  step="1"
                  min="0"
                  autoComplete="off"
                />
              </div>
              {finalCostError && (
                <p className="stage5-error-message">Final Cost is required</p>
              )}
            </>
          ) : (
            <p className="stage5-final-cost-display">
              ${nonNullCaseData.final_cost?.toLocaleString() || '-'}
            </p>
          )}
        </div>
        <div className="stage5-final-cost-flex-col">
          <label className="stage5-label">Estimated Cost</label>
          <p className="stage5-final-cost-display">
            ${nonNullCaseData.estimated_cost?.toLocaleString() || '-'}
          </p>
        </div>
        <div className="stage5-final-cost-flex-col">
          <label className="stage5-label">Status</label>
          <p className={
            isApproved ? 'stage5-final-cost-status-approved' :
            isRejected ? 'stage5-final-cost-status-rejected' :
            isPendingApproval ? 'stage5-final-cost-status-pending' :
            noApprovalNeeded ? 'stage5-final-cost-status-approved' : // Same as estimated, no approval needed
            'stage5-final-cost-status-pending'
          }>
            {isApproved ? 'Approved' : 
             isRejected ? 'Rejected' : 
             isPendingApproval ? 'Pending' : 
             noApprovalNeeded ? 'No approval needed' : 
             'Pending'}
          </p>
        </div>
      </div>

      {isPendingApproval && editable && isRejected && nonNullCaseData.status === 'rejected' && (
        <p className="stage5-final-cost-message stage5-final-cost-message-warning">
          Was rejected. Please update and resubmit.
        </p>
      )}

    </div>
  );
}

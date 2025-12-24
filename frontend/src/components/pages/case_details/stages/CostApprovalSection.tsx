import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import Button from '../../../Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
import { formatCostStatus } from '../../../../utils/caseHelpers';
import type { CaseAttachmentItem } from '../../../../api/cases';

interface CostApprovalSectionProps {
  form: {
    cost_required: boolean;
    estimated_cost: string;
    cost_description: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  editable: boolean;
  canEdit: boolean;
  costAttachments: CaseAttachmentItem[];
  handleCostFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  shouldValidate?: boolean;
}

export default function CostApprovalSection({
  form,
  setForm,
  editable,
  canEdit,
  costAttachments,
  handleCostFileChange,
  shouldValidate = false,
}: CostApprovalSectionProps) {
  const { caseData, isLeader, handleApproveCost, handleRejectCost, handleAttachmentDelete } = useCaseDetailsContext();
  const [estimatedCostError, setEstimatedCostError] = useState<string>('');

  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;

  // Validate estimated_cost when cost_required is true
  // Must be a number >= 0
  // Only show error when shouldValidate is true (when user clicks Save)
  useEffect(() => {
    if (shouldValidate && form.cost_required && editable) {
      const costValue = form.estimated_cost.trim();
      const numValue = parseFloat(costValue);
      
      // Validate: must be a valid number >= 0
      // Allow 0 as valid value
      if (!costValue || costValue === '' || (costValue !== '0' && isNaN(numValue)) || numValue < 0) {
        setEstimatedCostError('is required');
      } else {
        setEstimatedCostError('');
      }
    } else {
      setEstimatedCostError('');
    }
  }, [form.cost_required, form.estimated_cost, editable, shouldValidate]);

  return (
    <>
      <label htmlFor="cost_required" className="stage3-checklist-item stage3-cost-checkbox-wrapper">
        <input
          id="cost_required"
          name="cost_required"
          type="checkbox"
          checked={form.cost_required}
          onChange={e => setForm({ ...form, cost_required: e.target.checked })}
          disabled={!editable}
          className="stage3-checklist-checkbox"
        />
        <span className="font-medium">Cost Required</span>
      </label>

      {form.cost_required && (
        <div className="stage3-cost-space-y stage3-cost-content">
          <div className="stage3-cost-grid">
            <div className="stage3-cost-flex-col">
              <label htmlFor="estimated_cost" className={`stage3-label ${estimatedCostError ? 'stage3-label-error' : ''}`}>
                Estimated Cost {form.cost_required && editable && <span className="text-red-500">*</span>}
              </label>
              {editable ? (
                <>
                  <div className="stage3-cost-input-with-prefix">
                    <span className="stage3-cost-prefix">$</span>
                    <input
                      id="estimated_cost"
                      name="estimated_cost"
                      type="number"
                      value={form.estimated_cost}
                      onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
                      className={`stage3-cost-input ${estimatedCostError ? 'stage3-input-error' : ''}`}
                      placeholder="0"
                      step="1"
                      min="0"
                      autoComplete="off"
                    />
                  </div>
                  {estimatedCostError && (
                    <p className="stage3-error-message">Estimated Cost is required</p>
                  )}
                </>
              ) : (
                <p className="stage3-cost-display">${nonNullCaseData.estimated_cost?.toLocaleString()}</p>
              )}
            </div>
            <div className="stage3-cost-flex-col">
              <label className="stage3-label">Status</label>
              <p className={
                nonNullCaseData.cost_status === 'approved' ? 'stage3-cost-status-approved' :
                nonNullCaseData.cost_status === 'rejected' ? 'stage3-cost-status-rejected' :
                'stage3-cost-status-pending'
              }>
                {formatCostStatus(nonNullCaseData.cost_status)}
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="cost_description" className="stage3-label">Description</label>
            {editable ? (
              <textarea
                id="cost_description"
                name="cost_description"
                value={form.cost_description}
                onChange={e => setForm({ ...form, cost_description: e.target.value })}
                className="stage3-textarea"
                placeholder="Describe the cost details..."
                autoComplete="off"
              />
            ) : (
              <p>{nonNullCaseData.cost_description || '-'}</p>
            )}
          </div>
          <div>
            {editable ? (
              <FileUpload
                id="cost-attachments"
                name="cost-attachments"
                accept="image/*,.pdf"
                onFileChange={handleCostFileChange}
                label="Attachments"
                uploadText="Click to upload documents"
                disabled={!editable}
              />
            ) : (
              <label className="stage3-label">Attachments</label>
            )}
            <AttachmentGrid attachments={costAttachments} canEdit={canEdit} onDelete={handleAttachmentDelete} />
          </div>

          {isLeader && nonNullCaseData.status === 'pending' && nonNullCaseData.cost_status !== 'approved' && nonNullCaseData.cost_status !== 'rejected' && (
            <div className="stage3-cost-actions">
              <div className="stage3-approve-reject-buttons">
                <Button onClick={handleApproveCost} variant="primary" leftIcon={<Check />} alwaysAutoWidth>
                  Approve
                </Button>
                <Button onClick={handleRejectCost} variant="secondary" leftIcon={<X />} alwaysAutoWidth>
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

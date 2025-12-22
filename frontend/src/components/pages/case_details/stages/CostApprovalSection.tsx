import { Check, X } from 'lucide-react';
import Button from '../../../Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import { useCaseDetailsContext } from '../../../../contexts/CaseDetailsContext';
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
}

export default function CostApprovalSection({
  form,
  setForm,
  editable,
  canEdit,
  costAttachments,
  handleCostFileChange,
}: CostApprovalSectionProps) {
  const { caseData, isLeader, handleApproveCost, handleRejectCost, handleAttachmentDelete } = useCaseDetailsContext();

  if (!caseData) return null;
  
  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;

  return (
    <>
      <label className="stage3-checkbox-label">
        <input
          type="checkbox"
          checked={form.cost_required}
          onChange={e => setForm({ ...form, cost_required: e.target.checked })}
          disabled={!editable}
        />
        <span className="font-medium">Cost Required</span>
      </label>

      {form.cost_required && (
        <div className="stage3-cost-space-y">
          <div className="stage3-cost-grid">
            <div className="stage3-cost-flex-col">
              <label htmlFor="estimated_cost" className="stage3-label">Estimated Cost</label>
              {editable ? (
                <div className="stage3-cost-input-with-prefix">
                  <span className="stage3-cost-prefix">$</span>
                  <input
                    id="estimated_cost"
                    name="estimated_cost"
                    type="number"
                    value={form.estimated_cost}
                    onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
                    className="stage3-cost-input"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <p className="stage3-cost-display">${nonNullCaseData.estimated_cost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              )}
            </div>
            <div className="stage3-cost-flex-col">
              <label className="stage3-label">Cost Status</label>
              <p className={
                nonNullCaseData.cost_status === 'approved' ? 'stage3-cost-status-approved' :
                nonNullCaseData.cost_status === 'rejected' ? 'stage3-cost-status-rejected' :
                'stage3-cost-status-pending'
              }>
                {nonNullCaseData.cost_status || 'Pending'}
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="cost_description" className="stage3-label">Cost Description</label>
            {editable ? (
              <input
                id="cost_description"
                name="cost_description"
                type="text"
                value={form.cost_description}
                onChange={e => setForm({ ...form, cost_description: e.target.value })}
                className="stage3-input"
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
                label="Cost Attachments"
                uploadText="Click to upload cost documents"
                disabled={!editable}
              />
            ) : (
              <label className="stage3-label">Cost Attachments</label>
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

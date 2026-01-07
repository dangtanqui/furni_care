import { memo } from 'react';
import type { CaseDetail } from '../../../../api/cases';

interface SolutionFormFieldsProps {
  form: {
    root_cause: string;
    solution_description: string;
    planned_execution_date: string;
  };
  setForm: (updates: Partial<{ root_cause: string; solution_description: string; planned_execution_date: string }>) => void;
  editable: boolean;
  caseData: CaseDetail;
}

/**
 * Component for root cause, solution description, and planned execution date fields
 */
function SolutionFormFields({ form, setForm, editable, caseData }: SolutionFormFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="root_cause" className="stage3-label">Root Cause</label>
        {editable ? (
          <input
            id="root_cause"
            name="root_cause"
            type="text"
            value={form.root_cause}
            onChange={e => setForm({ root_cause: e.target.value })}
            className="stage3-input"
            autoComplete="off"
          />
        ) : (
          <p className="stage3-readonly-content">{caseData.root_cause || '-'}</p>
        )}
      </div>

      <div>
        <label htmlFor="solution_description" className="stage3-label">Solution Description</label>
        {editable ? (
          <textarea
            id="solution_description"
            name="solution_description"
            value={form.solution_description}
            onChange={e => setForm({ solution_description: e.target.value })}
            className="stage3-textarea"
            autoComplete="off"
          />
        ) : (
          <p className="stage3-readonly-content">{caseData.solution_description || '-'}</p>
        )}
      </div>

      <div>
        <label htmlFor="planned_execution_date" className="stage3-label">Planned Execution Date</label>
        {editable ? (
          <input
            id="planned_execution_date"
            name="planned_execution_date"
            type="date"
            value={form.planned_execution_date}
            onChange={e => setForm({ planned_execution_date: e.target.value })}
            className="stage3-input"
          />
        ) : (
          <p>{caseData.planned_execution_date || '-'}</p>
        )}
      </div>
    </>
  );
}

export default memo(SolutionFormFields);

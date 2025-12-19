import Select from '../../Select';
import FileUpload from '../../FileUpload';
import Button from '../../../fields/Button';
import '../../../styles/components/pages/create_case/CaseForm.css';
import type { CaseFormProps } from '../../../types/components/pages/CreateCase';

export default function CaseForm({ form, clients, sites, contacts, previews, onFormChange, onFileChange, onSubmit }: CaseFormProps) {
  return (
    <form onSubmit={onSubmit} className="case-form">
      <div>
        <label htmlFor="client_id" className="case-form-label">Client *</label>
        <Select
          id="client_id"
          name="client_id"
          value={form.client_id}
          onChange={(value) => onFormChange({ ...form, client_id: value })}
          options={[
            { value: '', label: 'Select client...' },
            ...clients.map(c => ({ value: String(c.id), label: c.name })),
          ]}
        />
      </div>

      <div>
        <label htmlFor="site_id" className="case-form-label">Site *</label>
        <Select
          id="site_id"
          name="site_id"
          value={form.site_id}
          onChange={(value) => onFormChange({ ...form, site_id: value })}
          options={[
            { value: '', label: 'Select site...' },
            ...sites.map(s => ({ value: String(s.id), label: `${s.name} - ${s.city}` })),
          ]}
          disabled={!form.client_id}
        />
      </div>

      <div>
        <label htmlFor="contact_id" className="case-form-label">Contact Person *</label>
        <Select
          id="contact_id"
          name="contact_id"
          value={form.contact_id}
          onChange={(value) => onFormChange({ ...form, contact_id: value })}
          options={[
            { value: '', label: 'Select contact...' },
            ...contacts.map(c => ({ value: String(c.id), label: `${c.name} - ${c.phone}` })),
          ]}
          disabled={!form.site_id}
        />
      </div>

      <div>
        <label htmlFor="description" className="case-form-label">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={e => onFormChange({ ...form, description: e.target.value })}
          className="case-form-textarea"
          placeholder="Describe the issue..."
        />
      </div>

      <FileUpload previews={previews} onFileChange={onFileChange} showPreview={true} />

      <div className="case-form-grid">
        <div>
          <label htmlFor="case_type" className="case-form-label">Case Type</label>
          <Select
            id="case_type"
            name="case_type"
            value={form.case_type}
            onChange={(value) => onFormChange({ ...form, case_type: value })}
            options={[
              { value: 'warranty', label: 'Warranty' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'repair', label: 'Repair' },
            ]}
          />
        </div>
        <div>
          <label htmlFor="priority" className="case-form-label">Priority</label>
          <Select
            id="priority"
            name="priority"
            value={form.priority}
            onChange={(value) => onFormChange({ ...form, priority: value })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
        </div>
      </div>

      <Button type="submit" variant="primary">Submit Case</Button>
    </form>
  );
}


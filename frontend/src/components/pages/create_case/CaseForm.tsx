import Select from '../../Select';
import FileUpload from '../../FileUpload';
import Button from '../../Button';
import '../../../styles/components/pages/create_case/CaseForm.css';
import type { CaseFormProps } from '../../../types/components/pages/CreateCase';

export default function CaseForm({ form, clients, sites, contacts, previews, onFormChange, onFileChange, onDeletePreview, onSubmit, errors, onClearFieldError }: CaseFormProps) {
  const getFieldError = (keys: string[]) => {
    const key = keys.find(k => !!errors?.[k]);
    return key ? errors?.[key] : null;
  };

  const hasError = (keys: string[]) => {
    return keys.some(k => !!errors?.[k]);
  };

  return (
    <form onSubmit={onSubmit} className="case-form">
      <div>
        <label htmlFor="client_id" className={`case-form-label ${hasError(['client', 'client_id']) ? 'case-form-label-error' : ''}`}>Client *</label>
        <Select
          id="client_id"
          name="client_id"
          value={form.client_id}
          onChange={(value) => onFormChange({ ...form, client_id: value })}
          options={clients.map(c => ({ value: String(c.id), label: c.name }))}
          placeholder="Select Client"
          error={hasError(['client', 'client_id'])}
          onOpen={() => onClearFieldError?.(['client', 'client_id'])}
        />
        {getFieldError(['client', 'client_id']) && (
          <p className="case-form-field-error">
            Client {getFieldError(['client', 'client_id'])}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="site_id" className={`case-form-label ${hasError(['site', 'site_id']) ? 'case-form-label-error' : ''}`}>Site *</label>
        <Select
          id="site_id"
          name="site_id"
          value={form.site_id}
          onChange={(value) => onFormChange({ ...form, site_id: value })}
          options={sites.map(s => ({ value: String(s.id), label: `${s.name} - ${s.city}` }))}
          placeholder="Select Site"
          disabled={!form.client_id}
          error={hasError(['site', 'site_id'])}
          onOpen={() => onClearFieldError?.(['site', 'site_id'])}
        />
        {getFieldError(['site', 'site_id']) && (
          <p className="case-form-field-error">
            Site {getFieldError(['site', 'site_id'])}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact_id" className={`case-form-label ${hasError(['contact', 'contact_id']) ? 'case-form-label-error' : ''}`}>Contact Person *</label>
        <Select
          id="contact_id"
          name="contact_id"
          value={form.contact_id}
          onChange={(value) => onFormChange({ ...form, contact_id: value })}
          options={contacts.map(c => ({ value: String(c.id), label: `${c.name} - ${c.phone}` }))}
          placeholder="Select Contact Person"
          disabled={!form.site_id}
          error={hasError(['contact', 'contact_id'])}
          onOpen={() => onClearFieldError?.(['contact', 'contact_id'])}
        />
        {getFieldError(['contact', 'contact_id']) && (
          <p className="case-form-field-error">
            Contact Person {getFieldError(['contact', 'contact_id'])}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className={`case-form-label ${hasError(['description']) ? 'case-form-label-error' : ''}`}>Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={e => onFormChange({ ...form, description: e.target.value })}
          className={`case-form-textarea ${hasError(['description']) ? 'case-form-field-error-state' : ''}`}
          placeholder="Describe the issue..."
        />
        {getFieldError(['description']) && (
          <p className="case-form-field-error">
            Description {getFieldError(['description'])}
          </p>
        )}
      </div>

      <FileUpload previews={previews} onFileChange={onFileChange} onDeletePreview={onDeletePreview} showPreview={true} />

      <div className="case-form-grid">
        <div>
          <label htmlFor="case_type" className={`case-form-label ${hasError(['case_type']) ? 'case-form-label-error' : ''}`}>Type *</label>
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
            placeholder="Select Type"
            error={hasError(['case_type'])}
            onOpen={() => onClearFieldError?.(['case_type'])}
          />
          {getFieldError(['case_type']) && (
            <p className="case-form-field-error">
              Type {getFieldError(['case_type'])}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="priority" className={`case-form-label ${hasError(['priority']) ? 'case-form-label-error' : ''}`}>Priority *</label>
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
            placeholder="Select Priority"
            error={hasError(['priority'])}
            onOpen={() => onClearFieldError?.(['priority'])}
          />
          {getFieldError(['priority']) && (
            <p className="case-form-field-error">
              Priority {getFieldError(['priority'])}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" variant="primary">Submit</Button>
    </form>
  );
}


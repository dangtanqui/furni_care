import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaseForm from '../../../../src/components/pages/create_case/CaseForm';
/// <reference types="@testing-library/jest-dom" />

// Mock components
vi.mock('../../../../src/components/Select', () => ({
  default: ({ value, onChange, options, placeholder, disabled, error, onOpen }: any) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      data-testid={`select-${placeholder}`}
      data-error={error}
      onFocus={onOpen}
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../../../../src/components/FileUpload', () => ({
  default: ({ onFileChange, onDeletePreview, previews }: any) => (
    <div>
      <input
        type="file"
        onChange={onFileChange}
        data-testid="file-upload"
      />
      {previews?.map((preview: string, idx: number) => (
        <div key={idx}>
          <img src={preview} alt={`Preview ${idx}`} />
          <button onClick={() => onDeletePreview?.(idx)}>Delete {idx}</button>
        </div>
      ))}
    </div>
  ),
}));

describe('CaseForm', () => {
  const mockOnFormChange = vi.fn();
  const mockOnFileChange = vi.fn();
  const mockOnDeletePreview = vi.fn();
  const mockOnSubmit = vi.fn((e) => e.preventDefault());
  const mockOnClearFieldError = vi.fn();

  const defaultForm = {
    client_id: '',
    site_id: '',
    contact_id: '',
    description: '',
    case_type: '',
    priority: '',
  };

  const mockClients = [
    { id: 1, name: 'Client 1', code: 'C1' },
    { id: 2, name: 'Client 2', code: 'C2' },
  ];

  const mockSites = [
    { id: 1, name: 'Site 1', city: 'City 1' },
    { id: 2, name: 'Site 2', city: 'City 2' },
  ];

  const mockContacts = [
    { id: 1, name: 'Contact 1', phone: '123' },
    { id: 2, name: 'Contact 2', phone: '456' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(
      <CaseForm
        form={defaultForm}
        clients={mockClients}
        sites={mockSites}
        contacts={mockContacts}
        previews={[]}
        onFormChange={mockOnFormChange}
        onFileChange={mockOnFileChange}
        onDeletePreview={mockOnDeletePreview}
        onSubmit={mockOnSubmit}
        errors={{}}
        onClearFieldError={mockOnClearFieldError}
      />
    );

    expect(screen.getByTestId('select-Select Client')).toBeInTheDocument();
    expect(screen.getByTestId('select-Select Site')).toBeInTheDocument();
    expect(screen.getByTestId('select-Select Contact Person')).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByTestId('select-Select Type')).toBeInTheDocument();
    expect(screen.getByTestId('select-Select Priority')).toBeInTheDocument();
  });

  it('should call onFormChange when form fields change', async () => {
    const user = userEvent.setup();
    render(
      <CaseForm
        form={defaultForm}
        clients={mockClients}
        sites={mockSites}
        contacts={mockContacts}
        previews={[]}
        onFormChange={mockOnFormChange}
        onFileChange={mockOnFileChange}
        onDeletePreview={mockOnDeletePreview}
        onSubmit={mockOnSubmit}
        errors={{}}
        onClearFieldError={mockOnClearFieldError}
      />
    );

    const clientSelect = screen.getByTestId('select-Select Client');
    await user.selectOptions(clientSelect, '1');

    expect(mockOnFormChange).toHaveBeenCalledWith({
      ...defaultForm,
      client_id: '1',
    });
  });

  it('should display error messages', () => {
    const errors = {
      client_id: 'is required',
      description: 'is too short',
    };

    render(
      <CaseForm
        form={defaultForm}
        clients={mockClients}
        sites={mockSites}
        contacts={mockContacts}
        previews={[]}
        onFormChange={mockOnFormChange}
        onFileChange={mockOnFileChange}
        onDeletePreview={mockOnDeletePreview}
        onSubmit={mockOnSubmit}
        errors={errors}
        onClearFieldError={mockOnClearFieldError}
      />
    );

    expect(screen.getByText(/Client is required/)).toBeInTheDocument();
    expect(screen.getByText(/Description is too short/)).toBeInTheDocument();
  });

  it('should call onClearFieldError when select is opened', async () => {
    const user = userEvent.setup();
    render(
      <CaseForm
        form={defaultForm}
        clients={mockClients}
        sites={mockSites}
        contacts={mockContacts}
        previews={[]}
        onFormChange={mockOnFormChange}
        onFileChange={mockOnFileChange}
        onDeletePreview={mockOnDeletePreview}
        onSubmit={mockOnSubmit}
        errors={{ client_id: 'is required' }}
        onClearFieldError={mockOnClearFieldError}
      />
    );

    const clientSelect = screen.getByTestId('select-Select Client');
    await user.click(clientSelect);

    expect(mockOnClearFieldError).toHaveBeenCalledWith(['client', 'client_id']);
  });

  it('should call onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    
    // Create a form with all required fields filled
    const filledForm = {
      ...defaultForm,
      client_id: '1',
      site_id: '1',
      contact_id: '1',
      case_type: 'repair',
      priority: 'high',
    };
    
    const { container } = render(
      <CaseForm
        form={filledForm}
        clients={mockClients}
        sites={mockSites}
        contacts={mockContacts}
        previews={[]}
        onFormChange={mockOnFormChange}
        onFileChange={mockOnFileChange}
        onDeletePreview={mockOnDeletePreview}
        onSubmit={mockOnSubmit}
        errors={{}}
        onClearFieldError={mockOnClearFieldError}
      />
    );
    
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    
    // Submit button should be enabled since all required fields are filled
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    expect(submitButton).not.toBeDisabled();
    
    // Click submit button - this should trigger form's onSubmit handler
    await user.click(submitButton);
    
    // The form's onSubmit should be called when submit button is clicked
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should disable form when loading', () => {
    render(
      <CaseForm
        form={defaultForm}
        clients={mockClients}
        sites={mockSites}
        contacts={mockContacts}
        previews={[]}
        onFormChange={mockOnFormChange}
        onFileChange={mockOnFileChange}
        onDeletePreview={mockOnDeletePreview}
        onSubmit={mockOnSubmit}
        errors={{}}
        onClearFieldError={mockOnClearFieldError}
        loading={true}
      />
    );

    const clientSelect = screen.getByTestId('select-Select Client');
    expect(clientSelect).toBeDisabled();
  });

  it('should display file previews', () => {
    const previews = ['preview1.jpg', 'preview2.jpg'];
    render(
      <CaseForm
        form={defaultForm}
        clients={mockClients}
        sites={mockSites}
        contacts={mockContacts}
        previews={previews}
        onFormChange={mockOnFormChange}
        onFileChange={mockOnFileChange}
        onDeletePreview={mockOnDeletePreview}
        onSubmit={mockOnSubmit}
        errors={{}}
        onClearFieldError={mockOnClearFieldError}
      />
    );

    expect(screen.getByAltText('Preview 0')).toBeInTheDocument();
    expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
  });
});


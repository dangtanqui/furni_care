import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreateCase from '../../src/pages/CreateCase';
import { useCreateCase } from '../../src/hooks/pages/useCreateCase';

// Mock dependencies
vi.mock('../../src/hooks/pages/useCreateCase');

const mockUseCreateCase = vi.mocked(useCreateCase);

describe('CreateCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.history.back
    window.history.back = vi.fn();

    mockUseCreateCase.mockReturnValue({
      form: {
        client_id: '',
        site_id: '',
        contact_id: '',
        description: '',
        case_type: '',
        priority: '',
      },
      setForm: vi.fn(),
      clients: [],
      sites: [],
      contacts: [],
      files: [],
      previews: [],
      handleFileChange: vi.fn(),
      handleDeletePreview: vi.fn(),
      handleFormChange: vi.fn(),
      handleSubmit: vi.fn((e) => e.preventDefault()),
      errors: {},
      clearFieldError: vi.fn(),
      loading: false,
    });
  });

  it('should render create case page', () => {
    render(
      <BrowserRouter>
        <CreateCase />
      </BrowserRouter>
    );

    expect(screen.getByText('Create New Case')).toBeInTheDocument();
  });

  it('should render back button', () => {
    render(
      <BrowserRouter>
        <CreateCase />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
  });

  it('should render CaseForm', () => {
    render(
      <BrowserRouter>
        <CreateCase />
      </BrowserRouter>
    );

    // CaseForm should be rendered (tested via its fields)
    // Use getAllByText since "Client" appears in both label and placeholder, then check the label
    const clientElements = screen.getAllByText(/Client/i);
    expect(clientElements.length).toBeGreaterThan(0);
    // Check that at least one is a label
    const clientLabel = clientElements.find(el => el.tagName === 'LABEL');
    expect(clientLabel).toBeInTheDocument();
  });

  it('should call window.history.back when back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <CreateCase />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /Back/i });
    await user.click(backButton);

    expect(window.history.back).toHaveBeenCalled();
  });
});


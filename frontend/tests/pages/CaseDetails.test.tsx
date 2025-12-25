/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CaseDetail from '../../src/pages/CaseDetails';
import { useCaseDetails } from '../../src/hooks/pages/useCaseDetails';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  };
});

vi.mock('../../src/hooks/pages/useCaseDetails');

// Mock child components to avoid rendering issues
vi.mock('../../src/components/pages/case_details/CaseHeader', () => ({
  default: () => <div data-testid="case-header">Case Header</div>,
}));

vi.mock('../../src/components/pages/case_details/StageSection', () => ({
  default: ({ stage }: any) => <div data-testid={`stage-${stage.num}`}>Stage {stage.num}</div>,
}));

const mockUseCaseDetails = vi.mocked(useCaseDetails);

describe('CaseDetails', () => {
  const mockCaseData = {
    id: 1,
    case_number: 'CASE-001',
    current_stage: 1,
    stage_name: 'Stage 1',
    status: 'open' as const,
    attempt_number: 1,
    client: { id: 1, name: 'Test Client' },
    site: { id: 1, name: 'Test Site', city: 'Test City' },
    contact: { id: 1, name: 'Test Contact', phone: '1234567890' },
    created_by: { id: 1, name: 'Test User' },
    assigned_to: { id: 2, name: 'Technician' },
    description: 'Test description',
    case_type: 'repair',
    priority: 'medium' as const,
    investigation_report: '',
    investigation_checklist: '',
    root_cause: '',
    solution_description: '',
    solution_checklist: '',
    planned_execution_date: '',
    cost_required: false,
    estimated_cost: 0,
    cost_description: '',
    cost_status: null as 'pending' | 'approved' | 'rejected' | null,
    execution_report: '',
    execution_checklist: '',
    client_signature: '',
    client_feedback: '',
    client_rating: 0,
    cs_notes: '',
    final_feedback: '',
    final_rating: 0,
    final_cost: null,
    final_cost_status: null as 'pending' | 'approved' | 'rejected' | null,
    final_cost_approved_by: null,
    stage_attachments: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCaseDetails.mockReturnValue({
      caseData: mockCaseData,
      expandedStage: 1,
      setExpandedStage: vi.fn(),
      technicians: [{ id: 2, name: 'Technician' }],
      isCS: true,
      isTechnician: false,
      isLeader: false,
      currentUserId: 1,
      error: null,
      loading: false,
      handleUpdate: vi.fn(),
      handleAttachmentsUpload: vi.fn(),
      handleAttachmentDelete: vi.fn(),
      handleAdvance: vi.fn(),
      handleApproveCost: vi.fn(),
      handleRejectCost: vi.fn(),
      handleApproveFinalCost: vi.fn(),
      handleRejectFinalCost: vi.fn(),
      handleRedo: vi.fn(),
      handleCancelCase: vi.fn(),
      canEditStage: vi.fn(() => true),
    });
  });

  it('should render case details page', async () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/cases/:id" element={<CaseDetail />} />
        </Routes>
      </BrowserRouter>
    );

    // Back button should be rendered (Button component renders as link when 'to' prop is provided)
    await waitFor(() => {
      const backButton = screen.getByText(/Back/i);
      expect(backButton).toBeInTheDocument();
    });
  });

  it('should show loading skeleton when loading', () => {
    mockUseCaseDetails.mockReturnValue({
      caseData: null,
      expandedStage: null,
      setExpandedStage: vi.fn(),
      technicians: [],
      isCS: true,
      isTechnician: false,
      isLeader: false,
      currentUserId: 1,
      error: null,
      loading: true,
      handleUpdate: vi.fn(),
      handleAttachmentsUpload: vi.fn(),
      handleAttachmentDelete: vi.fn(),
      handleAdvance: vi.fn(),
      handleApproveCost: vi.fn(),
      handleRejectCost: vi.fn(),
      handleApproveFinalCost: vi.fn(),
      handleRejectFinalCost: vi.fn(),
      handleRedo: vi.fn(),
      handleCancelCase: vi.fn(),
      canEditStage: vi.fn(() => true),
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/cases/:id" element={<CaseDetail />} />
        </Routes>
      </BrowserRouter>
    );

    // SkeletonLoader should be rendered (check for loading state)
    // The component should show loading state
    expect(screen.queryByText('CASE-001')).not.toBeInTheDocument();
  });

  it('should display error message when error exists', async () => {
    // When caseData exists but error is set, error should be displayed
    mockUseCaseDetails.mockReturnValue({
      caseData: mockCaseData, // Case data exists
      expandedStage: null,
      setExpandedStage: vi.fn(),
      technicians: [],
      isCS: true,
      isTechnician: false,
      isLeader: false,
      currentUserId: 1,
      error: 'Failed to load case',
      loading: false,
      handleUpdate: vi.fn(),
      handleAttachmentsUpload: vi.fn(),
      handleAttachmentDelete: vi.fn(),
      handleAdvance: vi.fn(),
      handleApproveCost: vi.fn(),
      handleRejectCost: vi.fn(),
      handleApproveFinalCost: vi.fn(),
      handleRejectFinalCost: vi.fn(),
      handleRedo: vi.fn(),
      handleCancelCase: vi.fn(),
      canEditStage: vi.fn(() => true),
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/cases/:id" element={<CaseDetail />} />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load case/i)).toBeInTheDocument();
    });
  });

  it('should render back button', async () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/cases/:id" element={<CaseDetail />} />
        </Routes>
      </BrowserRouter>
    );

    // Back button should be rendered (Button component renders as link when 'to' prop is provided)
    await waitFor(() => {
      const backButton = screen.getByText(/Back/i);
      expect(backButton).toBeInTheDocument();
    });
  });
});


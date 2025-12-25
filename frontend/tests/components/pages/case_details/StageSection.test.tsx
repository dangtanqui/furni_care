import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StageSection from '../../../../src/components/pages/case_details/StageSection';
import { CaseDetailsProvider } from '../../../../src/contexts/CaseDetailsContext';
import type { CaseDetailType } from '../../../../src/types/components/pages/CaseDetails';
/// <reference types="@testing-library/jest-dom" />

// Mock stage content components
vi.mock('../../../../src/components/pages/case_details/stages/Stage1Content', () => ({
  default: () => <div>Stage 1 Content</div>,
}));
vi.mock('../../../../src/components/pages/case_details/stages/Stage2Content', () => ({
  default: () => <div>Stage 2 Content</div>,
}));
vi.mock('../../../../src/components/pages/case_details/stages/Stage3Content', () => ({
  default: () => <div>Stage 3 Content</div>,
}));
vi.mock('../../../../src/components/pages/case_details/stages/Stage4Content', () => ({
  default: () => <div>Stage 4 Content</div>,
}));
vi.mock('../../../../src/components/pages/case_details/stages/Stage5Content', () => ({
  default: () => <div>Stage 5 Content</div>,
}));

describe('StageSection', () => {
  const mockCaseData: CaseDetailType = {
    id: 1,
    case_number: 'CASE-001',
    current_stage: 2,
    stage_name: 'Stage 2',
    status: 'in_progress',
    attempt_number: 1,
    client: { id: 1, name: 'Test Client' },
    site: { id: 1, name: 'Test Site', city: 'Test City' },
    contact: { id: 1, name: 'Test Contact', phone: '1234567890' },
    created_by: { id: 1, name: 'Test User' },
    assigned_to: { id: 2, name: 'Technician' },
    description: 'Test description',
    case_type: 'repair',
    priority: 'high',
    investigation_report: '',
    investigation_checklist: '',
    root_cause: '',
    solution_description: '',
    solution_checklist: '',
    planned_execution_date: '',
    cost_required: false,
    estimated_cost: 0,
    cost_description: '',
    cost_status: null,
    execution_report: '',
    execution_checklist: '',
    client_signature: '',
    client_feedback: '',
    client_rating: 0,
    cs_notes: '',
    final_feedback: '',
    final_rating: 0,
    final_cost: null,
    final_cost_status: null,
    final_cost_approved_by: null,
    stage_attachments: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockContextValue = {
    caseData: mockCaseData,
    technicians: [],
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
  };

  const mockOnToggle = vi.fn();
  const mockOnOpenStage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render stage section with title', () => {
    render(
      <CaseDetailsProvider value={mockContextValue}>
        <StageSection
          stage={{ num: 1, name: 'Investigation' }}
          expanded={false}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    expect(screen.getByText('Stage 1 - Investigation')).toBeInTheDocument();
  });

  it('should call onToggle when header is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CaseDetailsProvider value={mockContextValue}>
        <StageSection
          stage={{ num: 1, name: 'Investigation' }}
          expanded={false}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    const header = screen.getByText('Stage 1 - Investigation').closest('.stage-section-header');
    if (header) {
      await user.click(header);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    }
  });

  it('should render stage content when expanded', () => {
    render(
      <CaseDetailsProvider value={mockContextValue}>
        <StageSection
          stage={{ num: 1, name: 'Investigation' }}
          expanded={true}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    expect(screen.getByText('Stage 1 Content')).toBeInTheDocument();
  });

  it('should not render stage content when collapsed', () => {
    const { container } = render(
      <CaseDetailsProvider value={mockContextValue}>
        <StageSection
          stage={{ num: 1, name: 'Investigation' }}
          expanded={false}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    // Content is rendered but hidden with CSS class
    const contentDiv = container.querySelector('.stage-section-content');
    expect(contentDiv).toBeInTheDocument();
    expect(contentDiv).toHaveClass('stage-section-content-hidden');
  });

  it('should mark current stage correctly', () => {
    render(
      <CaseDetailsProvider value={mockContextValue}>
        <StageSection
          stage={{ num: 2, name: 'Solution' }}
          expanded={false}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    // Current stage should have special styling
    const section = screen.getByText('Stage 2 - Solution').closest('.stage-section-card');
    expect(section).toHaveClass('stage-section-card-current');
  });

  it('should mark completed stages correctly', () => {
    render(
      <CaseDetailsProvider value={mockContextValue}>
        <StageSection
          stage={{ num: 1, name: 'Investigation' }}
          expanded={false}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    // Stage 1 is completed (before current stage 2)
    const numberCircle = screen.getByText('Stage 1 - Investigation').closest('.stage-section-header')?.querySelector('.stage-section-number-completed');
    expect(numberCircle).toBeInTheDocument();
  });

  it('should return null when caseData is null', () => {
    const contextWithoutCase = {
      ...mockContextValue,
      caseData: null,
    };

    const { container } = render(
      <CaseDetailsProvider value={contextWithoutCase}>
        <StageSection
          stage={{ num: 1, name: 'Investigation' }}
          expanded={false}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render correct stage content based on stage number', () => {
    const { rerender } = render(
      <CaseDetailsProvider value={mockContextValue}>
        <StageSection
          stage={{ num: 2, name: 'Solution' }}
          expanded={true}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    expect(screen.getByText('Stage 2 Content')).toBeInTheDocument();

    rerender(
      <CaseDetailsProvider value={mockContextValue}>
        <StageSection
          stage={{ num: 3, name: 'Execution' }}
          expanded={true}
          onToggle={mockOnToggle}
          onOpenStage={mockOnOpenStage}
          canEdit={true}
        />
      </CaseDetailsProvider>
    );

    expect(screen.getByText('Stage 3 Content')).toBeInTheDocument();
  });
});


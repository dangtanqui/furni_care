/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CaseHeader from '../../../../src/components/pages/case_details/CaseHeader';
import type { CaseDetailType } from '../../../../src/types/components/pages/CaseDetails';

describe('CaseHeader', () => {
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

  it('should render case header with all fields', () => {
    render(<CaseHeader caseData={mockCaseData} />);

    expect(screen.getByText('CASE-001')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText(/2 - Stage 2/)).toBeInTheDocument();
  });

  it('should display attempt number badge when attempt_number > 1', () => {
    const caseWithAttempt = { ...mockCaseData, attempt_number: 2 };
    render(<CaseHeader caseData={caseWithAttempt} />);

    expect(screen.getByText('Attempt #2')).toBeInTheDocument();
  });

  it('should not display attempt number badge when attempt_number is 1', () => {
    render(<CaseHeader caseData={mockCaseData} />);

    expect(screen.queryByText(/Attempt #/)).not.toBeInTheDocument();
  });

  it('should display status with correct formatting', () => {
    render(<CaseHeader caseData={mockCaseData} />);

    const statusElement = screen.getByRole('status', { name: /Case status:/ });
    expect(statusElement).toBeInTheDocument();
  });

  it('should display priority with correct formatting', () => {
    render(<CaseHeader caseData={mockCaseData} />);

    const priorityElement = screen.getByRole('status', { name: /Case priority:/ });
    expect(priorityElement).toBeInTheDocument();
  });

  it('should show current stage in progress indicator', () => {
    render(<CaseHeader caseData={mockCaseData} />);

    const currentStageIndicator = screen.getByRole('img', { name: /Stage 2 current/ });
    expect(currentStageIndicator).toBeInTheDocument();
  });

  it('should show completed stages with check icon', () => {
    render(<CaseHeader caseData={mockCaseData} />);

    const completedStage = screen.getByRole('img', { name: /Stage 1 completed/ });
    expect(completedStage).toBeInTheDocument();
  });

  it('should show pending stages', () => {
    render(<CaseHeader caseData={mockCaseData} />);

    const pendingStage = screen.getByRole('img', { name: /Stage 3 pending/ });
    expect(pendingStage).toBeInTheDocument();
  });

  it('should mark Stage 5 as completed when case is closed', () => {
    const closedCase = { ...mockCaseData, status: 'closed' as const, current_stage: 5 };
    render(<CaseHeader caseData={closedCase} />);

    const stage5 = screen.getByRole('img', { name: /Stage 5 completed/ });
    expect(stage5).toBeInTheDocument();
  });

  it('should not mark current stage as completed when case is closed', () => {
    const closedCase = { ...mockCaseData, status: 'closed' as const, current_stage: 2 };
    render(<CaseHeader caseData={closedCase} />);

    // When case is closed, current stage should be marked as pending (not current, not completed)
    const stage2 = screen.getByRole('img', { name: /Stage 2 pending/ });
    expect(stage2).toBeInTheDocument();
  });
});


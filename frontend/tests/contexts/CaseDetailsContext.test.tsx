/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { CaseDetailsProvider, useCaseDetailsContext } from '../../src/contexts/CaseDetailsContext';
import type { CaseDetail } from '../../src/api/cases';

describe('CaseDetailsContext', () => {
  const mockCaseData: CaseDetail = {
    id: 1,
    case_number: 'CASE-001',
    current_stage: 1,
    stage_name: 'Stage 1',
    status: 'open',
    attempt_number: 1,
    client: { id: 1, name: 'Test Client' },
    site: { id: 1, name: 'Test Site', city: 'Test City' },
    contact: { id: 1, name: 'Test Contact', phone: '1234567890' },
    created_by: { id: 1, name: 'Test User' },
    assigned_to: { id: 2, name: 'Technician' },
    description: 'Test description',
    case_type: 'repair',
    priority: 'medium',
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
  };

  describe('CaseDetailsProvider', () => {
    it('should provide context value to children', () => {
      const TestComponent = () => {
        const context = useCaseDetailsContext();
        return <div>{context.caseData?.case_number}</div>;
      };

      const { getByText } = render(
        <CaseDetailsProvider value={mockContextValue}>
          <TestComponent />
        </CaseDetailsProvider>
      );

      expect(getByText('CASE-001')).toBeInTheDocument();
    });

    it('should provide all context properties', () => {
      const { result } = renderHook(() => useCaseDetailsContext(), {
        wrapper: ({ children }) => (
          <CaseDetailsProvider value={mockContextValue}>
            {children}
          </CaseDetailsProvider>
        ),
      });

      expect(result.current.caseData).toEqual(mockCaseData);
      expect(result.current.technicians).toEqual([{ id: 2, name: 'Technician' }]);
      expect(result.current.isCS).toBe(true);
      expect(result.current.isTechnician).toBe(false);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.currentUserId).toBe(1);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.handleUpdate).toBeDefined();
      expect(result.current.handleAttachmentsUpload).toBeDefined();
      expect(result.current.handleAttachmentDelete).toBeDefined();
      expect(result.current.handleAdvance).toBeDefined();
      expect(result.current.handleApproveCost).toBeDefined();
      expect(result.current.handleRejectCost).toBeDefined();
      expect(result.current.handleApproveFinalCost).toBeDefined();
      expect(result.current.handleRejectFinalCost).toBeDefined();
      expect(result.current.handleRedo).toBeDefined();
      expect(result.current.handleCancelCase).toBeDefined();
      expect(result.current.canEditStage).toBeDefined();
    });
  });

  describe('useCaseDetailsContext hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useCaseDetailsContext());
      }).toThrow('useCaseDetailsContext must be used within CaseDetailsProvider');

      consoleSpy.mockRestore();
    });

    it('should return context when used within provider', () => {
      const { result } = renderHook(() => useCaseDetailsContext(), {
        wrapper: ({ children }) => (
          <CaseDetailsProvider value={mockContextValue}>
            {children}
          </CaseDetailsProvider>
        ),
      });

      expect(result.current).toBeDefined();
      expect(result.current.caseData).toEqual(mockCaseData);
    });
  });
});


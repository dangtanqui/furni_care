import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCaseDetails } from '../../../src/hooks/pages/useCaseDetails';
import * as casesApi from '../../../src/api/cases';
import { useTechnicians } from '../../../src/hooks/useTechnicians';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useToast } from '../../../src/contexts/ToastContext';
import { canEditStage as checkCanEditStage } from '../../../src/utils/casePermissions';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
}));

vi.mock('../../../src/api/cases');
vi.mock('../../../src/hooks/useTechnicians');
vi.mock('../../../src/contexts/AuthContext');
vi.mock('../../../src/contexts/ToastContext');
vi.mock('../../../src/utils/casePermissions');

const mockGetCase = vi.mocked(casesApi.getCase);
const mockUpdateCase = vi.mocked(casesApi.updateCase);
const mockAdvanceStage = vi.mocked(casesApi.advanceStage);
const mockApproveCost = vi.mocked(casesApi.approveCost);
const mockRejectCost = vi.mocked(casesApi.rejectCost);
const mockApproveFinalCost = vi.mocked(casesApi.approveFinalCost);
const mockRejectFinalCost = vi.mocked(casesApi.rejectFinalCost);
const mockRedoCase = vi.mocked(casesApi.redoCase);
const mockCancelCase = vi.mocked(casesApi.cancelCase);
const mockUploadAttachments = vi.mocked(casesApi.uploadAttachments);
const mockDeleteCaseAttachment = vi.mocked(casesApi.deleteCaseAttachment);
const mockUseTechnicians = vi.mocked(useTechnicians);
const mockUseAuth = vi.mocked(useAuth);
const mockUseToast = vi.mocked(useToast);
const mockCheckCanEditStage = vi.mocked(checkCanEditStage);

describe('useCaseDetails', () => {
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

  const mockShowSuccess = vi.fn();
  const mockShowError = vi.fn();

  beforeEach(() => {
    mockUseTechnicians.mockReturnValue({
      technicians: [{ id: 2, name: 'Technician' }],
      loading: false,
      error: null,
    });

    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      isCS: true,
      isTechnician: false,
      isLeader: false,
    });

    mockUseToast.mockReturnValue({
      showToast: vi.fn(),
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    });

    mockCheckCanEditStage.mockReturnValue(true);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial load', () => {
    it('should load case data on mount', async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.caseData).toEqual(mockCaseData);
      expect(result.current.expandedStage).toBe(1); // Should expand current stage
      expect(mockGetCase).toHaveBeenCalledWith(1);
    });

    it('should set expandedStage to null for closed case', async () => {
      const closedCase = { ...mockCaseData, status: 'closed' as const };
      mockGetCase.mockResolvedValue({
        data: closedCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.expandedStage).toBeNull();
    });

    it('should set expandedStage to 3 for rejected cost', async () => {
      const rejectedCase = {
        ...mockCaseData,
        status: 'rejected' as const,
        cost_status: 'rejected' as const,
        current_stage: 3,
      };
      mockGetCase.mockResolvedValue({
        data: rejectedCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.expandedStage).toBe(3);
    });

    it('should handle loading error', async () => {
      mockGetCase.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useCaseDetails());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load case. Please try again.');
      expect(result.current.caseData).toBeNull();
    });
  });

  describe('handleUpdate', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('should update case successfully', async () => {
      mockUpdateCase.mockResolvedValue({
        data: { ...mockCaseData, description: 'Updated' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: { ...mockCaseData, description: 'Updated' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleUpdate({ description: 'Updated' });

      await waitFor(() => {
        expect(mockUpdateCase).toHaveBeenCalledWith(1, { description: 'Updated' });
        expect(mockShowSuccess).toHaveBeenCalledWith('Case updated successfully');
        expect(result.current.loading).toBe(false);
      });
    });

    it('should not update if case is closed', async () => {
      const closedCase = { ...mockCaseData, status: 'closed' as const };
      mockGetCase.mockResolvedValue({
        data: closedCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleUpdate({ description: 'Updated' });

      expect(mockUpdateCase).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(result.current.error).toBe('Cannot update case: case is already closed or cancelled');
      });
    });

    it('should handle update error', async () => {
      mockUpdateCase.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleUpdate({ description: 'Updated' });

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to update case. Please try again.');
        expect(result.current.error).toBe('Failed to update case. Please try again.');
      });
    });
  });

  describe('handleAttachmentsUpload', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should upload attachments successfully', async () => {
      const files = [new File(['content'], 'test.jpg', { type: 'image/jpeg' })];
      mockUploadAttachments.mockResolvedValue({
        data: { stage: 1, attachments: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleAttachmentsUpload(1, files);

      await waitFor(() => {
        expect(mockUploadAttachments).toHaveBeenCalledWith(1, 1, files, 'stage_1');
        expect(mockShowSuccess).toHaveBeenCalledWith('Attachments uploaded successfully');
      });
    });

    it('should not upload if case is closed', async () => {
      const closedCase = { ...mockCaseData, status: 'closed' as const };
      mockGetCase.mockResolvedValue({
        data: closedCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const files = [new File(['content'], 'test.jpg')];
      await result.current.handleAttachmentsUpload(1, files);

      expect(mockUploadAttachments).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(result.current.error).toBe('Cannot upload attachments: case is already closed or cancelled');
      });
    });

    it('should not upload if no files provided', async () => {
      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleAttachmentsUpload(1, []);

      expect(mockUploadAttachments).not.toHaveBeenCalled();
    });
  });

  describe('handleAttachmentDelete', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should delete attachment successfully', async () => {
      mockDeleteCaseAttachment.mockResolvedValue({
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleAttachmentDelete(1);

      await waitFor(() => {
        expect(mockDeleteCaseAttachment).toHaveBeenCalledWith(1, 1);
        expect(mockShowSuccess).toHaveBeenCalledWith('Attachment deleted successfully');
      });
    });

    it('should not delete if case is closed', async () => {
      const closedCase = { ...mockCaseData, status: 'closed' as const };
      mockGetCase.mockResolvedValue({
        data: closedCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleAttachmentDelete(1);

      expect(mockDeleteCaseAttachment).not.toHaveBeenCalled();
      // Error should be set immediately, check without waiting
      await waitFor(() => {
        expect(result.current.error).toBe('Cannot delete attachment: case is already closed or cancelled');
      });
    });
  });

  describe('handleAdvance', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should advance stage successfully', async () => {
      mockAdvanceStage.mockResolvedValue({
        data: { ...mockCaseData, current_stage: 2 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: { ...mockCaseData, current_stage: 2 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleAdvance();

      await waitFor(() => {
        expect(mockAdvanceStage).toHaveBeenCalledWith(1);
        expect(mockShowSuccess).toHaveBeenCalledWith('Stage advanced successfully');
      });
    });

    it('should not advance if case is closed', async () => {
      const closedCase = { ...mockCaseData, status: 'closed' as const };
      mockGetCase.mockResolvedValue({
        data: closedCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleAdvance();

      expect(mockAdvanceStage).not.toHaveBeenCalled();
      // Error should be set immediately, check without waiting
      await waitFor(() => {
        expect(result.current.error).toBe('Cannot advance stage: case is already closed or cancelled');
      });
    });

    it('should prevent duplicate advance calls', async () => {
      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Start first advance
      const promise1 = result.current.handleAdvance();
      // Try to start second advance immediately
      const promise2 = result.current.handleAdvance();

      await Promise.all([promise1, promise2]);

      // Should only be called once
      expect(mockAdvanceStage).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleApproveCost', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should approve cost successfully', async () => {
      mockApproveCost.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleApproveCost();

      await waitFor(() => {
        expect(mockApproveCost).toHaveBeenCalledWith(1);
        expect(mockShowSuccess).toHaveBeenCalledWith('Cost approved successfully');
      });
    });
  });

  describe('handleRejectCost', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should reject cost successfully', async () => {
      mockRejectCost.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleRejectCost();

      await waitFor(() => {
        expect(mockRejectCost).toHaveBeenCalledWith(1);
        expect(mockShowSuccess).toHaveBeenCalledWith('Cost rejected');
      });
    });
  });

  describe('handleApproveFinalCost', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should approve final cost successfully', async () => {
      mockApproveFinalCost.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleApproveFinalCost();

      await waitFor(() => {
        expect(mockApproveFinalCost).toHaveBeenCalledWith(1);
        expect(mockShowSuccess).toHaveBeenCalledWith('Final cost approved successfully');
      });
    });
  });

  describe('handleRejectFinalCost', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should reject final cost successfully', async () => {
      mockRejectFinalCost.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleRejectFinalCost();

      await waitFor(() => {
        expect(mockRejectFinalCost).toHaveBeenCalledWith(1);
        expect(mockShowSuccess).toHaveBeenCalledWith('Final cost rejected');
      });
    });
  });

  describe('handleRedo', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should redo case successfully', async () => {
      mockRedoCase.mockResolvedValue({
        data: { ...mockCaseData, current_stage: 3 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockGetCase.mockResolvedValue({
        data: { ...mockCaseData, current_stage: 3 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleRedo();

      await waitFor(() => {
        expect(mockRedoCase).toHaveBeenCalledWith(1);
        expect(mockShowSuccess).toHaveBeenCalledWith('Case redone successfully');
      });
    });

    it('should handle redo error with custom message', async () => {
      const error = {
        response: { data: { error: 'Custom error message' } },
      };
      mockRedoCase.mockRejectedValue(error);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.handleRedo();

      await waitFor(() => {
        expect(result.current.error).toBe('Custom error message');
        expect(mockShowError).toHaveBeenCalledWith('Custom error message');
      });
    });
  });

  describe('handleCancelCase', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should cancel case successfully', async () => {
      // First load: case is not cancelled
      mockGetCase.mockResolvedValueOnce({
        data: { ...mockCaseData, status: 'open' as const },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      
      const cancelledCase = { ...mockCaseData, status: 'cancelled' as const };
      mockCancelCase.mockResolvedValue({
        data: cancelledCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      // After cancel, reload case
      mockGetCase.mockResolvedValueOnce({
        data: cancelledCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseDetails());
      
      // Wait for case to be loaded
      await waitFor(() => {
        expect(result.current.caseData).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      // Ensure case is not already cancelled
      expect(result.current.caseData?.status).not.toBe('cancelled');
      expect(result.current.caseData?.status).not.toBe('closed');

      await act(async () => {
        await result.current.handleCancelCase();
      });

      await waitFor(() => {
        expect(mockCancelCase).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(result.current.caseData?.status).toBe('cancelled');
        expect(result.current.expandedStage).toBeNull();
        expect(mockShowSuccess).toHaveBeenCalledWith('Case cancelled successfully');
      });
    });
  });

  describe('canEditStage', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should check edit permissions', async () => {
      mockCheckCanEditStage.mockReturnValue(true);

      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const canEdit = result.current.canEditStage(1);

      expect(canEdit).toBe(true);
      expect(mockCheckCanEditStage).toHaveBeenCalledWith(1, {
        caseData: mockCaseData,
        isCS: true,
        isTechnician: false,
        isLeader: false,
        currentUserId: 1,
      });
    });
  });

  describe('setExpandedStage', () => {
    beforeEach(async () => {
      mockGetCase.mockResolvedValue({
        data: mockCaseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
    });

    it('should update expanded stage', async () => {
      const { result } = renderHook(() => useCaseDetails());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.setExpandedStage(2);
      });

      expect(result.current.expandedStage).toBe(2);
    });
  });
});


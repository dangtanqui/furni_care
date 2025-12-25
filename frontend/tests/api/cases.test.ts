import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCases,
  getCase,
  createCase,
  updateCase,
  advanceStage,
  approveCost,
  rejectCost,
  approveFinalCost,
  rejectFinalCost,
  redoCase,
  cancelCase,
  uploadAttachments,
  deleteCaseAttachment,
} from '../../src/api/cases';

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => {
  return {
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPatch: vi.fn(),
    mockDelete: vi.fn(),
  };
});

vi.mock('../../src/api/client', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

const mockApi = { get: mockGet, post: mockPost, patch: mockPatch, delete: mockDelete };

describe('cases API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCases', () => {
    it('should call api.get with correct endpoint and params', () => {
      const mockResponse = { data: { data: [], pagination: {} } };
      mockApi.get.mockResolvedValue(mockResponse as any);

      getCases({ page: '1', per_page: '20' });

      expect(mockApi.get).toHaveBeenCalledWith('/cases', { params: { page: '1', per_page: '20' } });
    });

    it('should include filters and sort params', () => {
      const mockResponse = { data: { data: [], pagination: {} } };
      mockApi.get.mockResolvedValue(mockResponse as any);

      getCases({
        page: '1',
        per_page: '20',
        status: 'open',
        case_type: 'repair',
        assigned_to: '1',
        sort: '[{"column":"created_at","direction":"desc"}]',
      });

      expect(mockApi.get).toHaveBeenCalledWith('/cases', {
        params: {
          page: '1',
          per_page: '20',
          status: 'open',
          case_type: 'repair',
          assigned_to: '1',
          sort: '[{"column":"created_at","direction":"desc"}]',
        },
      });
    });
  });

  describe('getCase', () => {
    it('should call api.get with correct endpoint', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.get.mockResolvedValue(mockResponse as any);

      getCase(123);

      expect(mockApi.get).toHaveBeenCalledWith('/cases/123');
    });
  });

  describe('createCase', () => {
    it('should call api.post with correct endpoint and data', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      const caseData = {
        client_id: 1,
        site_id: 2,
        contact_id: 3,
        description: 'Test case',
        case_type: 'repair',
        priority: 'high' as const,
      };

      createCase(caseData);

      expect(mockApi.post).toHaveBeenCalledWith('/cases', caseData);
    });
  });

  describe('updateCase', () => {
    it('should call api.patch with correct endpoint and data', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.patch.mockResolvedValue(mockResponse as any);

      const updateData = { description: 'Updated description' };

      updateCase(123, updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/cases/123', updateData);
    });
  });

  describe('advanceStage', () => {
    it('should call api.post with correct endpoint', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      advanceStage(123);

      expect(mockApi.post).toHaveBeenCalledWith('/cases/123/advance_stage');
    });
  });

  describe('approveCost', () => {
    it('should call api.post with correct endpoint', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      approveCost(123);

      expect(mockApi.post).toHaveBeenCalledWith('/cases/123/approve_cost');
    });
  });

  describe('rejectCost', () => {
    it('should call api.post with correct endpoint', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      rejectCost(123);

      expect(mockApi.post).toHaveBeenCalledWith('/cases/123/reject_cost');
    });
  });

  describe('approveFinalCost', () => {
    it('should call api.post with correct endpoint', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      approveFinalCost(123);

      expect(mockApi.post).toHaveBeenCalledWith('/cases/123/approve_final_cost');
    });
  });

  describe('rejectFinalCost', () => {
    it('should call api.post with correct endpoint', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      rejectFinalCost(123);

      expect(mockApi.post).toHaveBeenCalledWith('/cases/123/reject_final_cost');
    });
  });

  describe('redoCase', () => {
    it('should call api.post with correct endpoint', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      redoCase(123);

      expect(mockApi.post).toHaveBeenCalledWith('/cases/123/redo_case');
    });
  });

  describe('cancelCase', () => {
    it('should call api.post with correct endpoint', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      cancelCase(123);

      expect(mockApi.post).toHaveBeenCalledWith('/cases/123/cancel_case');
    });
  });

  describe('uploadAttachments', () => {
    it('should call api.post with FormData', () => {
      const mockResponse = { data: { id: 1 } };
      mockApi.post.mockResolvedValue(mockResponse as any);

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      uploadAttachments(123, 3, [file]);

      expect(mockApi.post).toHaveBeenCalled();
      const callArgs = mockApi.post.mock.calls[0];
      expect(callArgs[0]).toBe('/cases/123/attachments');
      expect(callArgs[1]).toBeInstanceOf(FormData);
      // Verify FormData contains stage
      const formData = callArgs[1] as FormData;
      expect(formData.get('stage')).toBe('3');
    });
  });

  describe('deleteCaseAttachment', () => {
    it('should call api.delete with correct endpoint', () => {
      const mockResponse = { data: {} };
      mockApi.delete.mockResolvedValue(mockResponse as any);

      deleteCaseAttachment(123, 456);

      expect(mockApi.delete).toHaveBeenCalledWith('/cases/123/case_attachments/456');
    });
  });
});


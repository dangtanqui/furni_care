import { describe, it, expect } from 'vitest';
import { canEditStage } from '../../src/utils/casePermissions';
import type { CaseDetail } from '../../src/api/cases';

describe('casePermissions', () => {
  const mockCaseData: CaseDetail = {
    id: 1,
    case_number: 'CASE-001',
    current_stage: 1,
    stage_name: 'Stage 1',
    status: 'open',
    attempt_number: 1,
    client: { id: 1, name: 'Client 1' },
    site: { id: 1, name: 'Site 1', city: 'City 1' },
    contact: { id: 1, name: 'Contact 1', phone: '123' },
    created_by: { id: 1, name: 'User 1' },
    assigned_to: { id: 2, name: 'Tech 1' },
    description: 'Test',
    case_type: 'repair',
    priority: 'medium',
    investigation_report: '',
    investigation_checklist: '',
    root_cause: '',
    solution_description: '',
    cost_required: false,
    estimated_cost: 0,
    cost_status: null,
    cost_description: '',
    solution_checklist: '',
    planned_execution_date: '',
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
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  describe('canEditStage - Stage 1', () => {
    it('should allow CS to edit Stage 1 when case is open', () => {
      const result = canEditStage(1, {
        caseData: { ...mockCaseData, status: 'open' },
        isCS: true,
        isTechnician: false,
        isLeader: false,
      });
      expect(result).toBe(true);
    });

    it('should not allow Technician to edit Stage 1', () => {
      const result = canEditStage(1, {
        caseData: { ...mockCaseData, status: 'open' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 2,
      });
      expect(result).toBe(false);
    });

    it('should not allow editing when case is closed', () => {
      const result = canEditStage(1, {
        caseData: { ...mockCaseData, status: 'closed' },
        isCS: true,
        isTechnician: false,
        isLeader: false,
      });
      expect(result).toBe(false);
    });

    it('should not allow editing when case is cancelled', () => {
      const result = canEditStage(1, {
        caseData: { ...mockCaseData, status: 'cancelled' },
        isCS: true,
        isTechnician: false,
        isLeader: false,
      });
      expect(result).toBe(false);
    });

    it('should allow CS to edit when cost is rejected', () => {
      const result = canEditStage(1, {
        caseData: {
          ...mockCaseData,
          status: 'rejected',
          cost_status: 'rejected',
        },
        isCS: true,
        isTechnician: false,
        isLeader: false,
      });
      expect(result).toBe(true);
    });
  });

  describe('canEditStage - Stage 2', () => {
    it('should allow assigned technician to edit Stage 2', () => {
      const result = canEditStage(2, {
        caseData: { ...mockCaseData, current_stage: 2, status: 'in_progress' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 2,
      });
      expect(result).toBe(true);
    });

    it('should not allow non-assigned technician to edit Stage 2', () => {
      const result = canEditStage(2, {
        caseData: { ...mockCaseData, current_stage: 2, status: 'in_progress' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 3,
      });
      expect(result).toBe(false);
    });

    it('should not allow editing when stage is less than 2', () => {
      const result = canEditStage(2, {
        caseData: { ...mockCaseData, current_stage: 1, status: 'in_progress' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 2,
      });
      expect(result).toBe(false);
    });
  });

  describe('canEditStage - Stage 3', () => {
    it('should allow assigned technician to edit Stage 3', () => {
      const result = canEditStage(3, {
        caseData: { ...mockCaseData, current_stage: 3, status: 'in_progress' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 2,
      });
      expect(result).toBe(true);
    });

    it('should allow assigned technician to edit when cost is rejected', () => {
      const result = canEditStage(3, {
        caseData: {
          ...mockCaseData,
          current_stage: 3,
          status: 'rejected',
          cost_status: 'rejected',
        },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 2,
      });
      expect(result).toBe(true);
    });

    it('should not allow non-assigned technician to edit Stage 3', () => {
      const result = canEditStage(3, {
        caseData: { ...mockCaseData, current_stage: 3, status: 'in_progress' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 3,
      });
      expect(result).toBe(false);
    });
  });

  describe('canEditStage - Stage 4', () => {
    it('should allow assigned technician to edit Stage 4', () => {
      const result = canEditStage(4, {
        caseData: { ...mockCaseData, current_stage: 4, status: 'in_progress' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 2,
      });
      expect(result).toBe(true);
    });

    it('should not allow editing when stage is less than 4', () => {
      const result = canEditStage(4, {
        caseData: { ...mockCaseData, current_stage: 3, status: 'in_progress' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 2,
      });
      expect(result).toBe(false);
    });
  });

  describe('canEditStage - Stage 5', () => {
    it('should allow CS to edit Stage 5 when status is completed', () => {
      const result = canEditStage(5, {
        caseData: { ...mockCaseData, current_stage: 5, status: 'completed' },
        isCS: true,
        isTechnician: false,
        isLeader: false,
      });
      expect(result).toBe(true);
    });

    it('should allow CS to edit when final cost is rejected', () => {
      const result = canEditStage(5, {
        caseData: {
          ...mockCaseData,
          current_stage: 5,
          status: 'rejected',
          final_cost_status: 'rejected',
        },
        isCS: true,
        isTechnician: false,
        isLeader: false,
      });
      expect(result).toBe(true);
    });

    it('should not allow Technician to edit Stage 5', () => {
      const result = canEditStage(5, {
        caseData: { ...mockCaseData, current_stage: 5, status: 'completed' },
        isCS: false,
        isTechnician: true,
        isLeader: false,
        currentUserId: 2,
      });
      expect(result).toBe(false);
    });
  });

  describe('canEditStage - Edge cases', () => {
    it('should return false when caseData is null', () => {
      const result = canEditStage(1, {
        caseData: null,
        isCS: true,
        isTechnician: false,
        isLeader: false,
      });
      expect(result).toBe(false);
    });

    it('should return false for invalid stage number', () => {
      const result = canEditStage(99, {
        caseData: mockCaseData,
        isCS: true,
        isTechnician: false,
        isLeader: false,
      });
      expect(result).toBe(false);
    });
  });
});


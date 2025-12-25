import { describe, it, expect } from 'vitest';
import { 
  formatCaseStatus, 
  formatCostStatus, 
  formatPriority,
  getStatusColorClass,
  getPriorityColorClass,
  getStatusIcon,
  getPriorityIcon
} from '../caseHelpers';
import { CheckCircle2, Clock, AlertCircle, XCircle, Ban, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

describe('caseHelpers', () => {
  describe('formatCaseStatus', () => {
    it('should format snake_case status to Title Case', () => {
      expect(formatCaseStatus('in_progress')).toBe('In Progress');
      expect(formatCaseStatus('pending')).toBe('Pending');
      expect(formatCaseStatus('completed')).toBe('Completed');
      expect(formatCaseStatus('cancelled')).toBe('Cancelled');
    });

    it('should handle single word status', () => {
      expect(formatCaseStatus('open')).toBe('Open');
      expect(formatCaseStatus('closed')).toBe('Closed');
    });
  });

  describe('formatCostStatus', () => {
    it('should capitalize first letter', () => {
      expect(formatCostStatus('pending')).toBe('Pending');
      expect(formatCostStatus('approved')).toBe('Approved');
      expect(formatCostStatus('rejected')).toBe('Rejected');
    });

    it('should return "Pending" for null or undefined', () => {
      expect(formatCostStatus(null)).toBe('Pending');
    });
  });

  describe('formatPriority', () => {
    it('should capitalize first letter', () => {
      expect(formatPriority('low')).toBe('Low');
      expect(formatPriority('medium')).toBe('Medium');
      expect(formatPriority('high')).toBe('High');
    });
  });

  describe('getStatusColorClass', () => {
    it('should return correct color classes for each status', () => {
      expect(getStatusColorClass('open')).toBe('bg-blue-100 text-blue-700');
      expect(getStatusColorClass('in_progress')).toBe('bg-yellow-100 text-yellow-700');
      expect(getStatusColorClass('pending')).toBe('bg-yellow-100 text-yellow-700');
      expect(getStatusColorClass('completed')).toBe('bg-green-100 text-green-700');
      expect(getStatusColorClass('closed')).toBe('bg-green-100 text-green-700');
      expect(getStatusColorClass('cancelled')).toBe('bg-gray-100 text-gray-700');
      expect(getStatusColorClass('rejected')).toBe('bg-red-100 text-red-700');
    });

    it('should return default color for unknown status', () => {
      // TypeScript should prevent this, but test for runtime safety
      expect(getStatusColorClass('unknown' as any)).toBe('bg-blue-100 text-blue-700');
    });
  });

  describe('getPriorityColorClass', () => {
    it('should return correct color classes for each priority', () => {
      expect(getPriorityColorClass('low')).toBe('text-gray-500');
      expect(getPriorityColorClass('medium')).toBe('text-yellow-600');
      expect(getPriorityColorClass('high')).toBe('text-red-600');
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct icon for each status', () => {
      expect(getStatusIcon('open')).toBe(Clock);
      expect(getStatusIcon('in_progress')).toBe(Clock);
      expect(getStatusIcon('pending')).toBe(AlertCircle);
      expect(getStatusIcon('completed')).toBe(CheckCircle2);
      expect(getStatusIcon('closed')).toBe(CheckCircle2);
      expect(getStatusIcon('cancelled')).toBe(Ban);
      expect(getStatusIcon('rejected')).toBe(XCircle);
    });
  });

  describe('getPriorityIcon', () => {
    it('should return correct icon for each priority', () => {
      expect(getPriorityIcon('low')).toBe(TrendingDown);
      expect(getPriorityIcon('medium')).toBe(AlertTriangle);
      expect(getPriorityIcon('high')).toBe(TrendingUp);
    });
  });
});



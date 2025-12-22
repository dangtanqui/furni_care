import type { CaseStatus, CasePriority, CostStatus } from '../api/cases';

/**
 * Case-related utility functions
 */

/**
 * Format case status from snake_case to Title Case
 * e.g., "in_progress" -> "In Progress", "pending" -> "Pending"
 */
export function formatCaseStatus(status: CaseStatus): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format cost status to capitalize first letter
 * e.g., "pending" -> "Pending", "approved" -> "Approved", "rejected" -> "Rejected"
 */
export function formatCostStatus(costStatus: CostStatus): string {
  if (!costStatus) return 'Pending';
  return costStatus.charAt(0).toUpperCase() + costStatus.slice(1);
}

/**
 * Format priority to capitalize first letter
 * e.g., "low" -> "Low", "medium" -> "Medium", "high" -> "High"
 */
export function formatPriority(priority: CasePriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Gets the CSS class for a case status badge
 */
export function getStatusColorClass(status: CaseStatus): string {
  const statusColorMap: Record<CaseStatus, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    closed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
    rejected: 'bg-red-100 text-red-700',
  };
  
  return statusColorMap[status] || statusColorMap.open;
}

/**
 * Gets the CSS class for a priority text
 */
export function getPriorityColorClass(priority: CasePriority): string {
  const priorityColorMap: Record<CasePriority, string> = {
    low: 'text-gray-500',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };
  
  return priorityColorMap[priority] || priorityColorMap.low;
}

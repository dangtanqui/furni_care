/**
 * Case status constants
 */
export const CASE_STATUS = {
  OPEN: 'open',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type CaseStatus = typeof CASE_STATUS[keyof typeof CASE_STATUS];

/**
 * Cost status constants
 */
export const COST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type CostStatus = typeof COST_STATUS[keyof typeof COST_STATUS];

/**
 * Final cost status constants
 */
export const FINAL_COST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type FinalCostStatus = typeof FINAL_COST_STATUS[keyof typeof FINAL_COST_STATUS];


export const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-600',
};

export const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};

// Sort constants
export const SORT_DIRECTION = {
  ASC: 'asc' as const,
  DESC: 'desc' as const,
} as const;

export const DEFAULT_SORT = {
  column: 'created_at',
  direction: SORT_DIRECTION.DESC,
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  LOAD_CASES_FAILED: 'Failed to load cases. Please try again.',
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  FILTERS_APPLIED: 'Filters applied',
} as const;

// Toast durations (in milliseconds)
export const TOAST_DURATION = {
  FILTERS_APPLIED: 2000,
} as const;


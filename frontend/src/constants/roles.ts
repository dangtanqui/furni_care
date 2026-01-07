export const ROLES = {
  CS: 'cs',
  TECHNICIAN: 'technician',
  LEADER: 'leader',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

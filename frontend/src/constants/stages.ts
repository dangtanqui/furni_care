/**
 * Case stage constants
 */
export const STAGE = {
  STAGE_1: 1,
  STAGE_2: 2,
  STAGE_3: 3,
  STAGE_4: 4,
  STAGE_5: 5,
} as const;

export type Stage = typeof STAGE[keyof typeof STAGE];


/**
 * Attachment type constants
 */
export const ATTACHMENT_TYPE = {
  COST: 'cost',
} as const;

export type AttachmentType = typeof ATTACHMENT_TYPE[keyof typeof ATTACHMENT_TYPE];


export interface AttachmentItem {
  id: number;
  filename: string;
  url: string;
}

export interface AttachmentGridProps {
  attachments: AttachmentItem[];
  canEdit?: boolean;
  onDelete?: (attachmentId: number) => void;
}


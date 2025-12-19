export interface AttachmentItem {
  id: number;
  filename: string;
  url: string;
}

export interface AttachmentGridProps {
  attachments: AttachmentItem[];
}


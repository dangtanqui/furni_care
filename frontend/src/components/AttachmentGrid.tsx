import type { AttachmentGridProps } from '../types/components/AttachmentGrid';
import '../styles/components/AttachmentGrid.css';

export default function AttachmentGrid({ attachments }: AttachmentGridProps) {
  if (!attachments?.length) return null;

  return (
    <div className="attachment-grid">
      {attachments.map(att => (
        <div key={att.id} className="attachment-item">
          <img src={att.url} alt={att.filename} className="attachment-image" />
          <div className="attachment-filename">{att.filename}</div>
        </div>
      ))}
    </div>
  );
}


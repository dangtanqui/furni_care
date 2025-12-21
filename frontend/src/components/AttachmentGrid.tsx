import { useState } from 'react';
import { X } from 'lucide-react';
import ImageViewer from './ImageViewer';
import type { AttachmentGridProps } from '../types/components/AttachmentGrid';
import '../styles/components/AttachmentGrid.css';

export default function AttachmentGrid({ attachments, canEdit = false, onDelete }: AttachmentGridProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!attachments?.length) return null;

  // Filter only image attachments for viewer
  const imageAttachments = attachments.filter(att => {
    const ext = att.filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
  });

  const handleImageClick = (attId: number) => {
    const index = imageAttachments.findIndex(att => att.id === attId);
    if (index !== -1) {
      setViewerIndex(index);
    }
  };

  return (
    <>
      <div className="attachment-grid">
        {attachments.map(att => {
          const isImage = imageAttachments.some(img => img.id === att.id);
          return (
            <div key={att.id} className="attachment-item">
              <img
                src={att.url}
                alt={att.filename}
                className={`attachment-image ${isImage ? 'attachment-image-clickable' : ''}`}
                onClick={isImage ? () => handleImageClick(att.id) : undefined}
              />
              {canEdit && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(att.id);
                  }}
                  className="attachment-delete-button"
                  type="button"
                  aria-label={`Delete ${att.filename}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="attachment-filename">{att.filename}</div>
            </div>
          );
        })}
      </div>
      {viewerIndex !== null && imageAttachments.length > 0 && (
        <ImageViewer
          images={imageAttachments.map(att => att.url)}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}


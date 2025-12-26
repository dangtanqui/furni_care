import { useState, useMemo, useCallback, memo } from 'react';
import { X } from 'lucide-react';
import ImageViewer from './ImageViewer';
import type { AttachmentGridProps } from '../types/components/AttachmentGrid';
import '../styles/components/AttachmentGrid.css';

/**
 * Lazy-loaded image component
 */
const LazyImage = memo(({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      loading="lazy"
      decoding="async"
    />
  );
});

LazyImage.displayName = 'LazyImage';

function AttachmentGrid({ attachments, canEdit = false, onDelete }: AttachmentGridProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Memoize image attachments filter
  const imageAttachments = useMemo(() => {
    if (!attachments?.length) return [];
    return attachments.filter(att => {
      const ext = att.filename.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
    });
  }, [attachments]);

  const handleImageClick = useCallback((attId: number) => {
    const index = imageAttachments.findIndex(att => att.id === attId);
    if (index !== -1) {
      setViewerIndex(index);
    }
  }, [imageAttachments]);

  const handleDelete = useCallback((e: React.MouseEvent, attId: number) => {
    e.stopPropagation();
    onDelete?.(attId);
  }, [onDelete]);

  const imageUrls = useMemo(() => 
    imageAttachments.map(att => att.url),
    [imageAttachments]
  );

  if (!attachments?.length) return null;

  return (
    <>
      <div className="attachment-grid">
        {attachments.map(att => {
          const isImage = imageAttachments.some(img => img.id === att.id);
          return (
            <div key={att.id} className="attachment-item">
              <LazyImage
                src={att.url}
                alt={att.filename}
                className={`attachment-image ${isImage ? 'attachment-image-clickable' : ''}`}
                onClick={isImage ? () => handleImageClick(att.id) : undefined}
              />
              {canEdit && onDelete && (
                <button
                  onClick={(e) => handleDelete(e, att.id)}
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
      {viewerIndex !== null && imageUrls.length > 0 && (
        <ImageViewer
          images={imageUrls}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

export default memo(AttachmentGrid);


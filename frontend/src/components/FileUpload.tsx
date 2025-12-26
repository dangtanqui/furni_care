import { useState, useCallback, memo } from 'react';
import { Upload, X } from 'lucide-react';
import ImageViewer from './ImageViewer';
import type { FileUploadProps } from '../types/components/FileUpload';
import '../styles/components/FileUpload.css';

/**
 * Lazy-loaded preview image component
 */
const PreviewImage = memo(({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) => {
  return (
    <img
      src={src}
      alt={alt}
      className="file-upload-preview-image"
      onClick={onClick}
      loading="lazy"
      decoding="async"
    />
  );
});

PreviewImage.displayName = 'PreviewImage';

function FileUpload({
  label = 'Photos / Attachments',
  accept = 'image/*,.pdf,.doc,.docx',
  showPreview = false,
  previews = [],
  onFileChange,
  onDeletePreview,
  id = 'attachments',
  name = 'attachments',
  disabled = false,
  uploadText = 'Click to upload photos/documents',
}: FileUploadProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const handlePreviewClick = useCallback((idx: number) => {
    setViewerIndex(idx);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    onDeletePreview?.(idx);
  }, [onDeletePreview]);

  return (
    <div>
      <label htmlFor={id} className="file-upload-label">{label}</label>
      <label htmlFor={id} className="file-upload-area" aria-label={label}>
        <input
          id={id}
          name={name}
          type="file"
          multiple
          className="file-upload-input"
          accept={accept}
          onChange={onFileChange}
          disabled={disabled}
          aria-label={label}
        />
        <Upload className="file-upload-icon" />
        <p className="file-upload-text">{uploadText}</p>
      </label>
      {showPreview && previews.length > 0 && (
        <>
          <div className="file-upload-preview-grid">
            {previews.map((src, idx) => (
              <div key={idx} className="file-upload-preview-item">
                <PreviewImage
                  src={src}
                  alt={`Upload ${idx + 1}`}
                  onClick={() => handlePreviewClick(idx)}
                />
                {onDeletePreview && (
                  <button
                    onClick={(e) => handleDelete(e, idx)}
                    className="file-upload-delete-button"
                    type="button"
                    aria-label={`Delete image ${idx + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {viewerIndex !== null && (
            <ImageViewer
              images={previews}
              currentIndex={viewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default memo(FileUpload);


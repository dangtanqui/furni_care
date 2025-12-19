import { Upload } from 'lucide-react';
import type { FileUploadProps } from '../types/components/FileUpload';
import '../styles/components/FileUpload.css';

export default function FileUpload({
  label = 'Photos / Attachments',
  accept = 'image/*,.pdf,.doc,.docx',
  showPreview = false,
  previews = [],
  onFileChange,
  id = 'attachments',
  name = 'attachments',
  disabled = false,
  uploadText = 'Click to upload photos/documents',
}: FileUploadProps) {
  return (
    <div>
      <label htmlFor={id} className="file-upload-label">{label}</label>
      <label htmlFor={id} className="file-upload-area">
        <input
          id={id}
          name={name}
          type="file"
          multiple
          className="file-upload-input"
          accept={accept}
          onChange={onFileChange}
          disabled={disabled}
        />
        <Upload className="file-upload-icon" />
        <p className="file-upload-text">{uploadText}</p>
      </label>
      {showPreview && previews.length > 0 && (
        <div className="file-upload-preview-grid">
          {previews.map((src, idx) => (
            <div key={idx} className="file-upload-preview-item">
              <img src={src} alt={`Upload ${idx + 1}`} className="file-upload-preview-image" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


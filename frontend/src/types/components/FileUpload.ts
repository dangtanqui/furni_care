export interface FileUploadProps {
  /** Label text for the upload area */
  label?: string;
  /** Accept file types (e.g., "image/*,.pdf") */
  accept?: string;
  /** Whether to show preview before upload */
  showPreview?: boolean;
  /** Preview images (for showPreview mode) */
  previews?: string[];
  /** Callback when files are selected */
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback when a preview is deleted */
  onDeletePreview?: (index: number) => void;
  /** Input id and name */
  id?: string;
  name?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Upload area text */
  uploadText?: string;
}

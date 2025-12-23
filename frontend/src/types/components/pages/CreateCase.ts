// CaseFormProps - files prop removed as it's not used in component
export interface CaseFormData {
  client_id: string;
  site_id: string;
  contact_id: string;
  description: string;
  case_type: string;
  priority: string;
}

export interface CaseFormProps {
  form: CaseFormData;
  clients: { id: number; name: string }[];
  sites: { id: number; name: string; city: string }[];
  contacts: { id: number; name: string; phone: string }[];
  previews: string[];
  onFormChange: (form: CaseFormData) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeletePreview: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  errors?: Record<string, string>;
  onClearFieldError?: (keys: string[]) => void;
  loading?: boolean;
}



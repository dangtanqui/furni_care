// CaseFormProps - files prop removed as it's not used in component
export interface CaseFormProps {
  form: {
    client_id: string;
    site_id: string;
    contact_id: string;
    description: string;
    case_type: string;
    priority: string;
  };
  clients: { id: number; name: string }[];
  sites: { id: number; name: string; city: string }[];
  contacts: { id: number; name: string; phone: string }[];
  previews: string[];
  onFormChange: (form: any) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}



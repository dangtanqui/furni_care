import { ArrowLeft } from 'lucide-react';
import Button from '../fields/Button';
import { useCreateCase } from '../hooks/pages/useCreateCase';
import CaseForm from '../components/pages/create_case/CaseForm';
import '../styles/pages/CreateCase.css';

export default function CreateCase() {
  const {
    form,
    setForm,
    clients,
    sites,
    contacts,
    previews,
    handleFileChange,
    handleSubmit,
  } = useCreateCase();

  return (
    <div className="create-case-page">
      <Button variant="tertiary" onClick={() => window.history.back()} leftIcon={<ArrowLeft />} alwaysAutoWidth>
        Back
      </Button>
      
      <div className="create-case-card">
        <h1 className="create-case-title">Create New Case</h1>
        
        <CaseForm
          form={form}
          clients={clients}
          sites={sites}
          contacts={contacts}
          previews={previews}
          onFormChange={setForm}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}


import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { useCreateCase } from '../hooks/pages/useCreateCase';
import CaseForm from '../components/pages/create_case/CaseForm';
import '../styles/pages/CreateCase.css';

export default function CreateCase() {
  const {
    form,
    handleFormChange,
    clients,
    sites,
    contacts,
    previews,
    handleFileChange,
    handleDeletePreview,
    handleSubmit,
    errors,
    clearFieldError,
    loading,
  } = useCreateCase();

  return (
    <div className="create-case-page">
      <Button
        variant="tertiary"
        onClick={() => window.history.back()}
        leftIcon={<ArrowLeft />}
        alwaysAutoWidth
        className="create-case-back-button"
      >
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
          onFormChange={handleFormChange}
          onFileChange={handleFileChange}
          onDeletePreview={handleDeletePreview}
          onSubmit={handleSubmit}
          errors={errors}
          onClearFieldError={clearFieldError}
          loading={loading}
        />
      </div>
    </div>
  );
}


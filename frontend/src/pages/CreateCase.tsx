import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { useCreateCase } from '../hooks/pages/useCreateCase';
import CaseForm from '../components/pages/create_case/CaseForm';
import '../styles/pages/CreateCase.css';
import { useNavigate } from 'react-router-dom';

export default function CreateCase() {
  const navigate = useNavigate();
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

  const onSubmit = async (e: React.FormEvent) => {
    const result = await handleSubmit(e);

    // Navigate to case list on success (toast is handled by hook)
    if (result.success) {
      navigate('/');
    }
    // Error toast is handled by hook, no action needed here
  };

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
          onSubmit={onSubmit}
          errors={errors}
          onClearFieldError={clearFieldError}
          loading={loading}
        />
      </div>
    </div>
  );
}


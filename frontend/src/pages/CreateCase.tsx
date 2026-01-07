import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { useCreateCase } from '../hooks/pages/useCreateCase';
import CaseForm from '../components/pages/create_case/CaseForm';
import SEO from '../components/SEO';
import StructuredData, { generateBreadcrumbSchema } from '../components/StructuredData';
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

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://furnicare.example.com';
  
  return (
    <>
      <SEO
        title="Create New Case"
        description="Create a new warranty case in the FurniCare system"
        url="/cases/new"
        noindex={true}
        nofollow={true}
      />
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Case List', url: `${siteUrl}/` },
          { name: 'Create Case', url: `${siteUrl}/cases/new` },
        ])}
      />
      <div className="create-case-page">
        <Button
          variant="tertiary"
          onClick={() => window.history.back()}
          leftIcon={<ArrowLeft />}
          alwaysAutoWidth
          className="create-case-back-button"
          aria-label="Go back to case list"
        >
          Back
        </Button>
        
        <section aria-labelledby="create-case-heading">
          <div className="create-case-card">
            <h1 id="create-case-heading" className="create-case-title">Create New Case</h1>
            
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
        </section>
      </div>
    </>
  );
}

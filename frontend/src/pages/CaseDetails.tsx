import { useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import SkeletonLoader from '../components/SkeletonLoader';
import { STAGES } from '../constants/pages/CaseDetails';
import { useCaseDetails } from '../hooks/pages/useCaseDetails';
import { CaseDetailsProvider } from '../contexts/CaseDetailsContext';
import CaseHeader from '../components/pages/case_details/CaseHeader';
import StageSection from '../components/pages/case_details/StageSection';
import SEO from '../components/SEO';
import StructuredData, { generateBreadcrumbSchema } from '../components/StructuredData';
import '../styles/pages/CaseDetails.css';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    caseData,
    expandedStage,
    setExpandedStage,
    technicians,
    isCS,
    isTechnician,
    isLeader,
    currentUserId,
    error,
    loading,
    handleUpdate,
    handleAttachmentsUpload,
    handleAttachmentDelete,
    handleAdvance,
    handleApproveCost,
    handleRejectCost,
    handleApproveFinalCost,
    handleRejectFinalCost,
    handleRedo,
    handleCancelCase,
    canEditStage,
  } = useCaseDetails();

  const handleToggle = useCallback((stageNum: number) => {
    setExpandedStage(expandedStage === stageNum ? null : stageNum);
  }, [expandedStage, setExpandedStage]);

  const handleOpenStage = useCallback((stageNum: number) => {
    setExpandedStage(stageNum);
  }, [setExpandedStage]);

  const stageSections = useMemo(() => {
    return STAGES.map(stage => ({
      ...stage,
      canEdit: canEditStage(stage.num),
      expanded: expandedStage === stage.num,
    }));
  }, [canEditStage, expandedStage]);

  if (loading && !caseData) {
    return (
      <div className="case-details-page">
        <Button
          variant="tertiary"
          to="/"
          leftIcon={<ArrowLeft />}
          alwaysAutoWidth
          className="case-details-back-button"
        >
          Back
        </Button>
        
        {/* Skeleton for Case Header */}
        <div className="case-header-card">
          <div className="case-header-grid">
            <div className="case-header-field">
              <SkeletonLoader width="100px" height="16px" />
              <SkeletonLoader width="120px" height="20px" className="mt-1" />
            </div>
            <div className="case-header-field">
              <SkeletonLoader width="80px" height="16px" />
              <SkeletonLoader width="150px" height="20px" className="mt-1" />
            </div>
            <div className="case-header-field">
              <SkeletonLoader width="120px" height="16px" />
              <SkeletonLoader width="180px" height="20px" className="mt-1" />
            </div>
            <div className="case-header-field">
              <SkeletonLoader width="70px" height="16px" />
              <SkeletonLoader width="90px" height="24px" className="mt-1" />
            </div>
            <div className="case-header-field">
              <SkeletonLoader width="70px" height="16px" />
              <SkeletonLoader width="80px" height="20px" className="mt-1" />
            </div>
          </div>
          {/* Skeleton for progress bar */}
          <div className="case-header-progress">
            {STAGES.map((_, index) => (
              <div key={index} className="case-header-progress-item">
                <SkeletonLoader width="32px" height="32px" variant="circular" />
                {index < STAGES.length - 1 && (
                  <div className="case-header-progress-connector">
                    <SkeletonLoader width="60px" height="2px" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton for Stage Sections */}
        {STAGES.map((stage) => (
          <div key={stage.num} className="stage-section-card">
            <div className="stage-section-header">
              <SkeletonLoader width="200px" height="24px" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!caseData) return <div className="case-details-loading">Case not found</div>;

  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://furnicare.example.com';
  const caseUrl = `/cases/${id}`;
  
  // Generate SEO data from case
  const seoTitle = `Case ${nonNullCaseData.case_number} - ${nonNullCaseData.client.name}`;
  const seoDescription = nonNullCaseData.description 
    ? `${nonNullCaseData.description.substring(0, 155)}...`
    : `Warranty case ${nonNullCaseData.case_number} for ${nonNullCaseData.client.name} - Status: ${nonNullCaseData.status}`;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        url={caseUrl}
        noindex={true}
        nofollow={true}
      />
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Case List', url: `${siteUrl}/` },
          { name: `Case ${nonNullCaseData.case_number}`, url: `${siteUrl}${caseUrl}` },
        ])}
      />
      <CaseDetailsProvider
      value={{
        caseData: nonNullCaseData,
        technicians,
        isCS,
        isTechnician,
        isLeader,
        currentUserId,
        error,
        loading,
        handleUpdate,
        handleAttachmentsUpload,
        handleAttachmentDelete,
        handleAdvance,
        handleApproveCost,
        handleRejectCost,
        handleApproveFinalCost,
        handleRejectFinalCost,
        handleRedo,
        handleCancelCase,
        canEditStage,
      }}
    >
      <div className="case-details-page">
        <Button
          variant="tertiary"
          to="/"
          leftIcon={<ArrowLeft />}
          alwaysAutoWidth
          className="case-details-back-button"
          aria-label="Go back to case list"
        >
          Back
        </Button>

        <article aria-labelledby="case-details-heading">
          <div className="case-details-header">
            <h1 id="case-details-heading" className="case-details-title">
              Case Details - {nonNullCaseData.case_number}
            </h1>
          </div>

          <CaseHeader caseData={nonNullCaseData} />

          {error && (
            <div className="case-details-error" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          {loading && (
            <div 
              className="case-details-loading-processing" 
              aria-live="polite" 
              aria-busy="true"
            >
              Processing...
            </div>
          )}

          {/* Stage Sections */}
          {stageSections.map(stage => (
          <StageSection
            key={stage.num}
            stage={stage}
            expanded={stage.expanded}
            onToggle={() => handleToggle(stage.num)}
            onOpenStage={handleOpenStage}
            canEdit={stage.canEdit}
          />
          ))}
        </article>
      </div>
      </CaseDetailsProvider>
    </>
  );
}

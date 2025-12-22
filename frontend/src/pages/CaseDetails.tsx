import { useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { STAGES } from '../constants/pages/CaseDetails';
import { useCaseDetails } from '../hooks/pages/useCaseDetails';
import { CaseDetailsProvider } from '../contexts/CaseDetailsContext';
import CaseHeader from '../components/pages/case_details/CaseHeader';
import StageSection from '../components/pages/case_details/StageSection';
import '../styles/pages/CaseDetails.css';

export default function CaseDetail() {
  const {
    caseData,
    expandedStage,
    setExpandedStage,
    technicians,
    isCS,
    isTechnician,
    isLeader,
    error,
    loading,
    handleUpdate,
    handleAttachmentsUpload,
    handleAttachmentDelete,
    handleAdvance,
    handleApproveCost,
    handleRejectCost,
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

  if (loading && !caseData) return <div className="case-details-loading">Loading...</div>;
  if (!caseData) return <div className="case-details-loading">Case not found</div>;

  // TypeScript: caseData is guaranteed to be non-null here due to check above
  const nonNullCaseData = caseData;

  return (
    <CaseDetailsProvider
      value={{
        caseData: nonNullCaseData,
        technicians,
        isCS,
        isTechnician,
        isLeader,
        error,
        loading,
        handleUpdate,
        handleAttachmentsUpload,
        handleAttachmentDelete,
        handleAdvance,
        handleApproveCost,
        handleRejectCost,
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
        >
          Back
        </Button>

        <CaseHeader caseData={nonNullCaseData} />

        {error && (
          <div className="case-details-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="case-details-loading-processing">
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
      </div>
    </CaseDetailsProvider>
  );
}


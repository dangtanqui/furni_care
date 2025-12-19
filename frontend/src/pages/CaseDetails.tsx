import { ArrowLeft } from 'lucide-react';
import Button from '../fields/Button';
import { STAGES } from '../constants/pages/CaseDetails';
import { useCaseDetails } from '../hooks/pages/useCaseDetails';
import CaseHeader from '../components/pages/case_details/CaseHeader';
import StageSection from '../components/pages/case_details/StageSection';
import '../styles/pages/CaseDetails.css';

export default function CaseDetail() {
  const navigate = useNavigate();
  const {
    caseData,
    expandedStage,
    setExpandedStage,
    technicians,
    isCS,
    isTechnician,
    isLeader,
    handleUpdate,
    handleAttachmentsUpload,
    handleAdvance,
    handleApproveCost,
    handleRejectCost,
    handleRedo,
    handleCancelCase,
    canEditStage,
  } = useCaseDetails();

  if (!caseData) return <div className="case-details-loading">Loading...</div>;

  return (
    <div className="case-details-page">
      <Button variant="tertiary" to="/" leftIcon={<ArrowLeft />} alwaysAutoWidth>
        Back to List
      </Button>

      <CaseHeader caseData={caseData} />

      {/* Stage Sections */}
      {STAGES.map(stage => (
        <StageSection
          key={stage.num}
          stage={stage}
          caseData={caseData}
          expanded={expandedStage === stage.num}
          onToggle={() => setExpandedStage(expandedStage === stage.num ? null : stage.num)}
          onOpenStage={(stageNum: number) => setExpandedStage(stageNum)}
          canEdit={canEditStage(stage.num)}
          isCS={isCS}
          isLeader={isLeader}
          isTechnician={isTechnician}
          technicians={technicians}
          onUpdate={handleUpdate}
          onAdvance={handleAdvance}
          onApproveCost={handleApproveCost}
          onRejectCost={handleRejectCost}
          onCancelCase={handleCancelCase}
          onRedo={handleRedo}
          onUploadAttachments={handleAttachmentsUpload}
        />
      ))}
    </div>
  );
}


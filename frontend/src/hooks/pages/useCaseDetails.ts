import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCase, updateCase, advanceStage, approveCost, rejectCost, redoCase, cancelCase, uploadAttachments } from '../../api/cases';
import type { CaseDetail as CaseDetailType } from '../../api/cases';
import { getTechnicians } from '../../api/data';
import { useAuth } from '../../contexts/AuthContext';

export function useCaseDetails() {
  const { id } = useParams();
  const { isCS, isTechnician, isLeader } = useAuth();
  
  const [caseData, setCaseData] = useState<CaseDetailType | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [technicians, setTechnicians] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    loadCase();
    getTechnicians().then(res => setTechnicians(res.data));
  }, [id]);

  const loadCase = async () => {
    if (!id) return;
    const res = await getCase(Number(id));
    setCaseData(res.data);
    // If case is closed or cancelled, close all accordions.
    // If case is rejected but cost_status is rejected (cost rejected), still open Stage 3 for CS to cancel.
    // Otherwise, expand current stage.
    if (res.data.status === 'closed' || res.data.status === 'cancelled') {
      setExpandedStage(null);
    } else if (res.data.status === 'rejected' && res.data.cost_status === 'rejected' && res.data.current_stage === 3) {
      // When cost is rejected, open Stage 3 so CS can cancel
      setExpandedStage(3);
    } else {
      setExpandedStage(res.data.current_stage);
    }
  };

  const handleUpdate = async (data: Partial<CaseDetailType>) => {
    // Prevent any updates if case is closed or cancelled
    // Allow updates when completed (CS needs to update to close the case)
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
      console.warn('Cannot update case: case is already closed or cancelled');
      return;
    }
    await updateCase(Number(id!), data);
    await loadCase();
  };

  const handleAttachmentsUpload = async (stage: number, files: File[], attachmentType?: string) => {
    // Prevent any uploads if case is closed or cancelled
    // Allow uploads when completed (CS may need to upload in Stage 5)
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
      console.warn('Cannot upload attachments: case is already closed or cancelled');
      return;
    }
    if (!files.length) return;
    await uploadAttachments(Number(id!), stage, files, attachmentType || `stage_${stage}`);
    await loadCase();
  };

  const handleAdvance = async () => {
    // Prevent any stage advancement if case is closed or cancelled
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
      console.warn('Cannot advance stage: case is already closed or cancelled');
      return;
    }
    await advanceStage(Number(id!));
    await loadCase();
  };

  const handleApproveCost = async () => {
    // Prevent cost approval if case is closed or cancelled
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
      console.warn('Cannot approve cost: case is already closed or cancelled');
      return;
    }
    await approveCost(Number(id!));
    await loadCase();
  };

  const handleRejectCost = async () => {
    // Prevent cost rejection if case is closed or cancelled
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
      console.warn('Cannot reject cost: case is already closed or cancelled');
      return;
    }
    await rejectCost(Number(id!));
    await loadCase();
  };

  const handleRedo = async () => {
    // Prevent redo if case is closed or cancelled
    // Allow redo when completed (CS can redo from Stage 5)
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
      console.warn('Cannot redo case: case is already closed or cancelled');
      return;
    }
    await redoCase(Number(id!));
    await loadCase();
  };

  const handleCancelCase = async () => {
    // Prevent cancel if case is closed or cancelled
    if (caseData?.status === 'closed' || caseData?.status === 'cancelled') {
      console.warn('Cannot cancel case: case is already closed or cancelled');
      return;
    }
    await cancelCase(Number(id!));
    await loadCase();
  };

  const canEditStage = (stage: number) => {
    if (!caseData) return false;
    // Cannot edit if case is closed or cancelled
    if (caseData.status === 'closed' || caseData.status === 'cancelled') return false;
    
    // For Stage 3, allow Technician to edit even when cost is rejected, pending approval, or already approved
    if (stage === 3) {
      // Allow Technician to edit when cost is rejected (to update rejected cost)
      if (caseData.status === 'rejected' && caseData.cost_status === 'rejected') {
        return isTechnician;
      }
      // Allow Technician to edit when cost is pending approval (status === 'pending')
      // This allows editing even if current_stage has advanced past 3 (backend will rollback)
      // IMPORTANT: Check this BEFORE checking current_stage to allow editing when pending approval
      // cost_status can be null, undefined, or 'pending' when waiting for approval
      if (caseData.status === 'pending' && caseData.cost_required && 
          caseData.cost_status !== 'approved' && caseData.cost_status !== 'rejected') {
        return isTechnician; // Return immediately, don't check current_stage
      }
      // Allow Technician to edit Stage 3 even if cost was already approved (to update cost and re-submit for approval)
      // This allows editing even if current_stage has advanced past 3 (backend will rollback)
      if (caseData.cost_required && caseData.cost_status === 'approved' && caseData.current_stage >= 3) {
        return isTechnician; // Return immediately, don't check current_stage
      }
      // Cannot edit if case is rejected or cancelled but not due to cost
      if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
      
      // For normal Stage 3 editing, check if stage is current or already completed
      // Allow editing if stage is completed (stage <= current_stage)
      if (stage > caseData.current_stage) return false;
      // Only Technician can edit Stage 3 when status is in_progress or open (Leader can only approve/reject cost)
      return isTechnician && (caseData.status === 'in_progress' || caseData.status === 'open');
    } else {
      // For other stages, cannot edit if case is rejected or cancelled
      if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
      
      // Allow editing if stage is current or already completed (stage <= current_stage)
      if (stage > caseData.current_stage) return false;
      
      // Role-based editing permissions
      if (stage === 1) return isCS;
      if (stage === 2 || stage === 4) {
        // Technician can edit when status is in_progress or open
        return isTechnician && (caseData.status === 'in_progress' || caseData.status === 'open');
      }
      if (stage === 5) {
        // CS can edit Stage 5 when status is completed (to close the case)
        return isCS && caseData.status === 'completed';
      }
      return false;
    }
  };

  return {
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
  };
}


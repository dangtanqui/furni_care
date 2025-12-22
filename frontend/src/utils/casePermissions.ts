import type { CaseDetail } from '../api/cases';

interface PermissionParams {
  caseData: CaseDetail | null;
  isCS: boolean;
  isTechnician: boolean;
  isLeader: boolean;
}

/**
 * Check if a case can be edited (not closed or cancelled)
 */
function canEditCase(caseData: CaseDetail | null): boolean {
  if (!caseData) return false;
  return caseData.status !== 'closed' && caseData.status !== 'cancelled';
}

/**
 * Check if Stage 1 can be edited
 */
function canEditStage1({ caseData, isCS }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
  return isCS;
}

/**
 * Check if Stage 2 can be edited
 */
function canEditStage2({ caseData, isTechnician }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
  if (caseData.current_stage < 2) return false;
  return isTechnician;
}

/**
 * Check if Stage 3 can be edited (complex logic)
 */
function canEditStage3({ caseData, isTechnician }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  
  // Allow Technician to edit when cost is rejected (to update rejected cost)
  if (caseData.status === 'rejected' && caseData.cost_status === 'rejected') {
    return isTechnician;
  }
  
  // Allow Technician to edit when cost is pending approval
  if (caseData.status === 'pending' && caseData.cost_required && 
      caseData.cost_status !== 'approved' && caseData.cost_status !== 'rejected') {
    return isTechnician;
  }
  
  // Allow Technician to edit Stage 3 even if cost was already approved (to update cost and re-submit)
  if (caseData.cost_required && caseData.cost_status === 'approved' && caseData.current_stage >= 3) {
    return isTechnician;
  }
  
  // Cannot edit if case is rejected or cancelled but not due to cost
  if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
  
  // For normal Stage 3 editing
  if (caseData.current_stage < 3) return false;
  return isTechnician && (caseData.status === 'in_progress' || caseData.status === 'open');
}

/**
 * Check if Stage 4 can be edited
 */
function canEditStage4({ caseData, isTechnician }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
  if (caseData.current_stage < 4) return false;
  return isTechnician;
}

/**
 * Check if Stage 5 can be edited
 */
function canEditStage5({ caseData, isCS }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
  if (caseData.current_stage < 5) return false;
  return isCS && caseData.status === 'completed';
}

/**
 * Main function to check if a stage can be edited
 */
export function canEditStage(
  stage: number,
  { caseData, isCS, isTechnician, isLeader }: PermissionParams
): boolean {
  if (!caseData) return false;
  
  switch (stage) {
    case 1:
      return canEditStage1({ caseData, isCS, isTechnician, isLeader });
    case 2:
      return canEditStage2({ caseData, isCS, isTechnician, isLeader });
    case 3:
      return canEditStage3({ caseData, isCS, isTechnician, isLeader });
    case 4:
      return canEditStage4({ caseData, isCS, isTechnician, isLeader });
    case 5:
      return canEditStage5({ caseData, isCS, isTechnician, isLeader });
    default:
      return false;
  }
}

import type { CaseDetail } from '../api/cases';

interface PermissionParams {
  caseData: CaseDetail | null;
  isCS: boolean;
  isTechnician: boolean;
  isLeader: boolean;
  currentUserId?: number;
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
 * CS can always edit Stage 1 (removed current_stage check)
 * CS can edit even when cost is rejected (to reassign technician)
 * CS can edit even when final cost is rejected (to reassign technician)
 */
function canEditStage1({ caseData, isCS }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.status === 'cancelled') return false;
  // Allow CS to edit when cost is rejected (to reassign technician)
  if (caseData.status === 'rejected' && caseData.cost_status === 'rejected') {
    return isCS;
  }
  // Allow CS to edit when final cost is rejected (to reassign technician)
  if (caseData.status === 'rejected' && caseData.final_cost_status === 'rejected') {
    return isCS;
  }
  // Cannot edit if case is rejected but not due to cost or final cost rejection
  if (caseData.status === 'rejected') return false;
  return isCS;
}

/**
 * Check if Stage 2 can be edited
 * Only assigned technician can edit
 */
function canEditStage2({ caseData, isTechnician, currentUserId }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
  if (caseData.current_stage < 2) return false;
  if (!isTechnician) return false;
  // Only assigned technician can edit - if no technician assigned, no one can edit
  if (!caseData.assigned_to?.id || !currentUserId) return false;
  return caseData.assigned_to.id === currentUserId;
}

/**
 * Check if Stage 3 can be edited (complex logic)
 * Only assigned technician can edit
 */
function canEditStage3({ caseData, isTechnician, currentUserId }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  
  // Only assigned technician can edit - if no technician assigned, no one can edit
  if (!isTechnician) return false;
  if (!caseData.assigned_to?.id || currentUserId === undefined || currentUserId === null) return false;
  
  // CRITICAL: Must check assigned technician FIRST - only assigned technician can edit
  // Convert both to numbers to ensure strict comparison
  const assignedTechnicianId = Number(caseData.assigned_to.id);
  const currentUser = Number(currentUserId);
  if (assignedTechnicianId !== currentUser) {
    return false; // Not the assigned technician - cannot edit
  }
  
  // At this point, we know currentUserId === assigned_to.id, so it's the assigned technician
  // Now check special cases for Stage 3
  
  // Allow assigned Technician to edit when cost is rejected (to update rejected cost)
  if (caseData.status === 'rejected' && caseData.cost_status === 'rejected') {
    return true;
  }
  
  // Allow assigned Technician to edit when cost is pending approval
  if (caseData.status === 'pending' && caseData.cost_required && 
      caseData.cost_status !== 'approved' && caseData.cost_status !== 'rejected') {
    return true;
  }
  
  // Allow assigned Technician to edit Stage 3 even if cost was already approved (to update cost and re-submit)
  if (caseData.cost_required && caseData.cost_status === 'approved' && caseData.current_stage >= 3) {
    return true;
  }
  
  // Cannot edit if case is rejected or cancelled but not due to cost
  if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
  
  // For normal Stage 3 editing - only assigned technician can edit
  if (caseData.current_stage < 3) return false;
  return caseData.status === 'in_progress' || caseData.status === 'open';
}

/**
 * Check if Stage 4 can be edited
 * Only assigned technician can edit
 */
function canEditStage4({ caseData, isTechnician, currentUserId }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.status === 'rejected' || caseData.status === 'cancelled') return false;
  if (caseData.current_stage < 4) return false;
  if (!isTechnician) return false;
  // Only assigned technician can edit - if no technician assigned, no one can edit
  if (!caseData.assigned_to?.id || !currentUserId) return false;
  return caseData.assigned_to.id === currentUserId;
}

/**
 * Check if Stage 5 can be edited
 */
function canEditStage5({ caseData, isCS }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.status === 'cancelled') return false;
  if (caseData.current_stage < 5) return false;
  
  // Allow CS to edit when final cost is rejected (to update rejected final cost)
  if (caseData.status === 'rejected' && caseData.final_cost_status === 'rejected') {
    return isCS;
  }
  
  // Allow CS to edit when waiting for Leader approval (status = 'pending', final_cost_status = 'pending')
  // CS can still update final cost and redo while waiting for approval
  if (caseData.status === 'pending' && caseData.final_cost_status === 'pending') {
    return isCS;
  }
  
  // Cannot edit if case is rejected but not due to final cost rejection
  if (caseData.status === 'rejected') return false;
  
  // CS can edit Stage 5 when status is 'completed' (no cost required) or 'in_progress' (cost required, needs final cost input)
  return isCS && (caseData.status === 'completed' || caseData.status === 'in_progress');
}

/**
 * Main function to check if a stage can be edited
 */
export function canEditStage(
  stage: number,
  { caseData, isCS, isTechnician, isLeader, currentUserId }: PermissionParams
): boolean {
  if (!caseData) return false;
  
  switch (stage) {
    case 1:
      return canEditStage1({ caseData, isCS, isTechnician, isLeader, currentUserId });
    case 2:
      return canEditStage2({ caseData, isCS, isTechnician, isLeader, currentUserId });
    case 3:
      return canEditStage3({ caseData, isCS, isTechnician, isLeader, currentUserId });
    case 4:
      return canEditStage4({ caseData, isCS, isTechnician, isLeader, currentUserId });
    case 5:
      return canEditStage5({ caseData, isCS, isTechnician, isLeader, currentUserId });
    default:
      return false;
  }
}

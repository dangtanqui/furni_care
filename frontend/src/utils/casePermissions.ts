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
 * Only assigned CS can edit
 */
function canEditStage1({ caseData, isCS }: PermissionParams): boolean {
  if (!canEditCase(caseData)) return false;
  return isCS;
}

/**
 * Check if Stage 2 can be edited
 * Only assigned technician can edit
 */
function canEditStage2({ caseData, isTechnician, currentUserId }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.current_stage < 2) return false;
  // Only assigned technician can edit - if no technician assigned, no one can edit
  if (!caseData.assigned_to?.id || !currentUserId) return false;
  if (caseData.assigned_to.id !== currentUserId) return false;
  return isTechnician;
}

/**
 * Check if Stage 3 can be edited (complex logic)
 * Only assigned technician can edit
 */
function canEditStage3({ caseData, isTechnician, currentUserId }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.current_stage < 3) return false;
  // Only assigned technician can edit - if no technician assigned, no one can edit
  if (!caseData.assigned_to?.id || !currentUserId) return false;
  if (caseData.assigned_to.id !== currentUserId) return false;
  return isTechnician;
}

/**
 * Check if Stage 4 can be edited
 * Only assigned technician can edit
 */
function canEditStage4({ caseData, isTechnician, currentUserId }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.current_stage < 4) return false;
  // Only assigned technician can edit - if no technician assigned, no one can edit
  if (!caseData.assigned_to?.id || !currentUserId) return false;
  if (caseData.assigned_to.id !== currentUserId) return false;
  return isTechnician;
}

/**
 * Check if Stage 5 can be edited
 * Only assigned CS can edit
 */
function canEditStage5({ caseData, isCS }: PermissionParams): boolean {
  if (!caseData) return false;
  if (!canEditCase(caseData)) return false;
  if (caseData.current_stage < 5) return false;
  return isCS;
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

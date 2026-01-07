import { useMemo, useCallback } from 'react';
import { canEditStage as checkCanEditStage } from '../../utils/casePermissions';
import type { CaseDetail } from '../../api/cases';

interface UseCasePermissionsParams {
  caseData: CaseDetail | null;
  isCS: boolean;
  isTechnician: boolean;
  isLeader: boolean;
  currentUserId?: number;
}

/**
 * Hook for managing case permissions
 */
export function useCasePermissions({
  caseData,
  isCS,
  isTechnician,
  isLeader,
  currentUserId,
}: UseCasePermissionsParams) {
  // Memoize permission params to avoid unnecessary recalculations
  const permissionParams = useMemo(
    () => ({
      caseData,
      isCS,
      isTechnician,
      isLeader,
      currentUserId,
    }),
    [caseData, isCS, isTechnician, isLeader, currentUserId]
  );

  const canEditStage = useCallback(
    (stage: number) => {
      return checkCanEditStage(stage, permissionParams);
    },
    [permissionParams]
  );

  return {
    canEditStage,
  };
}

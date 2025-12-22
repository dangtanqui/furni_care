import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { CaseDetail as CaseDetailType } from '../api/cases';

interface CaseDetailsContextType {
  caseData: CaseDetailType | null;
  technicians: { id: number; name: string }[];
  isCS: boolean;
  isTechnician: boolean;
  isLeader: boolean;
  error: string | null;
  loading: boolean;
  handleUpdate: (data: Partial<CaseDetailType>) => Promise<void>;
  handleAttachmentsUpload: (stage: number, files: File[], attachmentType?: string) => Promise<void>;
  handleAttachmentDelete: (attachmentId: number) => Promise<void>;
  handleAdvance: () => Promise<void>;
  handleApproveCost: () => Promise<void>;
  handleRejectCost: () => Promise<void>;
  handleApproveFinalCost: () => Promise<void>;
  handleRejectFinalCost: () => Promise<void>;
  handleRedo: () => Promise<void>;
  handleCancelCase: () => Promise<void>;
  canEditStage: (stage: number) => boolean;
}

const CaseDetailsContext = createContext<CaseDetailsContextType | null>(null);

export function CaseDetailsProvider({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: CaseDetailsContextType;
}) {
  return (
    <CaseDetailsContext.Provider value={value}>
      {children}
    </CaseDetailsContext.Provider>
  );
}

export const useCaseDetailsContext = () => {
  const context = useContext(CaseDetailsContext);
  if (!context) {
    throw new Error('useCaseDetailsContext must be used within CaseDetailsProvider');
  }
  return context;
};

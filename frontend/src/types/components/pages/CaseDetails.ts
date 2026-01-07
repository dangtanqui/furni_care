import type { CaseDetail as CaseDetailType, CaseAttachmentItem } from '../../../api/cases';

export type { CaseDetailType, CaseAttachmentItem };

export interface StageSectionProps {
  stage: { num: number; name: string };
  caseData: CaseDetailType;
  expanded: boolean;
  onToggle: () => void;
  onOpenStage: (stageNum: number) => void;
  canEdit: boolean;
  isCS: boolean;
  isLeader: boolean;
  isTechnician: boolean;
  technicians: { id: number; name: string }[];
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  onApproveCost: () => void;
  onRejectCost: () => void;
  onCancelCase: () => void;
  onRedo: () => void;
  onUploadAttachments: (stage: number, files: File[], attachmentType?: string) => Promise<void>;
  onDeleteAttachment?: (attachmentId: number) => Promise<void>;
}

export interface Stage1Props {
  caseData: CaseDetailType;
  canEdit: boolean;
  isCS: boolean;
  technicians: { id: number; name: string }[];
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  onOpenStage: (stageNum: number) => void;
  onDeleteAttachment?: (attachmentId: number) => Promise<void>;
}

export interface Stage2Props {
  caseData: CaseDetailType;
  canEdit: boolean;
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  isCS: boolean;
  isLeader: boolean;
  onUploadAttachments: (stage: number, files: File[], attachmentType?: string) => Promise<void>;
  onDeleteAttachment?: (attachmentId: number) => Promise<void>;
  onOpenStage: (stageNum: number) => void;
}

export interface Stage3Props {
  caseData: CaseDetailType;
  canEdit: boolean;
  isLeader: boolean;
  isCS: boolean;
  isTechnician: boolean;
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  onApproveCost: () => void;
  onRejectCost: () => void;
  onCancelCase: () => void;
  onUploadAttachments: (stage: number, files: File[], attachmentType?: string) => Promise<void>;
  onDeleteAttachment?: (attachmentId: number) => Promise<void>;
  onCloseAccordion: () => void;
  onOpenStage: (stageNum: number) => void;
}

export interface Stage4Props {
  caseData: CaseDetailType;
  canEdit: boolean;
  isCS: boolean;
  isLeader: boolean;
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  onOpenStage: (stageNum: number) => void;
  onUploadAttachments: (stage: number, files: File[], attachmentType?: string) => Promise<void>;
  onDeleteAttachment?: (attachmentId: number) => Promise<void>;
}

export interface Stage5Props {
  caseData: CaseDetailType;
  canEdit: boolean;
  isCS: boolean;
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onRedo: () => void;
}

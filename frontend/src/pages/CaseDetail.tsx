import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCase, updateCase, advanceStage, approveCost, rejectCost, redoCase, uploadAttachments } from '../api/cases';
import type { CaseDetail as CaseDetailType, CaseAttachmentItem } from '../api/cases';
import { getTechnicians } from '../api/data';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ChevronDown, ChevronUp, Check, X, AlertCircle, User, Upload } from 'lucide-react';
import Select from '../components/Select';

const STAGES = [
  { num: 1, name: 'Input & Categorization' },
  { num: 2, name: 'Site Investigation' },
  { num: 3, name: 'Solution & Plan' },
  { num: 4, name: 'Execution' },
  { num: 5, name: 'Closing' },
];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    // If case is closed, close all accordions.
    // If case is rejected but cost_status is rejected (cost rejected), still open Stage 3 for CS to cancel.
    // Otherwise, expand current stage.
    if (res.data.status === 'closed') {
      setExpandedStage(null);
    } else if (res.data.status === 'rejected' && res.data.cost_status === 'rejected' && res.data.current_stage === 3) {
      // When cost is rejected, open Stage 3 so CS can cancel
      setExpandedStage(3);
    } else {
      setExpandedStage(res.data.current_stage);
    }
  };

  const handleUpdate = async (data: Partial<CaseDetailType>) => {
    // Prevent any updates if case is closed
    if (caseData?.status === 'closed') {
      console.warn('Cannot update case: case is already closed');
      return;
    }
    await updateCase(Number(id), data);
    await loadCase();
  };

  const handleAttachmentsUpload = async (stage: number, files: File[], attachmentType?: string) => {
    // Prevent any uploads if case is closed
    if (caseData?.status === 'closed') {
      console.warn('Cannot upload attachments: case is already closed');
      return;
    }
    if (!files.length) return;
    await uploadAttachments(Number(id), stage, files, attachmentType || `stage_${stage}`);
    await loadCase();
  };

  const handleAdvance = async () => {
    // Prevent any stage advancement if case is closed
    if (caseData?.status === 'closed') {
      console.warn('Cannot advance stage: case is already closed');
      return;
    }
    await advanceStage(Number(id));
    await loadCase();
  };

  const handleApproveCost = async () => {
    // Prevent cost approval if case is closed
    if (caseData?.status === 'closed') {
      console.warn('Cannot approve cost: case is already closed');
      return;
    }
    await approveCost(Number(id));
    await loadCase();
  };

  const handleRejectCost = async () => {
    // Prevent cost rejection if case is closed
    if (caseData?.status === 'closed') {
      console.warn('Cannot reject cost: case is already closed');
      return;
    }
    await rejectCost(Number(id));
    await loadCase();
  };

  const handleRedo = async () => {
    // Prevent redo if case is closed
    if (caseData?.status === 'closed') {
      console.warn('Cannot redo case: case is already closed');
      return;
    }
    await redoCase(Number(id));
    await loadCase();
  };

  if (!caseData) return <div className="p-6">Loading...</div>;

  const canEditStage = (stage: number) => {
    // Cannot edit if case is closed
    if (caseData.status === 'closed') return false;
    
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
      // Cannot edit if case is rejected but not due to cost
      if (caseData.status === 'rejected') return false;
      
      // For normal Stage 3 editing, check if stage is current or already completed
      // Allow editing if stage is completed (stage <= current_stage)
      if (stage > caseData.current_stage) return false;
      // Only Technician can edit Stage 3 (Leader can only approve/reject cost)
      return isTechnician;
    } else {
      // For other stages, cannot edit if case is rejected
      if (caseData.status === 'rejected') return false;
      
      // Allow editing if stage is current or already completed (stage <= current_stage)
      if (stage > caseData.current_stage) return false;
      
      // Role-based editing permissions
      if (stage === 1) return isCS;
      if (stage === 2 || stage === 4) return isTechnician;
      if (stage === 5) return isCS;
      return false;
    }
  };

  return (
    <div className="p-6">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 mb-6 hover:text-[#1e3a5f]">
        <ArrowLeft className="w-5 h-5" /> Back to List
      </button>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Case ID:</span>
            <span className="font-bold text-[#1e3a5f]">{caseData.case_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              caseData.status === 'closed' ? 'bg-green-100 text-green-700' : 
              caseData.status === 'rejected' ? 'bg-red-100 text-red-700' :
              caseData.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {caseData.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Client:</span>
            <span>{caseData.client.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Priority:</span>
            <span className={
              caseData.priority === 'high' ? 'text-red-600' :
              caseData.priority === 'medium' ? 'text-yellow-600' :
              'text-gray-600'
            }>
              {caseData.priority.charAt(0).toUpperCase() + caseData.priority.slice(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
          <span className="text-gray-500">Current Stage:</span>
          <span className="font-bold text-[#0d9488]">{caseData.current_stage} - {caseData.stage_name}</span>
          {caseData.attempt_number > 1 && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">Attempt #{caseData.attempt_number}</span>
          )}
        </div>

        {/* Stage Progress */}
        <div className="mt-6 flex items-center gap-1 md:gap-2">
          {STAGES.map((s, i) => {
            const isStageCompleted = s.num < caseData.current_stage || (caseData.status === 'closed' && s.num === 5);
            const isStageCurrent = s.num === caseData.current_stage && caseData.status !== 'closed';
            return (
              <div key={s.num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isStageCompleted ? 'bg-green-500 text-white' :
                  isStageCurrent ? 'bg-[#0d9488] text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isStageCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`w-8 md:w-12 h-1 ${isStageCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

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
          onRedo={handleRedo}
            onUploadAttachments={handleAttachmentsUpload}
        />
      ))}
    </div>
  );
}

interface StageSectionProps {
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
  onRedo: () => void;
  onUploadAttachments: (stage: number, files: File[], attachmentType?: string) => Promise<void>;
}

function StageSection({
  stage, caseData, expanded, onToggle, onOpenStage, canEdit, isCS, isLeader, isTechnician, technicians,
  onUpdate, onAdvance, onApproveCost, onRejectCost, onRedo,
  onUploadAttachments
}: StageSectionProps) {
  // Stage is completed if it's before current_stage, or if case is closed and it's Stage 5
  const isCompleted = stage.num < caseData.current_stage || (caseData.status === 'closed' && stage.num === 5);
  const isCurrent = stage.num === caseData.current_stage && caseData.status !== 'closed';

  return (
    <div className={`card mb-4 ${isCurrent ? 'ring-2 ring-[#0d9488]' : ''}`}>
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isCompleted ? 'bg-green-500 text-white' :
            isCurrent ? 'bg-[#0d9488] text-white' :
            'bg-gray-200 text-gray-500'
          }`}>
            {isCompleted ? <Check className="w-4 h-4" /> : stage.num}
          </div>
          <span className="font-medium text-[#1e3a5f]">Stage {stage.num} - {stage.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">Completed</span>}
          {isCurrent && <span className="text-xs text-[#0d9488] bg-teal-50 px-2 py-1 rounded whitespace-nowrap">Current</span>}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      <div className={`px-4 pb-4 border-t border-gray-100 pt-4 ${expanded ? '' : 'hidden'}`}>
        {stage.num === 1 && (
          <Stage1Content
            caseData={caseData}
            canEdit={canEdit}
            isCS={isCS}
            technicians={technicians}
            onUpdate={onUpdate}
            onAdvance={onAdvance}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 2 && (
          <Stage2Content
            caseData={caseData}
            canEdit={canEdit}
            isCS={isCS}
            isLeader={isLeader}
            onUpdate={onUpdate}
            onAdvance={onAdvance}
            onUploadAttachments={onUploadAttachments}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 3 && (
          <Stage3Content
            caseData={caseData}
            canEdit={canEdit}
            isLeader={isLeader}
            isCS={isCS}
            isTechnician={isTechnician}
            onUpdate={onUpdate}
            onAdvance={onAdvance}
            onApproveCost={onApproveCost}
            onRejectCost={onRejectCost}
            onUploadAttachments={onUploadAttachments}
            onCloseAccordion={() => onToggle()}
            onOpenStage={onOpenStage}
          />
        )}
        {stage.num === 4 && (
          <Stage4Content
            caseData={caseData}
            canEdit={canEdit}
            isCS={isCS}
            isLeader={isLeader}
            onUpdate={onUpdate}
            onAdvance={onAdvance}
            onOpenStage={onOpenStage}
            onUploadAttachments={onUploadAttachments}
          />
        )}
        {stage.num === 5 && (
          <Stage5Content
            caseData={caseData}
            canEdit={canEdit}
            isCS={isCS}
            onUpdate={onUpdate}
            onRedo={onRedo}
            onCloseAccordion={() => onToggle()}
          />
        )}
      </div>
    </div>
  );
}

// Stage 1 - Input & Categorization
interface Stage1Props {
  caseData: CaseDetailType;
  canEdit: boolean;
  isCS: boolean;
  technicians: { id: number; name: string }[];
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  onOpenStage: (stageNum: number) => void;
}

function Stage1Content({ caseData, canEdit, isCS, technicians, onUpdate, onAdvance, onOpenStage }: Stage1Props) {
  const [assignedTo, setAssignedTo] = useState('');
  const attachments = caseData.stage_attachments?.['1'] || [];
  const isCurrent = caseData.current_stage === 1;
  const currentAssignedId = caseData.assigned_to?.id?.toString() || '';
  
  // Initialize assignedTo with current assigned technician
  useEffect(() => {
    if (currentAssignedId) {
      setAssignedTo(currentAssignedId);
    }
  }, [currentAssignedId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <p>{caseData.client.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
          <p>{caseData.site.name} ({caseData.site.city})</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
          <p>{caseData.contact.name} - {caseData.contact.phone}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
          <p className="capitalize">{caseData.case_type}</p>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <p>{caseData.description || '-'}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photos / Attachments</label>
        <AttachmentGrid attachments={attachments} />
        {attachments.length === 0 && (
          <p className="text-gray-500 text-sm mt-1">No attachments</p>
        )}
      </div>

      {isCS && isCurrent && canEdit && (
        <div className="pt-4 border-t">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-gray-400" />
            <Select
              id="assigned_to"
              name="assigned_to"
              value={assignedTo || currentAssignedId}
              onChange={(value) => setAssignedTo(value)}
              options={[
                { value: '', label: 'Assign Technician...' },
                ...technicians.map((t: any) => ({ value: String(t.id), label: t.name })),
              ]}
              className="flex-1"
            />
            <button
              onClick={async () => {
                const selectedId = assignedTo || currentAssignedId;
                if (!selectedId || selectedId === '') return;
                try {
                  await onUpdate({ assigned_to_id: Number(selectedId) });
                  await onAdvance();
                  // Open Stage 2 after advancing
                  setTimeout(() => {
                    onOpenStage(2);
                  }, 100);
                } catch (error) {
                  console.error('Failed to assign technician:', error);
                }
              }}
              className="btn-accent whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={(!assignedTo || assignedTo === '') && !currentAssignedId}
            >
              Complete
            </button>
          </div>
        </div>
      )}

      {!canEdit && isCurrent && !isCS && (
        <div className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm">
          <p>⏳ Waiting for CS to complete input & categorization</p>
        </div>
      )}
    </div>
  );
}

// Stage 2 - Site Investigation
interface Stage2Props {
  caseData: CaseDetailType;
  canEdit: boolean;
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  isCS: boolean;
  isLeader: boolean;
  onUploadAttachments: (stage: number, files: File[], attachmentType?: string) => Promise<void>;
  onOpenStage: (stageNum: number) => void;
}

function Stage2Content({ caseData, canEdit, onUpdate, onAdvance, isCS, isLeader, onUploadAttachments, onOpenStage }: Stage2Props) {
  const [report, setReport] = useState(caseData.investigation_report || '');
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(caseData.investigation_checklist || '[]');
    } catch { return [false, false, false]; }
  });
  const isCurrent = caseData.current_stage === 2;
  const checklistItems = ['Check furniture condition', 'Document damage areas', 'Take measurements'];
  const attachments = caseData.stage_attachments?.['2'] || [];

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setReport(caseData.investigation_report || '');
    try {
      setChecklist(JSON.parse(caseData.investigation_checklist || '[]'));
    } catch {
      setChecklist([false, false, false]);
    }
  }, [caseData.investigation_report, caseData.investigation_checklist]);

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await onUploadAttachments(2, selectedFiles);
    e.target.value = '';
  };

  const handleFinish = async () => {
    await onUpdate({ investigation_report: report, investigation_checklist: JSON.stringify(checklist) });
    // Only advance if Stage 2 is the current stage
    if (caseData.current_stage === 2) {
      await onAdvance();
      // Open Stage 3 after advancing
      setTimeout(() => {
        onOpenStage(3);
      }, 100);
    } else {
      // If updating a completed stage, reload case data to get updated current_stage, then open it
      const updatedCase = await getCase(caseData.id);
      setTimeout(() => {
        onOpenStage(updatedCase.data.current_stage);
      }, 100);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="investigation_report" className="block text-sm font-medium text-gray-700 mb-1">Investigation Report</label>
        {canEdit ? (
          <textarea
            id="investigation_report"
            name="investigation_report"
            value={report}
            onChange={e => setReport(e.target.value)}
            className="input-field h-32"
            placeholder="Document findings from site investigation..."
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.investigation_report || 'No report yet'}</p>
        )}
      </div>

      <div>
        <label htmlFor="stage2-attachments" className="block text-sm font-medium text-gray-700 mb-1">Photos / Attachments</label>
        {canEdit && (
          <label htmlFor="stage2-attachments" className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0d9488] cursor-pointer block mb-3">
            <input id="stage2-attachments" name="stage2-attachments" type="file" multiple className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload photos/documents</p>
          </label>
        )}
        <AttachmentGrid attachments={attachments} />
        {!canEdit && attachments.length === 0 && (
          <p className="text-gray-500 text-sm">No attachments</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
        <div className="space-y-2">
          {checklistItems.map((item, idx) => (
            <label key={idx} htmlFor={`stage2-checklist-${idx}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                id={`stage2-checklist-${idx}`}
                name={`stage2-checklist-${idx}`}
                type="checkbox"
                checked={checklist[idx] || false}
                onChange={() => canEdit && toggleChecklist(idx)}
                disabled={!canEdit}
                className="w-5 h-5 text-[#0d9488] rounded"
              />
              <span className={checklist[idx] ? 'line-through text-gray-400' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {canEdit && isCurrent && (
        <button onClick={handleFinish} className="btn-accent">
          Complete
        </button>
      )}

      {!canEdit && isCurrent && (isCS || isLeader) && (
        <div className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm">
          <p>⏳ Waiting for Technician to complete investigation</p>
        </div>
      )}
    </div>
  );
}

// Stage 3 - Solution & Plan
interface Stage3Props {
  caseData: CaseDetailType;
  canEdit: boolean;
  isLeader: boolean;
  isCS: boolean;
  isTechnician: boolean;
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  onApproveCost: () => void;
  onRejectCost: () => void;
  onUploadAttachments: (stage: number, files: File[], attachmentType?: string) => Promise<void>;
  onCloseAccordion: () => void;
  onOpenStage: (stageNum: number) => void;
}

function Stage3Content({ caseData, canEdit, isLeader, isCS, isTechnician, onUpdate, onAdvance, onApproveCost, onRejectCost, onUploadAttachments, onCloseAccordion, onOpenStage }: Stage3Props) {
  const [form, setForm] = useState({
    root_cause: caseData.root_cause || '',
    solution_description: caseData.solution_description || '',
    planned_execution_date: caseData.planned_execution_date || '',
    cost_required: caseData.cost_required || false,
    estimated_cost: caseData.estimated_cost || '',
    cost_description: caseData.cost_description || '',
  });
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(caseData.solution_checklist || '[]');
    } catch { return [false, false]; }
  });
  const checklistItems = ['Prepare materials', 'Schedule with client'];
  const isCurrent = caseData.current_stage === 3;
  const canAdvance = !form.cost_required || caseData.cost_status === 'approved';
  const showSavePlan = caseData.status !== 'pending' && form.cost_required && caseData.cost_status !== 'approved' && caseData.cost_status !== 'rejected';
  const isRejected = caseData.cost_status === 'rejected';
  // Check pending approval using caseData (not form) to ensure consistency
  // cost_status can be 'pending', null, or undefined when waiting for approval
  const isPendingApproval = caseData.cost_required && 
    caseData.status === 'pending' && 
    caseData.cost_status !== 'approved' && 
    caseData.cost_status !== 'rejected';
  const attachments = caseData.stage_attachments?.['3'] || [];
  const costAttachments = attachments.filter((att: any) => att.attachment_type === 'cost');
  const stageAttachments = attachments.filter((att: any) => att.attachment_type !== 'cost');

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      root_cause: caseData.root_cause || '',
      solution_description: caseData.solution_description || '',
      planned_execution_date: caseData.planned_execution_date || '',
      cost_required: caseData.cost_required || false,
      estimated_cost: caseData.estimated_cost || '',
      cost_description: caseData.cost_description || '',
    });
    try {
      setChecklist(JSON.parse(caseData.solution_checklist || '[]'));
    } catch {
      setChecklist([false, false]);
    }
  }, [caseData.id, caseData.root_cause, caseData.solution_description, caseData.planned_execution_date, caseData.cost_required, caseData.estimated_cost, caseData.cost_description, caseData.solution_checklist]);

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await onUploadAttachments(3, selectedFiles);
    e.target.value = '';
  };

  const handleCostFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await onUploadAttachments(3, selectedFiles, 'cost');
    e.target.value = '';
  };

  const handleSubmit = async () => {
    await onUpdate({ 
      ...form, 
      solution_checklist: JSON.stringify(checklist),
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
    });
    // Only advance if Stage 3 is the current stage AND can advance (cost approved or not required)
    if (caseData.current_stage === 3 && canAdvance) {
      await onAdvance();
      // Open Stage 4 after advancing
      setTimeout(() => {
        onOpenStage(4);
      }, 100);
    } else {
      // If updating a completed stage or cannot advance, reload case data to get updated current_stage, then open it
      const updatedCase = await getCase(caseData.id);
      setTimeout(() => {
        onOpenStage(updatedCase.data.current_stage);
      }, 100);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="root_cause" className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
        {canEdit ? (
          <input
            id="root_cause"
            name="root_cause"
            type="text"
            value={form.root_cause}
            onChange={e => setForm({ ...form, root_cause: e.target.value })}
            className="input-field"
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.root_cause || '-'}</p>
        )}
      </div>

      <div>
        <label htmlFor="solution_description" className="block text-sm font-medium text-gray-700 mb-1">Solution Description</label>
        {canEdit ? (
          <textarea
            id="solution_description"
            name="solution_description"
            value={form.solution_description}
            onChange={e => setForm({ ...form, solution_description: e.target.value })}
            className="input-field h-24"
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.solution_description || '-'}</p>
        )}
      </div>

      <div>
        <label htmlFor="stage3-attachments" className="block text-sm font-medium text-gray-700 mb-1">Photos / Attachments</label>
        {canEdit && (
          <label htmlFor="stage3-attachments" className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0d9488] cursor-pointer block mb-3">
            <input id="stage3-attachments" name="stage3-attachments" type="file" multiple className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload photos/documents</p>
          </label>
        )}
        <AttachmentGrid attachments={stageAttachments} />
        {!canEdit && stageAttachments.length === 0 && (
          <p className="text-gray-500 text-sm">No attachments</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
        <div className="space-y-2">
          {checklistItems.map((item, idx) => (
            <label key={idx} htmlFor={`stage3-checklist-${idx}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                id={`stage3-checklist-${idx}`}
                name={`stage3-checklist-${idx}`}
                type="checkbox"
                checked={checklist[idx] || false}
                onChange={() => canEdit && toggleChecklist(idx)}
                disabled={!canEdit}
                className="w-5 h-5 text-[#0d9488] rounded"
              />
              <span className={checklist[idx] ? 'line-through text-gray-400' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="planned_execution_date" className="block text-sm font-medium text-gray-700 mb-1">Planned Execution Date</label>
        {canEdit ? (
          <input
            id="planned_execution_date"
            name="planned_execution_date"
            type="date"
            value={form.planned_execution_date}
            onChange={e => setForm({ ...form, planned_execution_date: e.target.value })}
            className="input-field"
          />
        ) : (
          <p>{caseData.planned_execution_date || '-'}</p>
        )}
      </div>

      {/* Cost Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <label htmlFor="cost_required" className="flex items-center gap-2 mb-3">
          <input
            id="cost_required"
            name="cost_required"
            type="checkbox"
            checked={form.cost_required}
            onChange={e => setForm({ ...form, cost_required: e.target.checked })}
            disabled={!canEdit}
          />
          <span className="font-medium">Cost Required</span>
        </label>

        {form.cost_required && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                {canEdit ? (
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <span className="px-3 py-2 bg-gray-50 text-gray-700 border-r border-gray-300 flex-shrink-0">$</span>
                    <input
                      id="estimated_cost"
                      name="estimated_cost"
                      type="number"
                      value={form.estimated_cost}
                      onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
                      className="flex-1 px-3 py-2 border-0 rounded-none focus:outline-none focus:ring-0"
                      placeholder="0.00"
                    />
                  </div>
                ) : (
                  <p className="flex items-center h-10">${caseData.estimated_cost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Status</label>
                <p className={`flex items-center h-10 ${
                  caseData.cost_status === 'approved' ? 'text-green-600' :
                  caseData.cost_status === 'rejected' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {caseData.cost_status || 'Pending'}
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="cost_description" className="block text-sm font-medium text-gray-700 mb-1">Cost Description</label>
              {canEdit ? (
                <input
                  id="cost_description"
                  name="cost_description"
                  type="text"
                  value={form.cost_description}
                  onChange={e => setForm({ ...form, cost_description: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p>{caseData.cost_description || '-'}</p>
              )}
            </div>
            <div>
              <label htmlFor="cost-attachments" className="block text-sm font-medium text-gray-700 mb-1">Cost Attachments</label>
              {canEdit && (
                <label htmlFor="cost-attachments" className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0d9488] cursor-pointer block mb-3">
                  <input id="cost-attachments" name="cost-attachments" type="file" multiple className="hidden" accept="image/*,.pdf" onChange={handleCostFileChange} />
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload cost documents</p>
                </label>
              )}
              <AttachmentGrid attachments={costAttachments} />
            </div>

            {isLeader && caseData.status === 'pending' && caseData.cost_status !== 'approved' && caseData.cost_status !== 'rejected' && (
              <div className="flex gap-3 pt-3 border-t">
                <button onClick={onApproveCost} className="btn-accent flex items-center gap-2">
                  <Check className="w-4 h-4" /> Approve Cost
                </button>
                <button onClick={onRejectCost} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {canEdit && !isLeader && (
        <div className="flex gap-3 items-center">
          {canAdvance ? (
            <button onClick={handleSubmit} className={isCurrent ? 'btn-accent' : 'btn-secondary'}>
              {isCurrent ? 'Complete' : 'Update'}
            </button>
          ) : showSavePlan ? (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button 
                onClick={async () => {
                  await onUpdate({ 
                    ...form, 
                    solution_checklist: JSON.stringify(checklist), 
                    status: 'pending',
                    estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
                  });
                  // Wait a bit for the update to complete before closing accordion
                  setTimeout(() => {
                    onCloseAccordion();
                  }, 100);
                }} 
                className="btn-primary whitespace-nowrap flex-shrink-0"
              >
                Save Plan
              </button>
              <span className="flex items-center gap-2 text-yellow-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> <span className="whitespace-normal">Save first, then wait for Leader approval</span>
              </span>
            </div>
          ) : (
            <>
              {/* When cost is rejected */}
              {isRejected && caseData.cost_required ? (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button 
                    onClick={async () => {
                      await onUpdate({ 
                        ...form, 
                        solution_checklist: JSON.stringify(checklist),
                        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
                      });
                      setTimeout(() => {
                        onCloseAccordion();
                      }, 100);
                    }} 
                    className="btn-secondary whitespace-nowrap flex-shrink-0"
                  >
                    Update Plan
                  </button>
                  <span className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> <span className="whitespace-normal">Cost has been rejected. Please update the cost plan.</span>
                  </span>
                </div>
              ) : isPendingApproval ? (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button 
                    onClick={async () => {
                      await onUpdate({ 
                        ...form, 
                        solution_checklist: JSON.stringify(checklist), 
                        status: 'pending',
                        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined
                      });
                      setTimeout(() => {
                        onCloseAccordion();
                      }, 100);
                    }} 
                    className="btn-secondary whitespace-nowrap flex-shrink-0"
                  >
                    Update Plan
                  </button>
                  <span className="flex items-center gap-2 text-yellow-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> <span className="whitespace-normal">Waiting for Leader approval. You can still update the plan.</span>
                  </span>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* CS can cancel case when cost is rejected */}
      {isCS && isRejected && form.cost_required && caseData.status !== 'closed' && (
        <div className="pt-4 border-t">
          <button 
            onClick={async () => {
              try {
                await onUpdate({ status: 'rejected' });
                setTimeout(() => {
                  onCloseAccordion();
                }, 100);
              } catch (error) {
                console.error('Failed to cancel case:', error);
                alert('Failed to cancel case. Please try again.');
              }
            }} 
            className="btn-accent"
          >
            Cancel
          </button>
        </div>
      )}

      {!canEdit && isCurrent && (() => {
        // Check if cost is pending approval using caseData (not form, because CS can't edit)
        // cost_status can be 'pending', null, or undefined when waiting for approval
        const costPendingApproval = caseData.cost_required && 
          caseData.status === 'pending' && 
          caseData.cost_status !== 'approved' && 
          caseData.cost_status !== 'rejected';
        
        // When pending approval: show for CS and Technician (not Leader - Leader is approving)
        if (costPendingApproval && (isCS || isTechnician)) return true;
        // When rejected: show for Leader only (CS has Cancel button, Technician can update, Leader needs to see status)
        if (isRejected && caseData.cost_required && isLeader) return true;
        // Otherwise: show for CS and Leader when not rejected and not pending approval (Technician is editing)
        if (!isRejected && !costPendingApproval && (isCS || isLeader)) return true;
        return false;
      })() && (
        <div className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm">
          {isRejected && caseData.cost_required ? (
            <p>⏳ Waiting for Technician to update cost plan or CS to close case</p>
          ) : (() => {
            // Check if cost is pending approval
            const costPendingApproval = caseData.cost_required && 
              caseData.status === 'pending' && 
              caseData.cost_status !== 'approved' && 
              caseData.cost_status !== 'rejected';
            return costPendingApproval;
          })() ? (
            <p>⏳ Waiting for Leader to complete solution & plan</p>
          ) : (
            <p>⏳ Waiting for Technician to complete solution & plan</p>
          )}
        </div>
      )}
    </div>
  );
}

// Stage 4 - Execution
function Stage4Content({ caseData, canEdit, isCS, isLeader, onUpdate, onAdvance, onOpenStage, onUploadAttachments }: any) {
  const [form, setForm] = useState({
    execution_report: caseData.execution_report || '',
    client_feedback: caseData.client_feedback || '',
    client_rating: caseData.client_rating || 5,
    client_signature: caseData.client_signature || '',
  });
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(caseData.execution_checklist || '[]');
    } catch { return [false, false]; }
  });
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isCurrent = caseData.current_stage === 4;
  const attachments = caseData.stage_attachments?.['4'] || [];
  const checklistItems = ['Work completed as planned', 'Client satisfied with work'];

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      execution_report: caseData.execution_report || '',
      client_feedback: caseData.client_feedback || '',
      client_rating: caseData.client_rating || 5,
      client_signature: caseData.client_signature || '',
    });
    try {
      setChecklist(JSON.parse(caseData.execution_checklist || '[]'));
    } catch {
      setChecklist([false, false]);
    }
  }, [caseData.id, caseData.execution_report, caseData.client_feedback, caseData.client_rating, caseData.execution_checklist, caseData.client_signature]);

  // Save canvas state to history
  const saveToHistory = () => {
    if (!signatureRef.current) return;
    const canvas = signatureRef.current;
    const dataURL = canvas.toDataURL('image/png');
    
    // Don't save if it's the same as the current state in history
    if (historyRef.current.length > 0 && historyRef.current[historyIndexRef.current] === dataURL) {
      return;
    }
    
    // Remove any future history if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    // Add new state to history
    historyRef.current.push(dataURL);
    historyIndexRef.current = historyRef.current.length - 1;
    
    // Limit history size to prevent memory issues
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
    
    // Update button states
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  // Initialize signature canvas and add touch event listeners
  useEffect(() => {
    if (signatureRef.current && canEdit) {
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Load existing signature if available
        if (caseData.client_signature) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            // Initialize history with existing signature
            historyRef.current = [caseData.client_signature];
            historyIndexRef.current = 0;
            setCanUndo(false);
            setCanRedo(false);
          };
          img.src = caseData.client_signature;
        } else {
          // Initialize with empty canvas
          const emptyDataURL = canvas.toDataURL('image/png');
          historyRef.current = [emptyDataURL];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
        }
      }

      // Add touch event listeners with passive: false to allow preventDefault
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (!signatureRef.current || !canEdit) return;
        const canvas = signatureRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touch = e.touches[0];
        if (!touch) return;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        // Save current state to history before starting to draw (only if not already drawing)
        if (!isDrawingRef.current) {
          const dataURL = canvas.toDataURL('image/png');
          const currentState = historyRef.current.length > 0 ? historyRef.current[historyIndexRef.current] : null;
          if (currentState !== dataURL) {
            if (historyIndexRef.current < historyRef.current.length - 1) {
              historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
            }
            historyRef.current.push(dataURL);
            historyIndexRef.current = historyRef.current.length - 1;
            setCanUndo(historyIndexRef.current > 0);
            setCanRedo(false);
          }
        }
        
        isDrawingRef.current = true;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (!isDrawingRef.current || !signatureRef.current || !canEdit) return;
        const canvas = signatureRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touch = e.touches[0];
        if (!touch) return;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        if (!signatureRef.current) return;
        const wasDrawing = isDrawingRef.current;
        isDrawingRef.current = false;
        if (wasDrawing) {
          saveToHistory();
          const canvas = signatureRef.current;
          const dataURL = canvas.toDataURL('image/png');
          setForm((prev) => ({ ...prev, client_signature: dataURL }));
        }
      };

      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [canEdit, caseData.client_signature]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await onUploadAttachments(4, selectedFiles);
    e.target.value = '';
  };

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!signatureRef.current) return { x: 0, y: 0 };
    const canvas = signatureRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle both mouse and touch events
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!signatureRef.current || !canEdit) return;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling on touch devices
    }
    // Save current state to history before starting to draw (only if not already drawing)
    if (!isDrawingRef.current) {
      // Save the state before we start drawing
      const canvas = signatureRef.current;
      const dataURL = canvas.toDataURL('image/png');
      
      // Only save if it's different from the current state in history (at current index)
      const currentState = historyRef.current.length > 0 ? historyRef.current[historyIndexRef.current] : null;
      if (currentState !== dataURL) {
        // Remove any future history if we're not at the end
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        }
        // Add current state to history before starting to draw
        historyRef.current.push(dataURL);
        historyIndexRef.current = historyRef.current.length - 1;
        // Update button states
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(false);
      }
    }
    isDrawingRef.current = true;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !signatureRef.current || !canEdit) return;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling on touch devices
    }
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!signatureRef.current) return;
    const wasDrawing = isDrawingRef.current;
    isDrawingRef.current = false;
    // Save to history only if we were actually drawing
    if (wasDrawing) {
      saveToHistory();
      // Save signature to form
      const canvas = signatureRef.current;
      const dataURL = canvas.toDataURL('image/png');
      setForm({ ...form, client_signature: dataURL });
    }
  };

  const undo = () => {
    if (historyIndexRef.current > 0 && signatureRef.current) {
      historyIndexRef.current--;
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          setForm({ ...form, client_signature: dataURL });
          // Update button states
          setCanUndo(historyIndexRef.current > 0);
          setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
        };
        img.src = historyRef.current[historyIndexRef.current];
      }
    }
  };

  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1 && signatureRef.current) {
      historyIndexRef.current++;
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          setForm({ ...form, client_signature: dataURL });
          // Update button states
          setCanUndo(historyIndexRef.current > 0);
          setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
        };
        img.src = historyRef.current[historyIndexRef.current];
      }
    }
  };

  const clearSignature = () => {
    if (!signatureRef.current) return;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setForm({ ...form, client_signature: '' });
      // Save empty state to history
      saveToHistory();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="execution_report" className="block text-sm font-medium text-gray-700 mb-1">Execution Report</label>
        {canEdit ? (
          <textarea
            id="execution_report"
            name="execution_report"
            value={form.execution_report}
            onChange={e => setForm({ ...form, execution_report: e.target.value })}
            className="input-field h-32"
            placeholder="Document execution details..."
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.execution_report || '-'}</p>
        )}
      </div>

      <div>
        <label htmlFor="stage4-attachments" className="block text-sm font-medium text-gray-700 mb-1">Photos / Attachments</label>
        {canEdit && (
          <label htmlFor="stage4-attachments" className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0d9488] cursor-pointer block mb-3">
            <input id="stage4-attachments" name="stage4-attachments" type="file" multiple className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload photos/documents</p>
          </label>
        )}
        <AttachmentGrid attachments={attachments} />
        {!canEdit && attachments.length === 0 && (
          <p className="text-gray-500 text-sm">No attachments</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Execution Checklist</label>
        <div className="space-y-2">
          {checklistItems.map((item, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checklist[idx] || false}
                onChange={() => canEdit && toggleChecklist(idx)}
                disabled={!canEdit}
                className="w-5 h-5 text-[#0d9488] rounded"
              />
              <span className={checklist[idx] ? 'line-through text-gray-400' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client Signature</label>
        {canEdit ? (
          <div className="border border-gray-300 rounded-lg p-4">
            <canvas
              ref={signatureRef}
              width={600}
              height={200}
              className="border border-gray-200 rounded bg-white cursor-crosshair w-full touch-none"
              style={{ maxWidth: '100%', height: 'auto', touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className={`text-sm px-3 py-1 rounded ${
                  canUndo 
                    ? 'text-gray-700 hover:bg-gray-100 bg-gray-50' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className={`text-sm px-3 py-1 rounded ${
                  canRedo 
                    ? 'text-gray-700 hover:bg-gray-100 bg-gray-50' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Redo
              </button>
              <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            {caseData.client_signature ? (
              <img src={caseData.client_signature} alt="Client Signature" className="max-w-full h-auto" />
            ) : (
              <p className="text-gray-500 text-sm">No signature</p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3">Client Feedback</h4>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500">Rating</label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => canEdit && setForm({ ...form, client_rating: n })}
                  className={`w-10 h-10 rounded-full ${
                    form.client_rating >= n ? 'bg-yellow-400 text-white' : 'bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="client_feedback" className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
            {canEdit ? (
              <textarea
                id="client_feedback"
                name="client_feedback"
                value={form.client_feedback}
                onChange={e => setForm({ ...form, client_feedback: e.target.value })}
                className="input-field h-20"
              />
            ) : (
              <p>{caseData.client_feedback || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {canEdit && isCurrent && (
        <button 
          onClick={async () => {
            await onUpdate({
              ...form,
              execution_checklist: JSON.stringify(checklist),
            });
            await onAdvance();
            // Open Stage 5 after advancing
            setTimeout(() => {
              onOpenStage(5);
            }, 100);
          }} 
          className="btn-accent"
        >
          Complete
        </button>
      )}

      {!canEdit && isCurrent && (isCS || isLeader) && (
        <div className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm">
          <p>⏳ Waiting for Technician to complete execution</p>
        </div>
      )}
    </div>
  );
}

// Stage 5 - Closing
function Stage5Content({ caseData, canEdit, isCS, onUpdate, onRedo }: any) {
  const [form, setForm] = useState({
    cs_notes: caseData.cs_notes || '',
    final_feedback: caseData.final_feedback || '',
    final_rating: caseData.final_rating || 5,
  });

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      cs_notes: caseData.cs_notes || '',
      final_feedback: caseData.final_feedback || '',
      final_rating: caseData.final_rating || 5,
    });
  }, [caseData.id, caseData.cs_notes, caseData.final_feedback, caseData.final_rating]);

  const handleClose = async () => {
    try {
      await onUpdate({ ...form, status: 'closed' });
    } catch (error) {
      console.error('Failed to close case:', error);
      alert('Failed to close case. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="cs_notes" className="block text-sm font-medium text-gray-700 mb-1">CS Notes</label>
        {canEdit ? (
          <textarea
            id="cs_notes"
            name="cs_notes"
            value={form.cs_notes}
            onChange={e => setForm({ ...form, cs_notes: e.target.value })}
            className="input-field h-24"
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.cs_notes || '-'}</p>
        )}
      </div>

      <div>
        <label htmlFor="final_feedback" className="block text-sm font-medium text-gray-700 mb-1">Final Client Feedback</label>
        {canEdit ? (
          <textarea
            id="final_feedback"
            name="final_feedback"
            value={form.final_feedback}
            onChange={e => setForm({ ...form, final_feedback: e.target.value })}
            className="input-field h-20"
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.final_feedback || '-'}</p>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">Final Rating</label>
        {canEdit ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setForm({ ...form, final_rating: n })}
                className={`w-10 h-10 rounded-full ${
                  form.final_rating >= n ? 'bg-yellow-400 text-white' : 'bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        ) : (
          <p>{caseData.final_rating ? `${caseData.final_rating}/5` : '-'}</p>
        )}
      </div>

      {canEdit && caseData.status !== 'closed' && (
        <div className="flex gap-3">
          <button onClick={handleClose} className="btn-accent">
            Complete
          </button>
          <button onClick={onRedo} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
            Redo → Back to Stage 3
          </button>
        </div>
      )}

      {!canEdit && caseData.current_stage === 5 && !isCS && caseData.status !== 'closed' && (
        <div className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm">
          <p>⏳ Waiting for CS to complete closing</p>
        </div>
      )}

    </div>
  );
}

function AttachmentGrid({ attachments }: { attachments: CaseAttachmentItem[] }) {
  if (!attachments?.length) return null;

  return (
    <div className="grid grid-cols-4 gap-3">
      {attachments.map(att => (
        <div key={att.id} className="relative group">
          <img src={att.url} alt={att.filename} className="w-full h-24 object-cover rounded-lg" />
          <div className="mt-1 text-xs text-gray-500 text-center">{att.filename}</div>
        </div>
      ))}
    </div>
  );
}


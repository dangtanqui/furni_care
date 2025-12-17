import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCase, updateCase, advanceStage, approveCost, rejectCost, redoCase, uploadAttachments } from '../api/cases';
import type { CaseDetail as CaseDetailType, CaseAttachmentItem } from '../api/cases';
import { getTechnicians } from '../api/data';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ChevronDown, ChevronUp, Check, X, AlertCircle, Clock, User } from 'lucide-react';

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
  const [editData, setEditData] = useState<Partial<CaseDetailType>>({});

  useEffect(() => {
    loadCase();
    getTechnicians().then(res => setTechnicians(res.data));
  }, [id]);

  const loadCase = async () => {
    const res = await getCase(Number(id));
    setCaseData(res.data);
    setExpandedStage(res.data.current_stage);
  };

  const handleUpdate = async (data: Partial<CaseDetailType>) => {
    await updateCase(Number(id), data);
    loadCase();
  };

  const handleAttachmentsUpload = async (stage: number, files: File[]) => {
    if (!files.length) return;
    await uploadAttachments(Number(id), stage, files, `stage_${stage}`);
    loadCase();
  };

  const handleAdvance = async () => {
    await advanceStage(Number(id));
    loadCase();
  };

  const handleApproveCost = async () => {
    await approveCost(Number(id));
    loadCase();
  };

  const handleRejectCost = async () => {
    await rejectCost(Number(id));
    loadCase();
  };

  const handleRedo = async () => {
    await redoCase(Number(id));
    loadCase();
  };

  if (!caseData) return <div className="p-6">Loading...</div>;

  const canEditStage = (stage: number) => {
    if (stage !== caseData.current_stage) return false;
    if (stage === 1) return isCS;
    if (stage === 2 || stage === 4) return isTechnician;
    if (stage === 3) return isTechnician || isLeader;
    if (stage === 5) return isCS;
    return false;
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
              caseData.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {caseData.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Client:</span>
            <span className="font-medium">{caseData.client.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Priority:</span>
            <span className={`font-medium ${
              caseData.priority === 'high' ? 'text-red-600' :
              caseData.priority === 'medium' ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
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
        <div className="mt-6 flex items-center gap-2">
          {STAGES.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s.num < caseData.current_stage ? 'bg-green-500 text-white' :
                s.num === caseData.current_stage ? 'bg-[#0d9488] text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {s.num < caseData.current_stage ? <Check className="w-4 h-4" /> : s.num}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-12 h-1 ${s.num < caseData.current_stage ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
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
          canEdit={canEditStage(stage.num)}
          isCS={isCS}
          isLeader={isLeader}
          technicians={technicians}
          editData={editData}
          setEditData={setEditData}
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
  canEdit: boolean;
  isCS: boolean;
  isLeader: boolean;
  technicians: { id: number; name: string }[];
  editData: Partial<CaseDetailType>;
  setEditData: (data: Partial<CaseDetailType>) => void;
  onUpdate: (data: Partial<CaseDetailType>) => void;
  onAdvance: () => void;
  onApproveCost: () => void;
  onRejectCost: () => void;
  onRedo: () => void;
}

function StageSection({
  stage, caseData, expanded, onToggle, canEdit, isCS, isLeader, technicians,
  editData, setEditData, onUpdate, onAdvance, onApproveCost, onRejectCost, onRedo
}: StageSectionProps) {
  const isCompleted = stage.num < caseData.current_stage;
  const isCurrent = stage.num === caseData.current_stage;

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
          {isCompleted && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Completed</span>}
          {isCurrent && <span className="text-xs text-[#0d9488] bg-teal-50 px-2 py-1 rounded">Current</span>}
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          {stage.num === 1 && (
            <Stage1Content
              caseData={caseData}
              canEdit={canEdit}
              isCS={isCS}
              technicians={technicians}
              onUpdate={onUpdate}
              onAdvance={onAdvance}
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
            />
          )}
          {stage.num === 3 && (
            <Stage3Content
              caseData={caseData}
              canEdit={canEdit}
              isLeader={isLeader}
              onUpdate={onUpdate}
              onAdvance={onAdvance}
              onApproveCost={onApproveCost}
              onRejectCost={onRejectCost}
            />
          )}
          {stage.num === 4 && (
            <Stage4Content
              caseData={caseData}
              canEdit={canEdit}
              onUpdate={onUpdate}
              onAdvance={onAdvance}
            />
          )}
          {stage.num === 5 && (
            <Stage5Content
              caseData={caseData}
              canEdit={canEdit}
              onUpdate={onUpdate}
              onRedo={onRedo}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Stage 1 - Input & Categorization
function Stage1Content({ caseData, canEdit, isCS, technicians, onUpdate, onAdvance }: any) {
  const [assignedTo, setAssignedTo] = useState(caseData.assigned_to?.id || '');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);

    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-500">Client</label>
          <p className="font-medium">{caseData.client.name}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Site</label>
          <p className="font-medium">{caseData.site.name} ({caseData.site.city})</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Contact Person</label>
          <p className="font-medium">{caseData.contact.name} - {caseData.contact.phone}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Case Type</label>
          <p className="font-medium capitalize">{caseData.case_type}</p>
        </div>
      </div>
      
      <div>
        <label className="text-sm text-gray-500">Description</label>
        <p className="mt-1">{caseData.description || '-'}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photos / Attachments</label>
        {canEdit ? (
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0d9488] cursor-pointer block mb-2">
            <input type="file" multiple className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            <span className="text-[#0d9488] font-medium">+ Upload</span>
          </label>
        ) : (
          <p className="text-gray-500 text-sm">No attachments</p>
        )}
        {previews.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-3">
            {previews.map((src, idx) => (
              <div key={idx} className="relative">
                <img src={src} alt={`Attach ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
              </div>
            ))}
          </div>
        )}
      </div>

      {isCS && (
        <div className="flex items-center gap-4 pt-4 border-t">
          <User className="w-5 h-5 text-gray-400" />
          <select
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
            className="input-field flex-1"
          >
            <option value="">Assign Technician...</option>
            {technicians.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={() => onUpdate({ assigned_to_id: Number(assignedTo) })}
            className="btn-primary"
            disabled={!assignedTo}
          >
            Assign
          </button>
        </div>
      )}

      {canEdit && caseData.assigned_to && (
        <button onClick={onAdvance} className="btn-accent">
          Proceed to Investigation →
        </button>
      )}
    </div>
  );
}

// Stage 2 - Site Investigation
function Stage2Content({ caseData, canEdit, onUpdate, onAdvance, isCS, isLeader }: any) {
  const [report, setReport] = useState(caseData.investigation_report || '');
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(caseData.investigation_checklist || '[]');
    } catch { return [false, false, false]; }
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const isCurrent = caseData.current_stage === 2;

  const checklistItems = ['Check furniture condition', 'Document damage areas', 'Take measurements'];

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviews(prev => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinish = () => {
    onUpdate({ investigation_report: report, investigation_checklist: JSON.stringify(checklist) });
    onAdvance();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Report</label>
        {canEdit ? (
          <textarea
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Photos / Attachments</label>
        {canEdit && (
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0d9488] cursor-pointer block mb-3">
            <input type="file" multiple className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            <span className="text-[#0d9488] font-medium">+ Upload</span>
          </label>
        )}
        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {previews.map((src, idx) => (
              <div key={idx} className="relative group">
                <img src={src} alt={`Upload ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                {canEdit && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!canEdit && previews.length === 0 && (
          <p className="text-gray-500 text-sm">No attachments</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
        <div className="space-y-2">
          {checklistItems.map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
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

      {canEdit && (
        <button onClick={handleFinish} className="btn-accent">
          Finish Investigation →
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
function Stage3Content({ caseData, canEdit, isLeader, onUpdate, onAdvance, onApproveCost, onRejectCost }: any) {
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const checklistItems = ['Prepare materials', 'Schedule with client'];

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviews(prev => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const canAdvance = !form.cost_required || caseData.cost_status === 'approved';

  const handleSubmit = () => {
    onUpdate({ ...form, solution_checklist: JSON.stringify(checklist) });
    onAdvance();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
        {canEdit ? (
          <textarea
            value={form.root_cause}
            onChange={e => setForm({ ...form, root_cause: e.target.value })}
            className="input-field h-24"
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.root_cause || '-'}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Solution Description</label>
        {canEdit ? (
          <textarea
            value={form.solution_description}
            onChange={e => setForm({ ...form, solution_description: e.target.value })}
            className="input-field h-24"
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.solution_description || '-'}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photos / Attachments</label>
        {canEdit && (
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0d9488] cursor-pointer block mb-3">
            <input type="file" multiple className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            <span className="text-[#0d9488] font-medium">+ Upload</span>
          </label>
        )}
        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {previews.map((src, idx) => (
              <div key={idx} className="relative group">
                <img src={src} alt={`Upload ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                {canEdit && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!canEdit && previews.length === 0 && (
          <p className="text-gray-500 text-sm">No attachments</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
        <div className="space-y-2">
          {checklistItems.map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Planned Execution Date</label>
        {canEdit ? (
          <input
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
        <label className="flex items-center gap-2 mb-3">
          <input
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
              <div>
                <label className="text-sm text-gray-600">Estimated Cost</label>
                {canEdit ? (
                  <input
                    type="number"
                    value={form.estimated_cost}
                    onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
                    className="input-field"
                  />
                ) : (
                  <p className="font-medium">{caseData.estimated_cost?.toLocaleString()} VND</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Cost Status</label>
                <p className={`font-medium ${
                  caseData.cost_status === 'approved' ? 'text-green-600' :
                  caseData.cost_status === 'rejected' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {caseData.cost_status || 'Pending'}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Cost Description</label>
              {canEdit ? (
                <textarea
                  value={form.cost_description}
                  onChange={e => setForm({ ...form, cost_description: e.target.value })}
                  className="input-field h-20"
                />
              ) : (
                <p>{caseData.cost_description || '-'}</p>
              )}
            </div>

            {isLeader && caseData.cost_status !== 'approved' && caseData.cost_status !== 'rejected' && (
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
          <button 
            onClick={() => {
              onUpdate({ ...form, solution_checklist: JSON.stringify(checklist) });
              alert('Plan saved successfully!');
            }} 
            className="btn-primary"
          >
            Save Plan
          </button>
          {canAdvance ? (
            <button onClick={handleSubmit} className="btn-accent">
              Submit & Proceed to Execution →
            </button>
          ) : form.cost_required && caseData.cost_status !== 'approved' && (
            <span className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-4 h-4" /> Save first, then wait for Leader approval
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Stage 4 - Execution
function Stage4Content({ caseData, canEdit, onUpdate, onAdvance }: any) {
  const [form, setForm] = useState({
    execution_report: caseData.execution_report || '',
    client_feedback: caseData.client_feedback || '',
    client_rating: caseData.client_rating || 5,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Execution Report</label>
        {canEdit ? (
          <textarea
            value={form.execution_report}
            onChange={e => setForm({ ...form, execution_report: e.target.value })}
            className="input-field h-32"
            placeholder="Document execution details..."
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.execution_report || '-'}</p>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3">Client Feedback</h4>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Rating</label>
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
            <label className="text-sm text-gray-600">Feedback</label>
            {canEdit ? (
              <textarea
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

      {canEdit && (
        <button 
          onClick={() => {
            onUpdate(form);
            onAdvance();
          }} 
          className="btn-accent"
        >
          Complete Execution →
        </button>
      )}
    </div>
  );
}

// Stage 5 - Closing
function Stage5Content({ caseData, canEdit, onUpdate, onRedo }: any) {
  const [form, setForm] = useState({
    cs_notes: caseData.cs_notes || '',
    final_feedback: caseData.final_feedback || '',
    final_rating: caseData.final_rating || 5,
  });

  const handleClose = () => {
    onUpdate({ ...form, status: 'closed' });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CS Notes</label>
        {canEdit ? (
          <textarea
            value={form.cs_notes}
            onChange={e => setForm({ ...form, cs_notes: e.target.value })}
            className="input-field h-24"
          />
        ) : (
          <p className="p-3 bg-gray-50 rounded-lg">{caseData.cs_notes || '-'}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Final Client Feedback</label>
        {canEdit ? (
          <textarea
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
          <p className="font-medium">{caseData.final_rating ? `${caseData.final_rating}/5` : '-'}</p>
        )}
      </div>

      {canEdit && caseData.status !== 'closed' && (
        <div className="flex gap-3">
          <button onClick={handleClose} className="btn-accent">
            Close Case ✓
          </button>
          <button onClick={onRedo} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
            Redo → Back to Stage 3
          </button>
        </div>
      )}

      {caseData.status === 'closed' && (
        <div className="p-4 bg-green-50 rounded-lg text-green-700 flex items-center gap-2">
          <Check className="w-5 h-5" /> Case has been closed successfully
        </div>
      )}
    </div>
  );
}


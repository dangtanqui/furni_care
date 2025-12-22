import api from './client';

export type CaseStatus = 'open' | 'in_progress' | 'pending' | 'completed' | 'closed' | 'cancelled' | 'rejected';
export type CasePriority = 'low' | 'medium' | 'high';
export type CostStatus = 'pending' | 'approved' | 'rejected' | null;
export type FinalCostStatus = 'pending' | 'approved' | 'rejected' | null;
export type CaseType = 'repair' | 'maintenance' | 'installation' | 'other';

export interface CaseListItem {
  id: number;
  case_number: string;
  client: string;
  site: string;
  current_stage: number;
  stage_name: string;
  status: CaseStatus;
  priority: CasePriority;
  assigned_to: string | null;
  created_at: string;
}

export interface CasesResponse {
  data: CaseListItem[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface CaseDetail {
  id: number;
  case_number: string;
  current_stage: number;
  stage_name: string;
  status: CaseStatus;
  attempt_number: number;
  client: { id: number; name: string };
  site: { id: number; name: string; city: string };
  contact: { id: number; name: string; phone: string };
  created_by: { id: number; name: string };
  assigned_to: { id: number; name: string } | null;
  assigned_to_id?: number; // For updates
  description: string;
  case_type: string;
  priority: CasePriority;
  investigation_report: string;
  investigation_checklist: string;
  root_cause: string;
  solution_description: string;
  solution_checklist: string;
  planned_execution_date: string;
  cost_required: boolean;
  estimated_cost: number;
  cost_description: string;
  cost_status: CostStatus;
  execution_report: string;
  execution_checklist: string;
  client_signature: string;
  client_feedback: string;
  client_rating: number;
  cs_notes: string;
  final_feedback: string;
  final_rating: number;
  final_cost: number | null;
  final_cost_status: FinalCostStatus;
  final_cost_approved_by: { id: number; name: string } | null;
  stage_attachments: Record<
    string,
    Array<{
      id: number;
      filename: string;
      url: string;
      stage: number;
      attachment_type: string;
    }>
  >;
  created_at: string;
  updated_at: string;
}

export interface CaseAttachmentItem {
  id: number;
  filename: string;
  url: string;
  stage: number;
  attachment_type: string;
}

export const getCases = (params?: Record<string, string>) =>
  api.get<CasesResponse>('/cases', { params });

export const getCase = (id: number) =>
  api.get<CaseDetail>(`/cases/${id}`);

export const createCase = (data: Partial<CaseDetail>) =>
  api.post<CaseDetail>('/cases', data);

export const updateCase = (id: number, data: Partial<CaseDetail>) =>
  api.patch<CaseDetail>(`/cases/${id}`, data);

export const advanceStage = (id: number) =>
  api.post<CaseDetail>(`/cases/${id}/advance_stage`);

export const approveCost = (id: number) =>
  api.post<CaseDetail>(`/cases/${id}/approve_cost`);

export const rejectCost = (id: number) =>
  api.post<CaseDetail>(`/cases/${id}/reject_cost`);

export const redoCase = (id: number) =>
  api.post<CaseDetail>(`/cases/${id}/redo_case`);

export const cancelCase = (id: number) =>
  api.post<CaseDetail>(`/cases/${id}/cancel_case`);

export const approveFinalCost = (id: number) =>
  api.post<CaseDetail>(`/cases/${id}/approve_final_cost`);

export const rejectFinalCost = (id: number) =>
  api.post<CaseDetail>(`/cases/${id}/reject_final_cost`);

export const deleteCaseAttachment = (caseId: number, attachmentId: number) =>
  api.delete(`/cases/${caseId}/case_attachments/${attachmentId}`);

export const uploadAttachments = (
  id: number,
  stage: number,
  files: File[],
  attachmentType?: string
) => {
  const form = new FormData();
  form.append('stage', String(stage));
  if (attachmentType) form.append('attachment_type', attachmentType);
  files.forEach(file => form.append('files[]', file));
  return api.post(`/cases/${id}/attachments`, form);
};


import api from './client';

export interface CaseListItem {
  id: number;
  case_number: string;
  client: string;
  site: string;
  current_stage: number;
  stage_name: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
}

export interface CaseDetail {
  id: number;
  case_number: string;
  current_stage: number;
  stage_name: string;
  status: string;
  attempt_number: number;
  client: { id: number; name: string };
  site: { id: number; name: string; city: string };
  contact: { id: number; name: string; phone: string };
  created_by: { id: number; name: string };
  assigned_to: { id: number; name: string } | null;
  description: string;
  case_type: string;
  priority: string;
  investigation_report: string;
  investigation_checklist: string;
  root_cause: string;
  solution_description: string;
  solution_checklist: string;
  planned_execution_date: string;
  cost_required: boolean;
  estimated_cost: number;
  cost_description: string;
  cost_status: string;
  execution_report: string;
  execution_checklist: string;
  client_signature: string;
  client_feedback: string;
  client_rating: number;
  cs_notes: string;
  final_feedback: string;
  final_rating: number;
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
  api.get<CaseListItem[]>('/cases', { params });

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


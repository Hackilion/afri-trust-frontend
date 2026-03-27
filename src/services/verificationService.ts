import { apiFetch } from '../lib/apiClient';
import { isLiveApi } from '../lib/apiConfig';
import { backendGetVerificationDetail } from './backendApplicantsService';
import type { VerificationSession } from '../types';

type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type VerificationListRow = {
  id: string;
  applicant_id: string;
  workflow_id: string;
  status: string;
  result: string;
  current_step_order: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type VerificationCreateOut = {
  id: string;
  org_id: string;
  applicant_id: string;
  workflow_id: string;
  workflow_version: number;
  current_step_order: number;
  status: string;
  result: string;
  created_at: string;
  updated_at: string;
};

/** `GET /v1/verifications` (KYC data registry) — paginated org sessions. */
export async function listVerifications(params: {
  applicant_id?: string;
  workflow_id?: string;
  status?: string;
  result?: string;
  page?: number;
  page_size?: number;
}): Promise<Page<VerificationListRow>> {
  if (!isLiveApi()) {
    return { items: [], total: 0, page: 1, page_size: 25, pages: 0 };
  }
  const q = new URLSearchParams();
  if (params.applicant_id) q.set('applicant_id', params.applicant_id);
  if (params.workflow_id) q.set('workflow_id', params.workflow_id);
  if (params.status) q.set('status', params.status);
  if (params.result) q.set('result', params.result);
  q.set('page', String(params.page ?? 1));
  q.set('page_size', String(params.page_size ?? 25));
  return apiFetch<Page<VerificationListRow>>(`/v1/verifications?${q.toString()}`);
}

/** `POST /v1/verifications` — then loads full detail for steps. */
export async function createVerificationSession(
  applicantId: string,
  workflowId: string
): Promise<VerificationSession> {
  if (!isLiveApi()) {
    throw new Error('Create verification requires the live API.');
  }
  const created = await apiFetch<VerificationCreateOut>('/v1/verifications', {
    method: 'POST',
    body: JSON.stringify({
      applicant_id: applicantId,
      workflow_id: workflowId,
    }),
  });
  const full = await backendGetVerificationDetail(String(created.id));
  if (!full) throw new Error('Session created but could not load verification detail.');
  return full;
}

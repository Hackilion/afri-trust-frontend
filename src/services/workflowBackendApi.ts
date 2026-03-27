/**
 * Raw AfriTrust API types (snake_case) for workflows and tier profiles.
 */
import { apiFetch } from '../lib/apiClient';

// ── Tier profiles ─────────────────────────────────────────────────────────────

export type BackendAttributeSchemaRow = {
  key: string;
  label: string;
  data_type: string;
  required?: boolean;
  description?: string | null;
  options?: string[] | null;
};

export type BackendTierProfile = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  required_checks: string[];
  attribute_schema: BackendAttributeSchemaRow[];
  accepted_document_types: string[];
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BackendCheckCatalogue = {
  check_types: { value: string; label: string }[];
  document_types: { value: string; label: string }[];
  attribute_data_types: { value: string; label: string }[];
};

/** Active-only vs full org list (one round-trip when includeInactive is true). */
export async function apiListTierProfiles(options: {
  includeInactive: boolean;
}): Promise<BackendTierProfile[]> {
  const q = options.includeInactive ? '?include_inactive=true' : '?is_active=true';
  return apiFetch<BackendTierProfile[]>(`/v1/tier-profiles${q}`);
}

export async function apiGetTierProfile(id: string): Promise<BackendTierProfile> {
  return apiFetch<BackendTierProfile>(`/v1/tier-profiles/${id}`);
}

export async function apiCreateTierProfile(body: {
  name: string;
  description?: string | null;
  required_checks: string[];
  attribute_schema: BackendAttributeSchemaRow[];
  accepted_document_types: string[];
  settings: Record<string, unknown>;
}): Promise<BackendTierProfile> {
  return apiFetch<BackendTierProfile>('/v1/tier-profiles', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiUpdateTierProfile(
  id: string,
  body: {
    name?: string | null;
    description?: string | null;
    required_checks?: string[];
    attribute_schema?: BackendAttributeSchemaRow[];
    accepted_document_types?: string[];
    settings?: Record<string, unknown>;
  }
): Promise<BackendTierProfile> {
  return apiFetch<BackendTierProfile>(`/v1/tier-profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiArchiveTierProfile(id: string): Promise<void> {
  await apiFetch<{ detail?: string }>(`/v1/tier-profiles/${id}`, { method: 'DELETE' });
}

export async function apiCheckCatalogue(): Promise<BackendCheckCatalogue> {
  return apiFetch<BackendCheckCatalogue>('/v1/tier-profiles/check-catalogue');
}

// ── Workflows ─────────────────────────────────────────────────────────────────

export type BackendWorkflowStep = {
  id: string;
  workflow_id: string;
  tier_profile_id: string;
  tier_profile_name: string | null;
  step_order: number;
  is_optional: boolean;
  created_at: string;
};

export type BackendWorkflowListItem = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: string;
  version: number;
  step_count: number;
  published_at: string | null;
  created_at: string;
};

export type BackendWorkflowDetail = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: string;
  version: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  steps: BackendWorkflowStep[];
};

export async function apiListWorkflows(status?: string): Promise<BackendWorkflowListItem[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<BackendWorkflowListItem[]>(`/v1/workflows${q}`);
}

export async function apiGetWorkflow(id: string): Promise<BackendWorkflowDetail> {
  return apiFetch<BackendWorkflowDetail>(`/v1/workflows/${id}`);
}

export async function apiCreateWorkflow(body: {
  name: string;
  description?: string | null;
}): Promise<BackendWorkflowDetail> {
  return apiFetch<BackendWorkflowDetail>('/v1/workflows', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiUpdateWorkflow(
  id: string,
  body: { name?: string | null; description?: string | null }
): Promise<BackendWorkflowDetail> {
  return apiFetch<BackendWorkflowDetail>(`/v1/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiPublishWorkflow(id: string): Promise<BackendWorkflowDetail> {
  return apiFetch<BackendWorkflowDetail>(`/v1/workflows/${id}/publish`, { method: 'POST' });
}

export async function apiArchiveWorkflow(id: string): Promise<BackendWorkflowDetail> {
  return apiFetch<BackendWorkflowDetail>(`/v1/workflows/${id}/archive`, { method: 'POST' });
}

export async function apiCloneWorkflow(id: string): Promise<BackendWorkflowDetail> {
  return apiFetch<BackendWorkflowDetail>(`/v1/workflows/${id}/clone`, { method: 'POST' });
}

export async function apiAddWorkflowStep(
  workflowId: string,
  body: { tier_profile_id: string; step_order: number; is_optional: boolean }
): Promise<BackendWorkflowStep> {
  return apiFetch<BackendWorkflowStep>(`/v1/workflows/${workflowId}/steps`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiRemoveWorkflowStep(workflowId: string, stepId: string): Promise<void> {
  await apiFetch<{ detail?: string }>(`/v1/workflows/${workflowId}/steps/${stepId}`, {
    method: 'DELETE',
  });
}

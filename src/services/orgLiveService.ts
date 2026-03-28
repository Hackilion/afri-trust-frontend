import { apiFetch } from '../lib/apiClient';
import type { TeamMember, TeamRole } from '../types';

type OrgUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  email_verified: boolean;
  invite_pending: boolean;
  created_at: string;
  updated_at: string;
};

type BrandingApi = {
  primary_color: string;
  accent_color: string;
  logo_url: string;
  tagline: string;
};

export type OrgSettingsApi = {
  org_id: string;
  org_name: string;
  branding: BrandingApi;
};

export type OrgInviteResponse = {
  user_id: string;
  email: string;
  role: string;
  invite_token: string;
  invite_expires_at: string;
  join_link: string;
};

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'User';
  const parts = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') || 'User';
}

function mapTeamMember(row: OrgUserRow, organizationId: string): TeamMember {
  const r = row.role as TeamRole;
  const roleOk: TeamRole =
    r === 'owner' || r === 'admin' || r === 'reviewer' || r === 'viewer' ? r : 'viewer';
  return {
    id: String(row.id),
    name: row.display_name?.trim() || nameFromEmail(row.email),
    email: row.email,
    role: roleOk,
    status: row.invite_pending ? 'invited' : 'active',
    invitedAt: row.created_at,
    lastActiveAt: undefined,
    organizationId,
  };
}

export async function apiListOrgUsers(organizationId: string): Promise<TeamMember[]> {
  const rows = await apiFetch<OrgUserRow[]>('/v1/org/users');
  return (rows ?? []).map(r => mapTeamMember(r, organizationId));
}

export async function apiInviteOrgUser(email: string, role: TeamRole): Promise<OrgInviteResponse> {
  const bodyRole =
    role === 'owner' ? 'admin' : role === 'admin' || role === 'reviewer' || role === 'viewer' ? role : 'reviewer';
  return apiFetch<OrgInviteResponse>('/v1/org/users/invite', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), role: bodyRole }),
  });
}

export async function apiRemoveOrgUser(userId: string): Promise<void> {
  await apiFetch<{ detail?: string }>(`/v1/org/users/${userId}`, { method: 'DELETE' });
}

export async function apiPatchOrgUserRole(
  userId: string,
  role: TeamRole,
  organizationId: string
): Promise<TeamMember> {
  const row = await apiFetch<OrgUserRow>(`/v1/org/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return mapTeamMember(row, organizationId);
}

export async function apiGetOrgSettings(): Promise<OrgSettingsApi> {
  return apiFetch<OrgSettingsApi>('/v1/org/settings');
}

export async function apiPatchOrgSettings(branding: {
  primary_color?: string;
  accent_color?: string;
  logo_url?: string;
  tagline?: string;
}): Promise<OrgSettingsApi> {
  return apiFetch<OrgSettingsApi>('/v1/org/settings', {
    method: 'PATCH',
    body: JSON.stringify({ branding }),
  });
}

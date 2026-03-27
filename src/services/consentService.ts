import { isLiveApi } from '../lib/apiConfig';
import { apiFetch } from '../lib/apiClient';
import { mockConsentGrants } from '../mocks/consent';
import type { ConsentAttribute, ConsentGrant } from '../types';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

type ConsentGrantOut = {
  id: string;
  applicant_id: string;
  session_id: string;
  granted_attributes: string[];
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  applicant_full_name?: string | null;
  verification_token?: string | null;
};

function mapLiveConsent(row: ConsentGrantOut): ConsentGrant {
  const sid = String(row.session_id);
  const short = sid.length > 12 ? `${sid.slice(0, 8)}…` : sid;
  const expires = new Date(row.expires_at);
  const revoked = !!row.revoked_at;
  const expired = !revoked && expires < new Date();
  const displayName = row.applicant_full_name?.trim();
  return {
    id: String(row.id),
    applicantId: String(row.applicant_id),
    grantedAttributes: row.granted_attributes as ConsentAttribute[],
    grantedTo: displayName ? `${displayName} · ${short}` : `Verification session ${short}`,
    grantedToDescription: 'Data sharing consent from verification flow',
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at ?? undefined,
    isActive: !revoked && !expired,
    createdAt: row.created_at,
  };
}

export async function getConsentsByApplicant(applicantId: string): Promise<ConsentGrant[]> {
  if (isLiveApi()) {
    const rows = await apiFetch<ConsentGrantOut[]>(`/v1/applicants/${applicantId}/consents`);
    return rows.map(mapLiveConsent);
  }
  await delay();
  return mockConsentGrants.filter(c => c.applicantId === applicantId);
}

export async function getAllConsents(activeOnly = false): Promise<ConsentGrant[]> {
  if (isLiveApi()) {
    const rows = await apiFetch<ConsentGrantOut[]>(`/v1/consents?active_only=${activeOnly ? 'true' : 'false'}`);
    return rows.map(mapLiveConsent);
  }
  await delay();
  return activeOnly ? mockConsentGrants.filter(c => c.isActive) : [...mockConsentGrants];
}

export type GrantConsentSessionBody = {
  granted_attributes: string[];
  expires_in_days: number;
};

/** POST /v1/verifications/{sessionId}/consent — returns a one-time style verification token for identity API. */
export async function grantConsentForSession(
  sessionId: string,
  body: GrantConsentSessionBody
): Promise<{ grant: ConsentGrant; verificationToken: string }> {
  if (!isLiveApi()) {
    throw new Error('Grant consent requires the live API (disable mock mode).');
  }
  const row = await apiFetch<ConsentGrantOut>(`/v1/verifications/${sessionId}/consent`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    grant: mapLiveConsent(row),
    verificationToken: row.verification_token ?? '',
  };
}

/** GET /v1/identities/{applicantId} — attributes must intersect granted_attributes on the token. */
export async function fetchIdentityAttributes(
  applicantId: string,
  attributes: string[],
  verificationToken: string
): Promise<Record<string, unknown>> {
  if (!isLiveApi()) {
    throw new Error('Identity API requires the live API (disable mock mode).');
  }
  const params = new URLSearchParams({
    attributes: attributes.join(','),
    verification_token: verificationToken,
  });
  const out = await apiFetch<{ attributes: Record<string, unknown> }>(
    `/v1/identities/${applicantId}?${params.toString()}`
  );
  return out.attributes ?? {};
}

export async function revokeConsent(applicantId: string, consentId: string): Promise<void> {
  if (isLiveApi()) {
    await apiFetch<{ detail?: string }>(
      `/v1/applicants/${applicantId}/consents/${consentId}/revoke`,
      { method: 'POST' }
    );
    return;
  }
  await delay();
  const idx = mockConsentGrants.findIndex(c => c.id === consentId);
  if (idx === -1) throw new Error('Consent grant not found');
  mockConsentGrants[idx] = {
    ...mockConsentGrants[idx],
    isActive: false,
    revokedAt: new Date().toISOString(),
  };
}

export async function createConsent(
  data: Pick<ConsentGrant, 'applicantId' | 'grantedAttributes' | 'grantedTo' | 'grantedToDescription' | 'expiresAt'>
): Promise<ConsentGrant> {
  if (isLiveApi()) {
    throw new Error('Manual consent creation is not available via API — consents are created from verification sessions.');
  }
  await delay();
  const next: ConsentGrant = {
    ...data,
    id: `CG-${String(mockConsentGrants.length + 1).padStart(3, '0')}`,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  mockConsentGrants.push(next);
  return next;
}

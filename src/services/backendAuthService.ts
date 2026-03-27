import { COMPANY_ARCHETYPES } from '../lib/africanMarkets';
import { apiFetch } from '../lib/apiClient';
import type { CompanyOnboardingDraft } from '../types/companyOnboarding';
import type { OrgBranding, WorkspaceUser } from '../types/rbac';
import type { TeamRole } from '../types/settings';

type LoginBody = { email: string; password: string };
type LoginResponse = { access_token: string; refresh_token: string; token_type?: string };

export type BackendRegisterBody = {
  email: string;
  password: string;
  org_name: string;
  legal_name?: string | null;
  country?: string | null;
  industry?: string | null;
};

export type BackendRegisterResponse = {
  org_id: string;
  user_id: string;
  message: string;
  verification_email_sent?: boolean;
  email_verify_token?: string | null;
  email_verify_otp?: string | null;
  /** Open in browser: verify page with token query (PUBLIC_APP_URL on the API). */
  email_verify_link?: string | null;
};

export type BackendResendVerificationResponse = {
  detail: string;
  email_verify_token?: string | null;
  email_verify_otp?: string | null;
  email_verify_link?: string | null;
};

/** Mirrors AfriTrust backend password rules (`RegisterRequest`). */
export function validateBackendRegisterPassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least one digit';
  return null;
}
type BrandingApi = {
  primary_color: string;
  accent_color: string;
  logo_url: string;
  tagline: string;
};

type UserProfile = {
  id: string;
  org_id: string;
  email: string;
  role: string;
  email_verified: boolean;
  org_name: string;
  org_plan: string;
  display_name?: string | null;
  branding?: BrandingApi | null;
};

function mapBranding(b: BrandingApi | null | undefined): OrgBranding | null {
  if (!b) return null;
  return {
    primaryColor: b.primary_color,
    accentColor: b.accent_color,
    logoUrl: b.logo_url ?? '',
    tagline: b.tagline ?? '',
  };
}

function asTeamRole(r: string): TeamRole {
  if (r === 'owner' || r === 'admin' || r === 'reviewer' || r === 'viewer') return r;
  return 'viewer';
}

function displayNameFromEmail(email: string): { name: string; initials: string } {
  const local = email.split('@')[0] ?? 'User';
  const parts = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
  const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') || 'User';
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : local.slice(0, 2).toUpperCase();
  return { name, initials };
}

export function profileToWorkspaceUser(p: UserProfile): WorkspaceUser {
  const fromEmail = displayNameFromEmail(p.email);
  const display = p.display_name?.trim();
  const name = display || fromEmail.name;
  const initials = display
    ? (display
        .split(/\s+/)
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || fromEmail.initials)
    : fromEmail.initials;
  return {
    id: String(p.id),
    email: p.email,
    name,
    initials,
    orgId: String(p.org_id),
    orgRole: asTeamRole(p.role),
    orgDisplayName: p.org_name,
    orgBranding: mapBranding(p.branding ?? undefined),
  };
}

export async function backendRegister(body: BackendRegisterBody): Promise<BackendRegisterResponse> {
  return apiFetch<BackendRegisterResponse>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      org_name: body.org_name.trim(),
      legal_name: body.legal_name?.trim() || undefined,
      country: body.country?.trim() || undefined,
      industry: body.industry?.trim() || undefined,
    }),
    skipAuth: true,
  });
}

/**
 * Map company onboarding draft to `POST /v1/auth/register` body (AfriTrust backend).
 * `org_name` uses trading name, then legal name; `industry` uses the selected archetype label.
 */
export function companyDraftToRegisterBody(
  email: string,
  password: string,
  draft: CompanyOnboardingDraft
): BackendRegisterBody {
  const org_name = draft.tradingName.trim() || draft.legalName.trim();
  if (org_name.length < 2) {
    throw new Error('Add an organisation or trading name (at least 2 characters).');
  }
  const legal_name = draft.legalName.trim() || undefined;
  const country = draft.primaryCountryCode.trim() || undefined;
  const arch = COMPANY_ARCHETYPES.find(a => a.id === draft.archetypeId);
  const industry = arch?.label;
  return {
    email: email.trim(),
    password,
    org_name,
    legal_name,
    country,
    industry,
  };
}

export async function backendVerifyEmail(
  params: { token: string } | { email: string; otp: string }
): Promise<void> {
  const body =
    'token' in params
      ? { token: params.token.trim() }
      : {
          email: params.email.trim(),
          otp: params.otp.replace(/\D/g, '').slice(0, 6),
        };
  await apiFetch<{ detail?: string }>('/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
}

export async function backendResendVerification(
  email: string
): Promise<BackendResendVerificationResponse> {
  return apiFetch<BackendResendVerificationResponse>('/v1/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
    skipAuth: true,
  });
}

export async function backendLogin(body: LoginBody): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
}

export async function backendFetchMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/v1/auth/me');
}

export type AcceptInviteResponse = {
  user_id: string;
  org_id: string;
  message: string;
};

export async function backendAcceptInvite(body: {
  token: string;
  password: string;
  display_name?: string | null;
}): Promise<AcceptInviteResponse> {
  return apiFetch<AcceptInviteResponse>('/v1/auth/accept-invite', {
    method: 'POST',
    body: JSON.stringify({
      token: body.token.trim(),
      password: body.password,
      display_name: body.display_name?.trim() || undefined,
    }),
    skipAuth: true,
  });
}

/** Refresh session user from `/v1/auth/me` (e.g. after updating org branding). */
export async function refreshWorkspaceUserFromApi(): Promise<void> {
  const me = await backendFetchMe();
  const { useSessionStore } = await import('../store/sessionStore');
  useSessionStore.getState().setUser(profileToWorkspaceUser(me));
}

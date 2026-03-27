import type { WorkspaceUser } from '../types/rbac';

/** Demo accounts — password is ignored; any non-empty password works on Login. */
export const DEMO_EMAIL_TO_USER: Record<string, WorkspaceUser> = {
  'platform@afritrust.io': {
    id: 'u-platform',
    email: 'platform@afritrust.io',
    name: 'Amina Bello',
    initials: 'AB',
    platformRole: 'super_admin',
    orgId: null,
    orgRole: null,
  },
  'owner@demo.com': {
    id: 'u-owner-gh',
    email: 'owner@demo.com',
    name: 'Sarah Osei',
    initials: 'SO',
    orgId: 'org-gh-bank',
    orgRole: 'owner',
  },
  'admin@demo.com': {
    id: 'u-admin-gh',
    email: 'admin@demo.com',
    name: 'Kweku Amponsah',
    initials: 'KA',
    orgId: 'org-gh-bank',
    orgRole: 'admin',
  },
  'reviewer@demo.com': {
    id: 'u-reviewer-gh',
    email: 'reviewer@demo.com',
    name: 'Amara Diallo',
    initials: 'AD',
    orgId: 'org-gh-bank',
    orgRole: 'reviewer',
  },
  'viewer@demo.com': {
    id: 'u-viewer-gh',
    email: 'viewer@demo.com',
    name: 'Ngozi Williams',
    initials: 'NW',
    orgId: 'org-gh-bank',
    orgRole: 'viewer',
  },
  'owner@nairobi.demo': {
    id: 'u-owner-nrb',
    email: 'owner@nairobi.demo',
    name: 'James Otieno',
    initials: 'JO',
    orgId: 'org-nairobi-pay',
    orgRole: 'owner',
  },
  /** Matches Register “Fill demo values” */
  'admin@afritrust-demo.com': {
    id: 'u-demo-signup',
    email: 'admin@afritrust-demo.com',
    name: 'Sarah Osei',
    initials: 'SO',
    orgId: 'org-gh-bank',
    orgRole: 'owner',
  },
};

export function resolveWorkspaceUserFromEmail(email: string): WorkspaceUser | null {
  const key = email.trim().toLowerCase();
  return DEMO_EMAIL_TO_USER[key] ?? null;
}

export const DEMO_LOGIN_HINTS = [
  { email: 'platform@afritrust.io', label: 'Super admin', desc: 'Cross-tenant platform console' },
  { email: 'owner@demo.com', label: 'Org owner', desc: 'Ghana Commerce Bank — full access' },
  { email: 'admin@demo.com', label: 'Org admin', desc: 'Integrations & team, no owner-only billing' },
  { email: 'reviewer@demo.com', label: 'Reviewer', desc: 'Decisioning — no API keys' },
  { email: 'viewer@demo.com', label: 'Viewer', desc: 'Read-only workspace' },
  { email: 'owner@nairobi.demo', label: 'Other tenant', desc: 'Nairobi Pay Ltd' },
] as const;

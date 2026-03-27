import type { TeamRole } from '../types/settings';
import type { WorkspaceUser } from '../types/rbac';

export type Capability =
  | 'nav.dashboard'
  | 'nav.assistant'
  | 'nav.company_setup'
  | 'nav.applicants'
  | 'nav.workflows'
  | 'nav.audit'
  | 'nav.settings'
  | 'nav.platform'
  | 'nav.platform_orgs'
  | 'nav.platform_users'
  | 'applicants.read'
  | 'applicants.write'
  | 'workflows.read'
  | 'workflows.write'
  | 'audit.read'
  | 'settings.api_keys'
  | 'settings.webhooks'
  | 'settings.team'
  | 'settings.team.invite'
  | 'settings.team.remove'
  | 'settings.appearance'
  | 'settings.appearance.edit'
  | 'settings.tier_profiles'
  | 'settings.check_catalogue'
  | 'settings.integration_demo'
  | 'settings.consent_identity';

const TENANT_READ_ROLES: TeamRole[] = ['owner', 'admin', 'reviewer', 'viewer'];
const TENANT_REVIEW_ROLES: TeamRole[] = ['owner', 'admin', 'reviewer'];
const TENANT_ADMIN_ROLES: TeamRole[] = ['owner', 'admin'];

function roleAllows(role: TeamRole | null, allowed: TeamRole[]): boolean {
  return role != null && allowed.includes(role);
}

/**
 * Effective tenant org for API/UI scope: impersonation for super-admins, else user's org.
 */
export function getWorkspaceOrgId(user: WorkspaceUser | null, impersonatedOrgId: string | null): string | null {
  if (!user) return null;
  if (user.platformRole === 'super_admin') return impersonatedOrgId;
  return user.orgId;
}

/**
 * Role used for tenant ACLs. Super-admin in an impersonated org is treated as admin-level access.
 */
export function getEffectiveTenantRole(user: WorkspaceUser | null, workspaceOrgId: string | null): TeamRole | null {
  if (!user || !workspaceOrgId) return null;
  if (user.platformRole === 'super_admin') return 'admin';
  if (user.orgId === workspaceOrgId) return user.orgRole;
  return null;
}

export function getCapabilities(user: WorkspaceUser | null, impersonatedOrgId: string | null): Record<Capability, boolean> {
  const isSuper = user?.platformRole === 'super_admin';
  const workspaceOrgId = getWorkspaceOrgId(user, impersonatedOrgId);
  const inTenant = Boolean(workspaceOrgId);
  const role = getEffectiveTenantRole(user, workspaceOrgId);

  const c = (v: boolean) => v;

  return {
    'nav.dashboard': Boolean(user && (inTenant || isSuper)),
    'nav.assistant': c(
      Boolean(user) && (Boolean(isSuper) || (inTenant && roleAllows(role, TENANT_READ_ROLES)))
    ),
    'nav.company_setup': c(inTenant && roleAllows(role, TENANT_ADMIN_ROLES)),
    'nav.applicants': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
    'nav.workflows': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
    'nav.audit': c(inTenant && roleAllows(role, TENANT_REVIEW_ROLES)),
    'nav.settings': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
    'nav.platform': c(Boolean(isSuper)),
    'nav.platform_orgs': c(Boolean(isSuper)),
    'nav.platform_users': c(Boolean(isSuper)),

    'applicants.read': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
    'applicants.write': c(inTenant && roleAllows(role, TENANT_REVIEW_ROLES)),
    'workflows.read': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
    'workflows.write': c(inTenant && roleAllows(role, TENANT_ADMIN_ROLES)),
    'audit.read': c(inTenant && roleAllows(role, TENANT_REVIEW_ROLES)),

    'settings.api_keys': c(inTenant && roleAllows(role, TENANT_ADMIN_ROLES)),
    'settings.webhooks': c(inTenant && roleAllows(role, TENANT_ADMIN_ROLES)),
    'settings.team': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
    'settings.team.invite': c(inTenant && roleAllows(role, TENANT_ADMIN_ROLES)),
    'settings.team.remove': c(inTenant && roleAllows(role, TENANT_ADMIN_ROLES)),
    'settings.appearance': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
    'settings.appearance.edit': c(inTenant && roleAllows(role, TENANT_ADMIN_ROLES)),
    'settings.tier_profiles': c(inTenant && roleAllows(role, TENANT_ADMIN_ROLES)),
    'settings.check_catalogue': c(inTenant && roleAllows(role, [...TENANT_ADMIN_ROLES, 'reviewer'])),
    'settings.integration_demo': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
    'settings.consent_identity': c(inTenant && roleAllows(role, TENANT_READ_ROLES)),
  };
}

export function can(user: WorkspaceUser | null, impersonatedOrgId: string | null, cap: Capability): boolean {
  return getCapabilities(user, impersonatedOrgId)[cap];
}

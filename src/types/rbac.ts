import type { TeamRole } from './settings';

export type PlatformRole = 'super_admin';

/** Logged-in identity: either a tenant member or a platform operator (or both in future). */
export type WorkspaceUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  /** AfriTrust staff — cross-tenant console */
  platformRole?: PlatformRole;
  /** Current employer / tenant; null for platform-only operators */
  orgId: string | null;
  orgRole: TeamRole | null;
};

export type OrganizationStatus = 'active' | 'trial' | 'suspended';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: OrganizationStatus;
  region: string;
  createdAt: string;
  memberCount: number;
  applicantsThisMonth: number;
};

/** Row in the platform user directory (may span orgs). */
export type PlatformUserRecord = {
  id: string;
  name: string;
  email: string;
  orgId: string | null;
  orgName: string | null;
  orgRole: TeamRole | null;
  platformRole?: PlatformRole;
  status: 'active' | 'invited' | 'suspended';
  lastActiveAt?: string;
  createdAt: string;
};

import { mockOrganizations } from '../mocks/organizations';
import { mockTeam } from '../mocks/settings';
import type { Organization, PlatformUserRecord } from '../types/rbac';
import type { TeamRole } from '../types/settings';

const delay = (ms = 350) => new Promise(res => setTimeout(res, ms));

function orgName(id: string | null): string | null {
  if (!id) return null;
  return mockOrganizations.find(o => o.id === id)?.name ?? id;
}

function buildDirectory(): PlatformUserRecord[] {
  const fromTeam: PlatformUserRecord[] = mockTeam.map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    orgId: m.organizationId,
    orgName: orgName(m.organizationId),
    orgRole: m.organizationId ? m.role : null,
    status: m.status,
    lastActiveAt: m.lastActiveAt,
    createdAt: m.invitedAt,
  }));
  const platform: PlatformUserRecord = {
    id: 'u-platform',
    name: 'Amina Bello',
    email: 'platform@afritrust.io',
    orgId: null,
    orgName: null,
    orgRole: null,
    platformRole: 'super_admin',
    status: 'active',
    lastActiveAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
  };
  const merged = [platform, ...fromTeam.filter(t => t.email !== platform.email)];
  return merged;
}

let directoryCache: PlatformUserRecord[] = buildDirectory();

export async function getOrganizations(): Promise<Organization[]> {
  await delay();
  return [...mockOrganizations].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlatformUserDirectory(): Promise<PlatformUserRecord[]> {
  await delay();
  directoryCache = buildDirectory();
  return [...directoryCache];
}

function recalcOrgMemberCounts() {
  for (const org of mockOrganizations) {
    org.memberCount = mockTeam.filter(x => x.organizationId === org.id).length;
  }
}

export async function updatePlatformUser(
  userId: string,
  patch: Partial<Pick<PlatformUserRecord, 'orgId' | 'orgRole' | 'status'>>
): Promise<void> {
  await delay();
  if (userId === 'u-platform') {
    throw new Error('Cannot reassign platform super admin from this screen.');
  }
  const tm = mockTeam.find(m => m.id === userId);
  if (!tm) throw new Error('User not found');
  if (patch.orgId !== undefined) {
    tm.organizationId = patch.orgId;
    if (!patch.orgId) tm.role = 'viewer';
  }
  if (patch.orgRole !== undefined && tm.organizationId) tm.role = patch.orgRole as TeamRole;
  if (patch.status !== undefined) tm.status = patch.status;
  recalcOrgMemberCounts();
}

export async function getPlatformStats(): Promise<{
  organizationCount: number;
  activeUsers: number;
  applicantsThisMonth: number;
  trialOrgs: number;
}> {
  await delay(200);
  const orgs = mockOrganizations;
  return {
    organizationCount: orgs.length,
    activeUsers: mockTeam.filter(m => m.status === 'active').length + 1,
    applicantsThisMonth: orgs.reduce((s, o) => s + o.applicantsThisMonth, 0),
    trialOrgs: orgs.filter(o => o.status === 'trial').length,
  };
}

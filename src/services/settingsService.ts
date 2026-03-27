import { isLiveApi } from '../lib/apiConfig';
import { mockApiKeys, mockWebhooks, mockTeam, mockComplianceTiers } from '../mocks/settings';
import type { ApiKey, ApiKeyEnvironment, ApiKeyPermission, Webhook, WebhookEvent, TeamRole } from '../types';
import * as apiKeyLive from './apiKeyLiveService';
import * as orgLive from './orgLiveService';
import * as webhookLive from './webhookLiveService';

export type { WebhookDeliveryRow } from './webhookLiveService';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export async function getApiKeys(env?: ApiKeyEnvironment) {
  if (isLiveApi()) {
    const list = await apiKeyLive.apiListApiKeys();
    if (!env) return list;
    return env === 'live' ? list : [];
  }
  await delay();
  return env ? mockApiKeys.filter(k => k.environment === env) : [...mockApiKeys];
}

export async function createApiKey(
  name: string,
  env: ApiKeyEnvironment,
  permissions: ApiKeyPermission[]
): Promise<{ key: ApiKey; fullKey: string }> {
  if (isLiveApi()) {
    return apiKeyLive.apiCreateApiKey(name, permissions);
  }
  await delay();
  const fullKey = `aft_${env}_sk_${Math.random().toString(36).slice(2, 18)}`;
  const newKey: ApiKey = {
    id: `KEY-${Date.now()}`,
    name,
    prefix: `${fullKey.slice(0, 20)}...`,
    environment: env,
    status: 'active',
    permissions,
    createdAt: new Date().toISOString(),
    createdBy: 'Sarah Osei',
  };
  mockApiKeys.push(newKey);
  return { key: newKey, fullKey };
}

export async function revokeApiKey(id: string): Promise<void> {
  if (isLiveApi()) {
    return apiKeyLive.apiRevokeApiKey(id);
  }
  await delay();
  const key = mockApiKeys.find(k => k.id === id);
  if (key) key.status = 'revoked';
}

export async function getWebhooks() {
  if (isLiveApi()) return webhookLive.apiListWebhooks();
  await delay();
  return [...mockWebhooks];
}

export async function createWebhook(
  url: string,
  events: WebhookEvent[]
): Promise<{ webhook: Webhook; signingSecret?: string }> {
  if (isLiveApi()) {
    const { webhook, signingSecret } = await webhookLive.apiCreateWebhook(url, events);
    return { webhook, signingSecret };
  }
  await delay();
  const wh: Webhook = {
    id: `WH-${Date.now()}`,
    url,
    events,
    status: 'active',
    secret: `whsec_${Math.random().toString(36).slice(2, 34)}`,
    failureCount: 0,
    createdAt: new Date().toISOString(),
  };
  mockWebhooks.push(wh);
  return { webhook: wh, signingSecret: wh.secret };
}

export async function updateWebhook(
  id: string,
  body: { url?: string; events?: WebhookEvent[]; isActive?: boolean }
): Promise<Webhook> {
  if (isLiveApi()) {
    return webhookLive.apiUpdateWebhook(id, {
      url: body.url,
      event_types: body.events,
      is_active: body.isActive,
    });
  }
  await delay();
  const wh = mockWebhooks.find(w => w.id === id);
  if (!wh) throw new Error('Webhook not found');
  if (body.url !== undefined) wh.url = body.url;
  if (body.events !== undefined) wh.events = body.events;
  if (body.isActive !== undefined) wh.status = body.isActive ? 'active' : 'disabled';
  return { ...wh };
}

export async function deleteWebhook(id: string): Promise<void> {
  if (isLiveApi()) return webhookLive.apiDeleteWebhook(id);
  await delay();
  const idx = mockWebhooks.findIndex(w => w.id === id);
  if (idx >= 0) mockWebhooks.splice(idx, 1);
}

export async function testWebhook(id: string): Promise<void> {
  if (isLiveApi()) return webhookLive.apiTestWebhook(id);
  await delay();
}

export async function getWebhookDeliveries(id: string): Promise<webhookLive.WebhookDeliveryRow[]> {
  if (isLiveApi()) return webhookLive.apiListWebhookDeliveries(id);
  await delay();
  return [];
}

export async function getTeam(organizationId: string) {
  if (isLiveApi()) {
    return orgLive.apiListOrgUsers(organizationId);
  }
  await delay();
  return mockTeam.filter(m => m.organizationId != null && m.organizationId === organizationId);
}

export type InviteTeamMemberResult = { joinLink?: string };

export async function inviteTeamMember(
  organizationId: string,
  email: string,
  role: TeamRole
): Promise<InviteTeamMemberResult> {
  if (isLiveApi()) {
    const r = await orgLive.apiInviteOrgUser(email, role);
    return { joinLink: r.join_link };
  }
  await delay();
  mockTeam.push({
    id: `TM-${Date.now()}`,
    name: email.split('@')[0].replace(/[._]/g, ' '),
    email,
    role,
    status: 'invited',
    invitedAt: new Date().toISOString(),
    organizationId,
  });
  return {};
}

export async function removeTeamMember(organizationId: string, id: string): Promise<void> {
  if (isLiveApi()) {
    await orgLive.apiRemoveOrgUser(id);
    return;
  }
  await delay();
  const idx = mockTeam.findIndex(m => m.id === id && m.organizationId === organizationId);
  if (idx >= 0) mockTeam.splice(idx, 1);
}

export async function updateTeamMemberRole(
  organizationId: string,
  userId: string,
  role: TeamRole
): Promise<void> {
  if (isLiveApi()) {
    await orgLive.apiPatchOrgUserRole(userId, role, organizationId);
    return;
  }
  await delay();
  const m = mockTeam.find(x => x.id === userId && x.organizationId === organizationId);
  if (m) m.role = role;
}

export type OrgAppearance = {
  orgId: string;
  orgName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  tagline: string;
};

export async function getOrgAppearance(): Promise<OrgAppearance> {
  if (isLiveApi()) {
    const s = await orgLive.apiGetOrgSettings();
    return {
      orgId: s.org_id,
      orgName: s.org_name,
      primaryColor: s.branding.primary_color,
      accentColor: s.branding.accent_color,
      logoUrl: s.branding.logo_url,
      tagline: s.branding.tagline,
    };
  }
  await delay();
  return {
    orgId: 'demo',
    orgName: 'Demo workspace',
    primaryColor: '#6366f1',
    accentColor: '#8b5cf6',
    logoUrl: '',
    tagline: '',
  };
}

export async function patchOrgAppearance(patch: {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  tagline?: string;
}): Promise<OrgAppearance> {
  if (isLiveApi()) {
    const s = await orgLive.apiPatchOrgSettings({
      primary_color: patch.primaryColor,
      accent_color: patch.accentColor,
      logo_url: patch.logoUrl,
      tagline: patch.tagline,
    });
    return {
      orgId: s.org_id,
      orgName: s.org_name,
      primaryColor: s.branding.primary_color,
      accentColor: s.branding.accent_color,
      logoUrl: s.branding.logo_url,
      tagline: s.branding.tagline,
    };
  }
  await delay();
  const cur = await getOrgAppearance();
  return {
    ...cur,
    primaryColor: patch.primaryColor ?? cur.primaryColor,
    accentColor: patch.accentColor ?? cur.accentColor,
    logoUrl: patch.logoUrl ?? cur.logoUrl,
    tagline: patch.tagline ?? cur.tagline,
  };
}

export async function getComplianceTiers() {
  await delay(200);
  return [...mockComplianceTiers];
}

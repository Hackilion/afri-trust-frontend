import { mockApiKeys, mockWebhooks, mockTeam, mockComplianceTiers } from '../mocks/settings';
import type { ApiKey, ApiKeyEnvironment, ApiKeyPermission, Webhook, WebhookEvent, TeamRole } from '../types';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export async function getApiKeys(env?: ApiKeyEnvironment) {
  await delay();
  return env ? mockApiKeys.filter(k => k.environment === env) : [...mockApiKeys];
}

export async function createApiKey(name: string, env: ApiKeyEnvironment, permissions: ApiKeyPermission[]): Promise<{ key: ApiKey; fullKey: string }> {
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
  await delay();
  const key = mockApiKeys.find(k => k.id === id);
  if (key) key.status = 'revoked';
}

export async function getWebhooks() {
  await delay();
  return [...mockWebhooks];
}

export async function createWebhook(url: string, events: WebhookEvent[]): Promise<Webhook> {
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
  return wh;
}

export async function deleteWebhook(id: string): Promise<void> {
  await delay();
  const idx = mockWebhooks.findIndex(w => w.id === id);
  if (idx >= 0) mockWebhooks.splice(idx, 1);
}

export async function getTeam() {
  await delay();
  return [...mockTeam];
}

export async function inviteTeamMember(email: string, role: TeamRole): Promise<void> {
  await delay();
  mockTeam.push({
    id: `TM-${Date.now()}`,
    name: email.split('@')[0],
    email,
    role,
    status: 'invited',
    invitedAt: new Date().toISOString(),
  });
}

export async function removeTeamMember(id: string): Promise<void> {
  await delay();
  const idx = mockTeam.findIndex(m => m.id === id);
  if (idx >= 0) mockTeam.splice(idx, 1);
}

export async function getComplianceTiers() {
  await delay(200);
  return [...mockComplianceTiers];
}

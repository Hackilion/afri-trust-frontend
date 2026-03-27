import { apiFetch } from '../lib/apiClient';
import type { Webhook, WebhookEvent } from '../types';

type WebhookSubscriptionRow = {
  id: string;
  org_id: string;
  url: string;
  event_types: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  failure_count?: number;
  last_delivery_at?: string | null;
};

type WebhookCreateResponse = {
  id: string;
  url: string;
  event_types: string[];
  signing_secret: string;
  created_at: string;
};

export type WebhookDeliveryRow = {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  last_response_code: number | null;
  created_at: string;
};

function mapWebhook(row: WebhookSubscriptionRow): Webhook {
  return {
    id: row.id,
    url: row.url,
    events: (row.event_types ?? []) as WebhookEvent[],
    status: row.is_active ? 'active' : 'disabled',
    failureCount: row.failure_count ?? 0,
    lastTriggeredAt: row.last_delivery_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function apiListWebhooks(): Promise<Webhook[]> {
  const rows = await apiFetch<WebhookSubscriptionRow[]>('/v1/webhooks');
  return rows.map(mapWebhook);
}

export async function apiCreateWebhook(
  url: string,
  eventTypes: WebhookEvent[]
): Promise<{ webhook: Webhook; signingSecret: string }> {
  const raw = await apiFetch<WebhookCreateResponse>('/v1/webhooks', {
    method: 'POST',
    body: JSON.stringify({ url, event_types: eventTypes }),
  });
  const webhook: Webhook = {
    id: raw.id,
    url: raw.url,
    events: raw.event_types as WebhookEvent[],
    status: 'active',
    failureCount: 0,
    createdAt: raw.created_at,
    updatedAt: raw.created_at,
  };
  return { webhook, signingSecret: raw.signing_secret };
}

export async function apiUpdateWebhook(
  id: string,
  body: { url?: string; event_types?: WebhookEvent[]; is_active?: boolean }
): Promise<Webhook> {
  const payload: Record<string, unknown> = {};
  if (body.url !== undefined) payload.url = body.url;
  if (body.event_types !== undefined) payload.event_types = body.event_types;
  if (body.is_active !== undefined) payload.is_active = body.is_active;
  const row = await apiFetch<WebhookSubscriptionRow>(`/v1/webhooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapWebhook(row);
}

export async function apiDeleteWebhook(id: string): Promise<void> {
  await apiFetch(`/v1/webhooks/${id}`, { method: 'DELETE' });
}

export async function apiTestWebhook(id: string): Promise<void> {
  await apiFetch<{ detail: string }>(`/v1/webhooks/${id}/test`, { method: 'POST' });
}

export async function apiListWebhookDeliveries(id: string): Promise<WebhookDeliveryRow[]> {
  return apiFetch<WebhookDeliveryRow[]>(`/v1/webhooks/${id}/deliveries`);
}

import { apiFetch } from '../lib/apiClient';
import type { ApiKey, ApiKeyPermission } from '../types';

type ApiKeyOutRow = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

type ApiKeyCreateResponse = {
  id: string;
  name: string;
  api_key: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
};

function mapRow(row: ApiKeyOutRow): ApiKey {
  const pre = row.key_prefix?.trim() || '••••';
  return {
    id: String(row.id),
    name: row.name,
    prefix: pre,
    environment: 'live',
    status: row.is_active ? 'active' : 'revoked',
    permissions: (row.scopes ?? []) as ApiKeyPermission[],
    lastUsedAt: row.last_used_at ?? undefined,
    createdAt: row.created_at,
    createdBy: '—',
  };
}

export async function apiListApiKeys(): Promise<ApiKey[]> {
  const rows = await apiFetch<ApiKeyOutRow[]>('/v1/api-keys');
  return (rows ?? []).map(mapRow);
}

export async function apiCreateApiKey(
  name: string,
  scopes: ApiKeyPermission[]
): Promise<{ key: ApiKey; fullKey: string }> {
  const res = await apiFetch<ApiKeyCreateResponse>('/v1/api-keys', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      scopes,
    }),
  });
  const key: ApiKey = {
    id: String(res.id),
    name: res.name,
    prefix: res.key_prefix,
    environment: 'live',
    status: 'active',
    permissions: (res.scopes ?? []) as ApiKeyPermission[],
    createdAt: res.created_at,
    createdBy: '—',
  };
  return { key, fullKey: res.api_key };
}

export async function apiRevokeApiKey(id: string): Promise<void> {
  await apiFetch<{ detail?: string }>(`/v1/api-keys/${id}`, { method: 'DELETE' });
}

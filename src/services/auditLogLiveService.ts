import { apiFetch } from '../lib/apiClient';
import type { AuditLog, AuditLogFilters } from '../types';

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type PaginatedAuditResponse = {
  items: AuditLogOutRow[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

type AuditLogOutRow = {
  id: string;
  org_id: string | null;
  actor_type: string;
  actor_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  changes: Record<string, unknown>;
  created_at: string;
};

function shortId(id: string): string {
  if (!id || id === '—') return '';
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function mapRow(row: AuditLogOutRow): AuditLog {
  const actorType = row.actor_type;
  const aid = row.actor_id ?? '';
  const actor =
    actorType === 'system'
      ? 'System'
      : actorType === 'api_key'
        ? `API key ${shortId(aid)}`
        : `User ${shortId(aid)}`;

  const changes = row.changes && typeof row.changes === 'object' && !Array.isArray(row.changes) ? row.changes : {};
  const rid = row.resource_id ?? '';
  const rtype = row.resource_type ?? 'record';

  let resourceLabel: string;
  if (typeof changes.workflow_id === 'string') {
    resourceLabel = `Workflow ${shortId(changes.workflow_id)}`;
  } else if (typeof changes.version === 'number') {
    resourceLabel = `${row.action} (v${String(changes.version)})`;
  } else {
    resourceLabel = `${row.action.replace(/\./g, ' ')} · ${shortId(rid) || rtype}`;
  }

  return {
    id: row.id,
    actor,
    actorId: aid || '—',
    actorRole: actorType,
    resourceType: rtype,
    resourceId: rid || '—',
    resourceLabel,
    action: row.action,
    ipAddress: row.ip_address ?? undefined,
    createdAt: row.created_at,
    changes: Object.keys(changes).length ? changes : undefined,
  };
}

function buildQuery(filters: AuditLogFilters, page: number, pageSize: number): string {
  const p = new URLSearchParams();
  p.set('page', String(page));
  p.set('page_size', String(Math.min(100, Math.max(1, pageSize))));
  if (filters.actorId) p.set('actor_id', filters.actorId);
  if (filters.resourceType) p.set('resource_type', filters.resourceType);
  if (filters.resourceId) p.set('resource_id', filters.resourceId);
  if (filters.action?.includes('.')) p.set('action', filters.action);
  if (filters.dateFrom) p.set('after', filters.dateFrom);
  if (filters.dateTo) {
    const end = new Date(filters.dateTo);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      p.set('before', end.toISOString());
    }
  }
  return p.toString();
}

export async function apiListAuditLogs(
  filters: AuditLogFilters,
  page: number,
  pageSize: number
): Promise<AuditLogPage> {
  const qs = buildQuery(filters, page, pageSize);
  const raw = await apiFetch<PaginatedAuditResponse>(`/v1/audit-logs?${qs}`);
  return {
    items: raw.items.map(mapRow),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
    totalPages: Math.max(1, raw.pages || 1),
  };
}

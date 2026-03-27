import { isLiveApi } from '../lib/apiConfig';
import { mockAuditLogs } from '../mocks/auditLogs';
import type { AuditLog, AuditLogFilters } from '../types';
import { apiListAuditLogs, type AuditLogPage } from './auditLogLiveService';

export type { AuditLogPage };

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

/** Map UI resource filter to mock rows that used shorter type names. */
function mockResourceMatches(logType: string, filter: string): boolean {
  if (logType === filter) return true;
  if (filter === 'verification_session' && logType === 'session') return true;
  if (filter === 'webhook_subscription' && logType === 'webhook') return true;
  return false;
}

/** Map simplified mock actions to filter selection. */
function mockActionMatches(logAction: string, filter: string): boolean {
  if (logAction === filter) return true;
  const groups: Record<string, (a: string) => boolean> = {
    create: a => a === 'create' || a.endsWith('.created'),
    update: a => a === 'update' || a.endsWith('.updated'),
    delete: a => a === 'delete' || a.endsWith('.deleted'),
    approve: a => a === 'approve' || a.includes('approved'),
    reject: a => a === 'reject' || a.includes('rejected'),
    publish: a => a === 'publish' || a.endsWith('.published'),
    archive: a => a === 'archive' || a.endsWith('.archived'),
    revoke: a => a === 'revoke' || a.endsWith('.revoked'),
    invite: a => a === 'invite' || a.includes('invite'),
  };
  const fn = groups[filter];
  return fn ? fn(logAction) : logAction === filter;
}

export async function getAuditLogs(
  filters: AuditLogFilters = {},
  page = 1,
  pageSize = 20
): Promise<AuditLogPage> {
  if (isLiveApi()) {
    return apiListAuditLogs(filters, page, pageSize);
  }

  await delay();

  let items = [...mockAuditLogs];

  if (filters.actorId) {
    items = items.filter(l => l.actorId === filters.actorId);
  }
  if (filters.actorRole) {
    items = items.filter(l => l.actorRole === filters.actorRole);
  }
  if (filters.resourceType) {
    items = items.filter(l => mockResourceMatches(l.resourceType, filters.resourceType!));
  }
  if (filters.action) {
    items = items.filter(l => mockActionMatches(l.action, filters.action!));
  }
  if (filters.resourceId) {
    items = items.filter(l => l.resourceId === filters.resourceId);
  }
  if (filters.dateFrom) {
    items = items.filter(l => l.createdAt >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    items = items.filter(l => l.createdAt <= filters.dateTo!);
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { items: paged, total, page, pageSize, totalPages };
}

export async function getAuditLogById(id: string): Promise<AuditLog | null> {
  if (isLiveApi()) {
    const { items } = await apiListAuditLogs({}, 1, 100);
    return items.find(l => l.id === id) ?? null;
  }
  await delay(200);
  return mockAuditLogs.find(l => l.id === id) ?? null;
}

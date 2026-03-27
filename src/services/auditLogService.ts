import { mockAuditLogs } from '../mocks/auditLogs';
import type { AuditLog, AuditLogFilters } from '../types';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getAuditLogs(
  filters: AuditLogFilters = {},
  page = 1,
  pageSize = 20
): Promise<AuditLogPage> {
  await delay();

  let items = [...mockAuditLogs];

  if (filters.actorId) {
    items = items.filter(l => l.actorId === filters.actorId);
  }
  if (filters.actorRole) {
    items = items.filter(l => l.actorRole === filters.actorRole);
  }
  if (filters.resourceType) {
    items = items.filter(l => l.resourceType === filters.resourceType);
  }
  if (filters.action) {
    items = items.filter(l => l.action === filters.action);
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

  // Always newest-first
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { items: paged, total, page, pageSize, totalPages };
}

export async function getAuditLogById(id: string): Promise<AuditLog | null> {
  await delay(200);
  return mockAuditLogs.find(l => l.id === id) ?? null;
}

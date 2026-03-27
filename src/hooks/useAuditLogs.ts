import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, getAuditLogById } from '../services/auditLogService';
import type { AuditLogFilters } from '../types';

export function useAuditLogs(filters: AuditLogFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['audit-logs', filters, page, pageSize],
    queryFn: () => getAuditLogs(filters, page, pageSize),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['audit-logs', id],
    queryFn: () => getAuditLogById(id),
    enabled: !!id,
  });
}

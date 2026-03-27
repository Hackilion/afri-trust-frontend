export type AuditLogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'revoke'
  | 'publish'
  | 'archive'
  | 'clone'
  | 'login'
  | 'export'
  | 'invite';

export type AuditLogResourceType =
  | 'applicant'
  | 'session'
  | 'workflow'
  | 'tier_profile'
  | 'api_key'
  | 'webhook'
  | 'team_member'
  | 'consent_grant';

export interface AuditLog {
  id: string;
  actor: string;
  actorId: string;
  actorRole: string;
  resourceType: AuditLogResourceType;
  resourceId: string;
  resourceLabel?: string;
  action: AuditLogAction;
  diff?: Record<string, { before: unknown; after: unknown }>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  actor?: string;
  actorId?: string;
  actorRole?: string;
  resourceType?: AuditLogResourceType;
  resourceId?: string;
  action?: AuditLogAction;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

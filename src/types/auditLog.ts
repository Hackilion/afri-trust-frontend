/** Mock/demo labels only; live API uses free-form strings such as `applicant.created`. */
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
  /** Backend `resource_type` (e.g. verification_session, webhook_subscription). */
  resourceType: string;
  resourceId: string;
  resourceLabel?: string;
  /** Backend action string (e.g. applicant.created, workflow.published). */
  action: string;
  diff?: Record<string, { before: unknown; after: unknown }>;
  /** Raw `changes` JSON from API when present. */
  changes?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  actor?: string;
  actorId?: string;
  actorRole?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

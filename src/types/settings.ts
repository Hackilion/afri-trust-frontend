import type { DocumentType, VerificationTier } from './applicant';
import type { VerificationCheckType } from './verification';

export type ApiKeyEnvironment = 'live' | 'test';
export type ApiKeyStatus = 'active' | 'revoked';

export type ApiKeyPermission =
  | 'applicants:read'
  | 'applicants:write'
  | 'webhooks:read'
  | 'webhooks:write';

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  environment: ApiKeyEnvironment;
  status: ApiKeyStatus;
  permissions: ApiKeyPermission[];
  lastUsedAt?: string;
  createdAt: string;
  createdBy: string;
}

export type WebhookEvent =
  | 'applicant.created'
  | 'applicant.verified'
  | 'applicant.rejected'
  | 'applicant.needs_review'
  | 'check.completed';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  status: 'active' | 'disabled';
  secret: string;
  failureCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

export type TeamRole = 'owner' | 'admin' | 'reviewer' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'active' | 'invited' | 'suspended';
  lastActiveAt?: string;
  invitedAt: string;
}

export interface ComplianceTier {
  id: string;
  name: VerificationTier;
  label: string;
  description: string;
  requiredChecks: VerificationCheckType[];
  requiredDocuments: DocumentType[];
  isActive: boolean;
}

import type { ApiKey, Webhook, TeamMember, ComplianceTier } from '../types';

export let mockApiKeys: ApiKey[] = [
  { id: 'KEY-001', name: 'Production API Key', prefix: 'aft_live_sk_4x8m...', environment: 'live', status: 'active', permissions: ['applicants:read', 'applicants:write', 'webhooks:read'], lastUsedAt: new Date(Date.now() - 3600000).toISOString(), createdAt: '2026-01-15T10:00:00Z', createdBy: 'Sarah Osei' },
  { id: 'KEY-002', name: 'Test Environment Key', prefix: 'aft_test_sk_7n2p...', environment: 'test', status: 'active', permissions: ['applicants:read', 'applicants:write', 'webhooks:read', 'webhooks:write'], lastUsedAt: new Date(Date.now() - 7200000).toISOString(), createdAt: '2026-02-01T09:00:00Z', createdBy: 'Kweku Amponsah' },
  { id: 'KEY-003', name: 'Legacy Integration', prefix: 'aft_live_sk_9r3q...', environment: 'live', status: 'revoked', permissions: ['applicants:read'], createdAt: '2025-11-20T14:00:00Z', createdBy: 'Sarah Osei' },
];

export let mockWebhooks: Webhook[] = [
  { id: 'WH-001', url: 'https://api.yourapp.com/webhooks/afritrust', events: ['applicant.verified', 'applicant.rejected', 'applicant.needs_review'], status: 'active', secret: 'whsec_****************************', failureCount: 0, lastTriggeredAt: new Date(Date.now() - 7200000).toISOString(), createdAt: '2026-01-20T10:00:00Z' },
  { id: 'WH-002', url: 'https://notify.yourapp.com/kyc-events', events: ['applicant.created', 'check.completed'], status: 'active', secret: 'whsec_****************************', failureCount: 2, lastTriggeredAt: new Date(Date.now() - 86400000).toISOString(), createdAt: '2026-02-10T12:00:00Z' },
  { id: 'WH-003', url: 'https://legacy.yourapp.com/hooks', events: ['applicant.verified'], status: 'disabled', secret: 'whsec_****************************', failureCount: 15, createdAt: '2025-12-01T09:00:00Z' },
];

export let mockTeam: TeamMember[] = [
  {
    id: 'TM-001',
    name: 'Sarah Osei',
    email: 'owner@demo.com',
    role: 'owner',
    status: 'active',
    lastActiveAt: new Date(Date.now() - 1800000).toISOString(),
    invitedAt: '2025-10-01T10:00:00Z',
    organizationId: 'org-gh-bank',
  },
  {
    id: 'TM-002',
    name: 'Kweku Amponsah',
    email: 'admin@demo.com',
    role: 'admin',
    status: 'active',
    lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
    invitedAt: '2025-10-05T10:00:00Z',
    organizationId: 'org-gh-bank',
  },
  {
    id: 'TM-003',
    name: 'Amara Diallo',
    email: 'reviewer@demo.com',
    role: 'reviewer',
    status: 'active',
    lastActiveAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    invitedAt: '2025-11-15T10:00:00Z',
    organizationId: 'org-gh-bank',
  },
  {
    id: 'TM-004',
    name: 'Ngozi Williams',
    email: 'viewer@demo.com',
    role: 'viewer',
    status: 'invited',
    invitedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    organizationId: 'org-gh-bank',
  },
  {
    id: 'TM-101',
    name: 'James Otieno',
    email: 'owner@nairobi.demo',
    role: 'owner',
    status: 'active',
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    invitedAt: '2025-12-01T09:00:00Z',
    organizationId: 'org-nairobi-pay',
  },
  {
    id: 'TM-102',
    name: 'Wanjiru Mwangi',
    email: 'wanjiru@nairobi.demo',
    role: 'admin',
    status: 'active',
    lastActiveAt: new Date(Date.now() - 7200000).toISOString(),
    invitedAt: '2025-12-10T09:00:00Z',
    organizationId: 'org-nairobi-pay',
  },
];

export const mockComplianceTiers: ComplianceTier[] = [
  {
    id: 'TIER-001',
    name: 'basic',
    label: 'Basic KYC',
    description: 'Minimum identity verification. Suitable for low-risk onboarding.',
    requiredChecks: ['email_verification', 'phone_verification', 'document_authenticity'],
    requiredDocuments: ['national_id', 'nin', 'passport', 'voters_card', 'ghana_card'],
    isActive: true,
  },
  {
    id: 'TIER-002',
    name: 'standard',
    label: 'Standard KYC',
    description: 'Full document + liveness verification. Required for financial services.',
    requiredChecks: ['email_verification', 'phone_verification', 'document_authenticity', 'document_expiry', 'liveness', 'face_match', 'watchlist'],
    requiredDocuments: ['national_id', 'nin', 'passport', 'drivers_license', 'ghana_card', 'bvn'],
    isActive: true,
  },
  {
    id: 'TIER-003',
    name: 'enhanced',
    label: 'Enhanced Due Diligence',
    description: 'Full KYC + PEP screening + adverse media checks. Required for high-risk profiles.',
    requiredChecks: ['email_verification', 'phone_verification', 'document_authenticity', 'document_expiry', 'liveness', 'face_match', 'watchlist', 'pep', 'adverse_media', 'address_verification'],
    requiredDocuments: ['passport', 'national_id', 'drivers_license'],
    isActive: true,
  },
];

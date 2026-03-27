import type { AuditLog } from '../types';

const d = (daysAgo: number, hour = 10, min = 0) => {
  const date = new Date('2026-03-27T00:00:00Z');
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, min, 0, 0);
  return date.toISOString();
};

export const mockAuditLogs: AuditLog[] = [
  { id: 'AL-001', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'applicant', resourceId: 'APL-000025', resourceLabel: 'Precious Okonkwo', action: 'applicant.created', ipAddress: '41.190.3.12', createdAt: d(0, 17, 0) },
  { id: 'AL-002', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'applicant', resourceId: 'APL-000023', resourceLabel: 'Adaeze Obi', action: 'verification.approved', ipAddress: '41.190.3.12', createdAt: d(0, 16, 30) },
  { id: 'AL-003', actor: 'system', actorId: 'SYSTEM', actorRole: 'system', resourceType: 'verification_session', resourceId: 'SES-003', resourceLabel: 'Session for Layla Hassan', action: 'verification.rejected', createdAt: d(0, 16, 0) },
  { id: 'AL-004', actor: 'Amara Diallo', actorId: 'TM-003', actorRole: 'reviewer', resourceType: 'applicant', resourceId: 'APL-000022', resourceLabel: 'Nadia El-Sayed', action: 'applicant.updated', diff: { status: { before: 'pending', after: 'needs_review' } }, ipAddress: '197.210.4.55', createdAt: d(1, 9, 0) },
  { id: 'AL-005', actor: 'Kweku Amponsah', actorId: 'TM-002', actorRole: 'admin', resourceType: 'workflow', resourceId: 'WF-003', resourceLabel: 'Biometric Premium Onboarding', action: 'workflow.cloned', diff: { description: { before: 'New flow', after: 'Experimental biometric-first flow for premium tier. Draft in progress.' } }, ipAddress: '154.120.8.201', createdAt: d(1, 14, 22) },
  { id: 'AL-006', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'workflow', resourceId: 'WF-002', resourceLabel: 'High-Value Account (EDD)', action: 'workflow.published', ipAddress: '41.190.3.12', createdAt: d(3, 10, 0) },
  { id: 'AL-007', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'workflow', resourceId: 'WF-004', resourceLabel: 'Legacy Basic Flow', action: 'workflow.archived', ipAddress: '41.190.3.12', createdAt: d(3, 10, 5) },
  { id: 'AL-008', actor: 'Kweku Amponsah', actorId: 'TM-002', actorRole: 'admin', resourceType: 'tier_profile', resourceId: 'TP-004', resourceLabel: 'Biometric Premium', action: 'tier_profile.created', ipAddress: '154.120.8.201', createdAt: d(5, 15, 0) },
  { id: 'AL-009', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'api_key', resourceId: 'KEY-003', resourceLabel: 'Legacy Integration', action: 'api_key.revoked', ipAddress: '41.190.3.12', createdAt: d(6, 11, 20) },
  { id: 'AL-010', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'team_member', resourceId: 'TM-004', resourceLabel: 'Ngozi Williams', action: 'invite', ipAddress: '41.190.3.12', createdAt: d(7, 9, 45) },
  { id: 'AL-011', actor: 'system', actorId: 'SYSTEM', actorRole: 'system', resourceType: 'applicant', resourceId: 'APL-000018', resourceLabel: 'Brian Otieno', action: 'verification.rejected', createdAt: d(8, 9, 0) },
  { id: 'AL-012', actor: 'Amara Diallo', actorId: 'TM-003', actorRole: 'reviewer', resourceType: 'applicant', resourceId: 'APL-000017', resourceLabel: 'Akosua Darko', action: 'applicant.updated', diff: { status: { before: 'pending', after: 'needs_review' } }, ipAddress: '197.210.4.55', createdAt: d(8, 11, 0) },
  { id: 'AL-013', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'applicant', resourceId: 'APL-000014', resourceLabel: 'Thabo Nkosi', action: 'verification.approved', ipAddress: '41.190.3.12', createdAt: d(9, 13, 30) },
  { id: 'AL-014', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'workflow', resourceId: 'WF-001', resourceLabel: 'Retail Consumer Onboarding', action: 'workflow.published', ipAddress: '41.190.3.12', createdAt: d(10, 10, 0) },
  { id: 'AL-015', actor: 'Kweku Amponsah', actorId: 'TM-002', actorRole: 'admin', resourceType: 'tier_profile', resourceId: 'TP-002', resourceLabel: 'Standard KYC', action: 'tier_profile.updated', diff: { 'settings.expiryDays': { before: 365, after: 180 } }, ipAddress: '154.120.8.201', createdAt: d(11, 16, 0) },
  { id: 'AL-016', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'webhook_subscription', resourceId: 'WH-002', resourceLabel: 'https://notify.yourapp.com/kyc-events', action: 'webhook.created', ipAddress: '41.190.3.12', createdAt: d(12, 12, 0) },
  { id: 'AL-017', actor: 'system', actorId: 'SYSTEM', actorRole: 'system', resourceType: 'verification_session', resourceId: 'SES-001', resourceLabel: 'Session for Emeka Okafor', action: 'verification.approved', createdAt: d(13, 8, 30) },
  { id: 'AL-018', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'consent_grant', resourceId: 'CG-003', resourceLabel: 'Consent for Wanjiru Kamau', action: 'consent.revoked', ipAddress: '41.190.3.12', createdAt: d(14, 14, 0) },
  { id: 'AL-019', actor: 'Kweku Amponsah', actorId: 'TM-002', actorRole: 'admin', resourceType: 'tier_profile', resourceId: 'TP-003', resourceLabel: 'Enhanced Due Diligence', action: 'tier_profile.created', ipAddress: '154.120.8.201', createdAt: d(15, 10, 0) },
  { id: 'AL-020', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'api_key', resourceId: 'KEY-001', resourceLabel: 'Production API Key', action: 'api_key.created', ipAddress: '41.190.3.12', createdAt: d(16, 9, 0) },
  { id: 'AL-021', actor: 'Amara Diallo', actorId: 'TM-003', actorRole: 'reviewer', resourceType: 'applicant', resourceId: 'APL-000012', resourceLabel: 'Kofi Agyeman', action: 'verification.rejected', diff: { reason: { before: null, after: 'Selfie does not match document photo' } }, ipAddress: '197.210.4.55', createdAt: d(17, 11, 0) },
  { id: 'AL-022', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'workflow', resourceId: 'WF-002', resourceLabel: 'High-Value Account (EDD)', action: 'workflow.created', ipAddress: '41.190.3.12', createdAt: d(18, 10, 0) },
  { id: 'AL-023', actor: 'Kweku Amponsah', actorId: 'TM-002', actorRole: 'admin', resourceType: 'tier_profile', resourceId: 'TP-001', resourceLabel: 'KYC Lite', action: 'tier_profile.created', ipAddress: '154.120.8.201', createdAt: d(20, 10, 0) },
  { id: 'AL-024', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'team_member', resourceId: 'TM-003', resourceLabel: 'Amara Diallo', action: 'invite', ipAddress: '41.190.3.12', createdAt: d(22, 9, 0) },
  { id: 'AL-025', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'webhook_subscription', resourceId: 'WH-001', resourceLabel: 'https://api.yourapp.com/webhooks/afritrust', action: 'webhook.created', ipAddress: '41.190.3.12', createdAt: d(25, 10, 0) },
  { id: 'AL-026', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'api_key', resourceId: 'KEY-002', resourceLabel: 'Test Environment Key', action: 'api_key.created', ipAddress: '41.190.3.12', createdAt: d(26, 9, 0) },
  { id: 'AL-027', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'team_member', resourceId: 'TM-002', resourceLabel: 'Kweku Amponsah', action: 'invite', ipAddress: '41.190.3.12', createdAt: d(27, 9, 0) },
  { id: 'AL-028', actor: 'system', actorId: 'SYSTEM', actorRole: 'system', resourceType: 'applicant', resourceId: 'APL-000001', resourceLabel: 'Emeka Okafor', action: 'applicant.created', createdAt: d(27, 9, 30) },
  { id: 'AL-029', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'workflow', resourceId: 'WF-001', resourceLabel: 'Retail Consumer Onboarding', action: 'workflow.created', ipAddress: '41.190.3.12', createdAt: d(28, 10, 0) },
  { id: 'AL-030', actor: 'Sarah Osei', actorId: 'TM-001', actorRole: 'owner', resourceType: 'tier_profile', resourceId: 'TP-005', resourceLabel: 'Legacy Verification (Archived)', action: 'tier_profile.deleted', ipAddress: '41.190.3.12', createdAt: d(28, 15, 0) },
];

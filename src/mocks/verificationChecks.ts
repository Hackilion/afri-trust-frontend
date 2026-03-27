import type { VerificationCheck, TimelineEvent } from '../types';

export const mockVerificationChecks: Record<string, VerificationCheck[]> = {
  'APL-000001': [
    { id: 'CHK-001', applicantId: 'APL-000001', type: 'liveness', status: 'passed', score: 98, details: 'Liveness detection passed with high confidence', performedAt: '2026-03-01T08:05:00Z', provider: 'internal' },
    { id: 'CHK-002', applicantId: 'APL-000001', type: 'face_match', status: 'passed', score: 96, details: 'Face matches document photo', performedAt: '2026-03-01T08:06:00Z', provider: 'internal' },
    { id: 'CHK-003', applicantId: 'APL-000001', type: 'document_authenticity', status: 'passed', score: 99, details: 'NIN document verified as authentic', performedAt: '2026-03-01T08:07:00Z', provider: 'internal' },
    { id: 'CHK-004', applicantId: 'APL-000001', type: 'document_expiry', status: 'passed', score: 100, details: 'Document valid until 2028', performedAt: '2026-03-01T08:07:00Z', provider: 'internal' },
    { id: 'CHK-005', applicantId: 'APL-000001', type: 'watchlist', status: 'passed', score: 100, details: 'No matches found on global watchlists', performedAt: '2026-03-01T08:10:00Z', provider: 'internal' },
    { id: 'CHK-006', applicantId: 'APL-000001', type: 'pep', status: 'passed', score: 100, details: 'No PEP matches found', performedAt: '2026-03-01T08:10:00Z', provider: 'internal' },
    { id: 'CHK-007', applicantId: 'APL-000001', type: 'email_verification', status: 'passed', score: 100, details: 'Email address verified', performedAt: '2026-03-01T08:01:00Z', provider: 'internal' },
    { id: 'CHK-008', applicantId: 'APL-000001', type: 'phone_verification', status: 'passed', score: 100, details: 'Phone number verified via OTP', performedAt: '2026-03-01T08:02:00Z', provider: 'internal' },
  ],
  'APL-000004': [
    { id: 'CHK-020', applicantId: 'APL-000004', type: 'liveness', status: 'passed', score: 92, details: 'Liveness detected', performedAt: '2026-03-18T10:35:00Z', provider: 'internal' },
    { id: 'CHK-021', applicantId: 'APL-000004', type: 'face_match', status: 'pending', details: 'Face match under manual review', performedAt: '2026-03-18T10:36:00Z', provider: 'internal' },
    { id: 'CHK-022', applicantId: 'APL-000004', type: 'document_authenticity', status: 'passed', score: 94, details: 'Passport appears genuine', performedAt: '2026-03-18T10:37:00Z', provider: 'internal' },
    { id: 'CHK-023', applicantId: 'APL-000004', type: 'watchlist', status: 'failed', details: 'Partial name match on OFAC SDN list', failureReason: 'Name match score 72% on sanctions list', performedAt: '2026-03-18T10:40:00Z', provider: 'internal' },
    { id: 'CHK-024', applicantId: 'APL-000004', type: 'pep', status: 'failed', details: 'Potential PEP match found', failureReason: 'Subject shares name with known government official', performedAt: '2026-03-18T10:40:00Z', provider: 'internal' },
  ],
  'APL-000005': [
    { id: 'CHK-030', applicantId: 'APL-000005', type: 'liveness', status: 'passed', score: 88, details: 'Liveness detected', performedAt: '2026-03-15T11:05:00Z', provider: 'internal' },
    { id: 'CHK-031', applicantId: 'APL-000005', type: 'document_authenticity', status: 'failed', score: 30, details: 'Document authenticity check failed', failureReason: 'Document appears to have been digitally altered — MRZ zone inconsistencies detected', performedAt: '2026-03-15T11:08:00Z', provider: 'internal' },
    { id: 'CHK-032', applicantId: 'APL-000005', type: 'watchlist', status: 'failed', details: 'High-confidence match on watchlist', failureReason: 'Subject appears on UN consolidated sanctions list', performedAt: '2026-03-15T11:10:00Z', provider: 'internal' },
  ],
};

export function getChecksForApplicant(applicantId: string): VerificationCheck[] {
  return mockVerificationChecks[applicantId] ?? [
    { id: `${applicantId}-default-1`, applicantId, type: 'liveness', status: 'passed', score: 91, details: 'Liveness check passed', performedAt: new Date().toISOString(), provider: 'internal' },
    { id: `${applicantId}-default-2`, applicantId, type: 'face_match', status: 'passed', score: 94, details: 'Face matches document', performedAt: new Date().toISOString(), provider: 'internal' },
    { id: `${applicantId}-default-3`, applicantId, type: 'document_authenticity', status: 'passed', score: 97, details: 'Document verified as authentic', performedAt: new Date().toISOString(), provider: 'internal' },
    { id: `${applicantId}-default-4`, applicantId, type: 'watchlist', status: 'passed', score: 100, details: 'No watchlist matches', performedAt: new Date().toISOString(), provider: 'internal' },
    { id: `${applicantId}-default-5`, applicantId, type: 'pep', status: 'passed', score: 100, details: 'No PEP matches', performedAt: new Date().toISOString(), provider: 'internal' },
    { id: `${applicantId}-default-6`, applicantId, type: 'email_verification', status: 'passed', score: 100, details: 'Email verified', performedAt: new Date().toISOString(), provider: 'internal' },
  ];
}

export const mockTimelines: Record<string, TimelineEvent[]> = {};

export function getTimelineForApplicant(applicantId: string): TimelineEvent[] {
  return [
    { id: `TL-1-${applicantId}`, applicantId, type: 'submitted', description: 'Application submitted for verification', performedBy: 'system', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: `TL-2-${applicantId}`, applicantId, type: 'document_uploaded', description: 'Identity document uploaded', performedBy: 'system', createdAt: new Date(Date.now() - 86400000 * 5 + 300000).toISOString() },
    { id: `TL-3-${applicantId}`, applicantId, type: 'check_completed', description: 'Automated verification checks completed', performedBy: 'system', createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
    { id: `TL-4-${applicantId}`, applicantId, type: 'status_changed', description: 'Status updated based on check results', performedBy: 'system', createdAt: new Date(Date.now() - 86400000 * 4 + 60000).toISOString() },
  ];
}

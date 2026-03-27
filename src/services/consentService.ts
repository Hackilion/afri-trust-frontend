import { mockConsentGrants } from '../mocks/consent';
import type { ConsentGrant } from '../types';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export async function getConsentsByApplicant(applicantId: string): Promise<ConsentGrant[]> {
  await delay();
  return mockConsentGrants.filter(c => c.applicantId === applicantId);
}

export async function getAllConsents(activeOnly = false): Promise<ConsentGrant[]> {
  await delay();
  return activeOnly ? mockConsentGrants.filter(c => c.isActive) : [...mockConsentGrants];
}

export async function revokeConsent(id: string): Promise<ConsentGrant> {
  await delay();
  const idx = mockConsentGrants.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Consent grant not found');
  mockConsentGrants[idx] = {
    ...mockConsentGrants[idx],
    isActive: false,
    revokedAt: new Date().toISOString(),
  };
  return mockConsentGrants[idx];
}

export async function createConsent(
  data: Pick<ConsentGrant, 'applicantId' | 'grantedAttributes' | 'grantedTo' | 'grantedToDescription' | 'expiresAt'>
): Promise<ConsentGrant> {
  await delay();
  const next: ConsentGrant = {
    ...data,
    id: `CG-${String(mockConsentGrants.length + 1).padStart(3, '0')}`,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  mockConsentGrants.push(next);
  return next;
}

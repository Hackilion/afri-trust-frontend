import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConsentsByApplicant,
  getAllConsents,
  revokeConsent,
  createConsent,
} from '../services/consentService';
import type { ConsentGrant } from '../types';
import { useUIStore } from '../store/uiStore';

export function useApplicantConsents(applicantId: string) {
  return useQuery({
    queryKey: ['consents', 'applicant', applicantId],
    queryFn: () => getConsentsByApplicant(applicantId),
    enabled: !!applicantId,
    staleTime: 30_000,
  });
}

export function useAllConsents(activeOnly = false) {
  return useQuery({
    queryKey: ['consents', 'all', activeOnly],
    queryFn: () => getAllConsents(activeOnly),
    staleTime: 30_000,
  });
}

export function useConsentActions(_applicantId?: string) {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['consents'] });
  };

  const revoke = useMutation({
    mutationFn: ({ applicantId, consentId }: { applicantId: string; consentId: string }) =>
      revokeConsent(applicantId, consentId),
    onSuccess: () => {
      invalidate();
      addToast('Consent grant revoked', 'success');
    },
    onError: () => addToast('Failed to revoke consent', 'error'),
  });

  const create = useMutation({
    mutationFn: (data: Pick<ConsentGrant, 'applicantId' | 'grantedAttributes' | 'grantedTo' | 'grantedToDescription' | 'expiresAt'>) =>
      createConsent(data),
    onSuccess: () => { invalidate(); addToast('Consent grant created', 'success'); },
    onError: () => addToast('Failed to create consent grant', 'error'),
  });

  return { revoke, create };
}

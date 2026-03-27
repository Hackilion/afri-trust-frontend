import { useQuery } from '@tanstack/react-query';
import { getSessionsByApplicant, getSessionById } from '../services/workflowService';

export function useApplicantSessions(applicantId: string) {
  return useQuery({
    queryKey: ['sessions', 'applicant', applicantId],
    queryFn: () => getSessionsByApplicant(applicantId),
    enabled: !!applicantId,
    staleTime: 30_000,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => getSessionById(id),
    enabled: !!id,
  });
}

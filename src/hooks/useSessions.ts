import { useQuery } from '@tanstack/react-query';
import { getSessionsByApplicant, getSessionById } from '../services/workflowService';
import { useSession } from './useSession';

export function useApplicantSessions(applicantId: string) {
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['sessions', 'applicant', applicantId, workspaceOrgId],
    queryFn: () => getSessionsByApplicant(applicantId, workspaceOrgId),
    enabled: Boolean(applicantId && workspaceOrgId),
    staleTime: 30_000,
  });
}

/** Single verification session by id (TanStack Query). */
export function useVerificationSession(id: string) {
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['sessions', id, workspaceOrgId],
    queryFn: () => getSessionById(id),
    enabled: Boolean(id),
  });
}

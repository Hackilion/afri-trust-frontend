import { useQuery } from '@tanstack/react-query';
import { getApplicantById, getApplicantChecks, getApplicantTimeline } from '../services/applicantService';
import { useSession } from './useSession';

export function useApplicant(id: string) {
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['applicant', id, workspaceOrgId],
    queryFn: () => getApplicantById(id, workspaceOrgId),
    enabled: Boolean(id && workspaceOrgId),
  });
}

export function useApplicantChecks(id: string) {
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['applicant-checks', id, workspaceOrgId],
    queryFn: () => getApplicantChecks(id, workspaceOrgId),
    enabled: Boolean(id && workspaceOrgId),
  });
}

export function useApplicantTimeline(id: string) {
  return useQuery({
    queryKey: ['applicant-timeline', id],
    queryFn: () => getApplicantTimeline(id),
    enabled: !!id,
  });
}

import { useQuery } from '@tanstack/react-query';
import { getApplicantPipelineStats } from '../services/applicantService';
import { useSession } from './useSession';

export function useApplicantPipelineStats() {
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['applicants', 'pipeline-stats', workspaceOrgId],
    queryFn: () => getApplicantPipelineStats(workspaceOrgId),
    enabled: Boolean(workspaceOrgId),
    staleTime: 60_000,
  });
}

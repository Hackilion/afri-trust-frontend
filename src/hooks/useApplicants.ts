import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { getApplicants } from '../services/applicantService';
import { useFilterStore } from '../store/filterStore';
import { useSession } from './useSession';

export function useApplicants() {
  const filters = useFilterStore(s => s.filters);
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['applicants', filters, workspaceOrgId],
    queryFn: () => getApplicants(filters, workspaceOrgId),
    enabled: Boolean(workspaceOrgId),
    placeholderData: keepPreviousData,
  });
}

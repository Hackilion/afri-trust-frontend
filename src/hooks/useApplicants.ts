import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { getApplicants } from '../services/applicantService';
import { useFilterStore } from '../store/filterStore';

export function useApplicants() {
  const filters = useFilterStore((s) => s.filters);
  return useQuery({
    queryKey: ['applicants', filters],
    queryFn: () => getApplicants(filters),
    placeholderData: keepPreviousData,
  });
}

import { useQuery } from '@tanstack/react-query';
import { getApplicantById, getApplicantChecks, getApplicantTimeline } from '../services/applicantService';

export function useApplicant(id: string) {
  return useQuery({
    queryKey: ['applicant', id],
    queryFn: () => getApplicantById(id),
    enabled: !!id,
  });
}

export function useApplicantChecks(id: string) {
  return useQuery({
    queryKey: ['applicant-checks', id],
    queryFn: () => getApplicantChecks(id),
    enabled: !!id,
  });
}

export function useApplicantTimeline(id: string) {
  return useQuery({
    queryKey: ['applicant-timeline', id],
    queryFn: () => getApplicantTimeline(id),
    enabled: !!id,
  });
}

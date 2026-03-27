import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isLiveApi } from '../lib/apiConfig';
import { createVerificationSession, listVerifications } from '../services/verificationService';

export function useVerificationsList(filters: {
  applicant_id?: string;
  workflow_id?: string;
  status?: string;
  result?: string;
  page?: number;
  page_size?: number;
} = {}) {
  return useQuery({
    queryKey: ['verifications', 'list', filters],
    queryFn: () => listVerifications(filters),
    enabled: isLiveApi(),
    staleTime: 20_000,
  });
}

export function useCreateVerificationSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicantId, workflowId }: { applicantId: string; workflowId: string }) =>
      createVerificationSession(applicantId, workflowId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['verifications'] });
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

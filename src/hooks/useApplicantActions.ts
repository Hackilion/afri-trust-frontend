import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateApplicantStatus } from '../services/applicantService';
import { useUIStore } from '../store/uiStore';

export function useApplicantActions(applicantId: string) {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ status, note }: { status: Parameters<typeof updateApplicantStatus>[1]; note?: string }) =>
      updateApplicantStatus(applicantId, status, note),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['applicant', applicantId] });
      qc.invalidateQueries({ queryKey: ['applicants'] });
      const labels: Record<string, string> = { verified: 'approved', rejected: 'rejected', needs_review: 'flagged for review' };
      addToast(`Applicant ${labels[status] ?? 'updated'} successfully`);
    },
    onError: () => addToast('Action failed. Please try again.', 'error'),
  });
}

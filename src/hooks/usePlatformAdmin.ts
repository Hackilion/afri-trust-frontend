import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as platformAdminService from '../services/platformAdminService';
import { useUIStore } from '../store/uiStore';

export function useOrganizations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['platform-orgs'],
    queryFn: platformAdminService.getOrganizations,
    enabled: options?.enabled !== false,
  });
}

export function usePlatformUserDirectory() {
  return useQuery({ queryKey: ['platform-users'], queryFn: platformAdminService.getPlatformUserDirectory });
}

export function usePlatformStats() {
  return useQuery({ queryKey: ['platform-stats'], queryFn: platformAdminService.getPlatformStats });
}

export function useUpdatePlatformUser() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: ({
      userId,
      patch,
    }: {
      userId: string;
      patch: Parameters<typeof platformAdminService.updatePlatformUser>[1];
    }) => platformAdminService.updatePlatformUser(userId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-users'] });
      qc.invalidateQueries({ queryKey: ['platform-orgs'] });
      qc.invalidateQueries({ queryKey: ['team'] });
      addToast('User updated', 'success');
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  });
}

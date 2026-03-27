import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as settingsService from '../services/settingsService';
import { useUIStore } from '../store/uiStore';

export function useApiKeys() {
  return useQuery({ queryKey: ['api-keys'], queryFn: () => settingsService.getApiKeys() });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (p: Parameters<typeof settingsService.createApiKey>) => settingsService.createApiKey(...p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); },
    onError: () => addToast('Failed to create API key', 'error'),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (id: string) => settingsService.revokeApiKey(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); addToast('API key revoked'); },
    onError: () => addToast('Failed to revoke key', 'error'),
  });
}

export function useWebhooks() {
  return useQuery({ queryKey: ['webhooks'], queryFn: settingsService.getWebhooks });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: ({ url, events }: { url: string; events: Parameters<typeof settingsService.createWebhook>[1] }) =>
      settingsService.createWebhook(url, events),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); addToast('Webhook created'); },
    onError: () => addToast('Failed to create webhook', 'error'),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteWebhook(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); addToast('Webhook deleted'); },
    onError: () => addToast('Failed to delete webhook', 'error'),
  });
}

export function useTeam() {
  return useQuery({ queryKey: ['team'], queryFn: settingsService.getTeam });
}

export function useInviteTeamMember() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: Parameters<typeof settingsService.inviteTeamMember>[1] }) =>
      settingsService.inviteTeamMember(email, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); addToast('Invitation sent'); },
    onError: () => addToast('Failed to send invitation', 'error'),
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (id: string) => settingsService.removeTeamMember(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); addToast('Team member removed'); },
    onError: () => addToast('Failed to remove member', 'error'),
  });
}

export function useComplianceTiers() {
  return useQuery({ queryKey: ['compliance-tiers'], queryFn: settingsService.getComplianceTiers });
}

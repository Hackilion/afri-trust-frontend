import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../lib/apiClient';
import { refreshWorkspaceUserFromApi } from '../services/backendAuthService';
import { isLiveApi } from '../lib/apiConfig';
import * as settingsService from '../services/settingsService';
import { useUIStore } from '../store/uiStore';
import type { TeamRole, WebhookEvent } from '../types';
import { useSession } from './useSession';

export function useApiKeys() {
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['api-keys', workspaceOrgId],
    queryFn: () => settingsService.getApiKeys(),
    enabled: !isLiveApi() || Boolean(workspaceOrgId),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (p: Parameters<typeof settingsService.createApiKey>) => settingsService.createApiKey(...p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['api-keys'] });
      addToast('API key created');
    },
    onError: () => addToast('Failed to create API key', 'error'),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (id: string) => settingsService.revokeApiKey(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['api-keys'] });
      addToast('API key revoked');
    },
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
    mutationFn: ({ url, events }: { url: string; events: WebhookEvent[] }) => settingsService.createWebhook(url, events),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (e: Error) =>
      addToast(e instanceof ApiError ? e.message : 'Failed to create webhook', 'error'),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (p: { id: string; isActive?: boolean; url?: string; events?: WebhookEvent[] }) =>
      settingsService.updateWebhook(p.id, {
        isActive: p.isActive,
        url: p.url,
        events: p.events,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      addToast('Webhook updated');
    },
    onError: (e: Error) =>
      addToast(e instanceof ApiError ? e.message : 'Failed to update webhook', 'error'),
  });
}

export function useTestWebhook() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (id: string) => settingsService.testWebhook(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      qc.invalidateQueries({ queryKey: ['webhooks', id, 'deliveries'] });
      addToast(
        isLiveApi()
          ? 'Test sent — check deliveries or your server logs'
          : 'Mock mode: test button is only active with the live API'
      );
    },
    onError: (e: Error) =>
      addToast(e instanceof ApiError ? e.message : 'Test webhook failed', 'error'),
  });
}

export function useWebhookDeliveries(webhookId: string | null) {
  return useQuery({
    queryKey: ['webhooks', webhookId, 'deliveries'],
    queryFn: () => settingsService.getWebhookDeliveries(webhookId!),
    enabled: Boolean(webhookId),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteWebhook(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); addToast('Webhook deleted'); },
    onError: (e: Error) =>
      addToast(e instanceof ApiError ? e.message : 'Failed to delete webhook', 'error'),
  });
}

export function useTeam() {
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['team', workspaceOrgId],
    queryFn: () => settingsService.getTeam(workspaceOrgId!),
    enabled: Boolean(workspaceOrgId),
  });
}

export function useInviteTeamMember() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  const { workspaceOrgId } = useSession();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: TeamRole }) => {
      if (!workspaceOrgId) throw new Error('No workspace');
      return settingsService.inviteTeamMember(workspaceOrgId, email, role);
    },
    onSuccess: async data => {
      qc.invalidateQueries({ queryKey: ['team'] });
      if (data?.joinLink && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(data.joinLink);
          addToast('Join link copied — share it with your teammate');
        } catch {
          addToast('Invitation created — copy the join link from your admin tools if needed');
        }
      } else {
        addToast('Invitation sent');
      }
    },
    onError: (e: Error) =>
      addToast(e instanceof ApiError ? e.message : 'Failed to send invitation', 'error'),
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  const { workspaceOrgId } = useSession();
  return useMutation({
    mutationFn: (id: string) => {
      if (!workspaceOrgId) throw new Error('No workspace');
      return settingsService.removeTeamMember(workspaceOrgId, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      addToast('Team member removed');
    },
    onError: (e: Error) =>
      addToast(e instanceof ApiError ? e.message : 'Failed to remove member', 'error'),
  });
}

export function useUpdateTeamMemberRole() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  const { workspaceOrgId } = useSession();
  return useMutation({
    mutationFn: (p: { userId: string; role: TeamRole }) => {
      if (!workspaceOrgId) throw new Error('No workspace');
      return settingsService.updateTeamMemberRole(workspaceOrgId, p.userId, p.role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      addToast('Role updated');
    },
    onError: (e: Error) =>
      addToast(e instanceof ApiError ? e.message : 'Failed to update role', 'error'),
  });
}

export function useOrgAppearance() {
  const { workspaceOrgId } = useSession();
  return useQuery({
    queryKey: ['org-appearance', workspaceOrgId],
    queryFn: () => settingsService.getOrgAppearance(),
    enabled: Boolean(workspaceOrgId),
  });
}

export function usePatchOrgAppearance() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  return useMutation({
    mutationFn: (patch: Parameters<typeof settingsService.patchOrgAppearance>[0]) =>
      settingsService.patchOrgAppearance(patch),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['org-appearance'] });
      if (isLiveApi()) {
        try {
          await refreshWorkspaceUserFromApi();
        } catch {
          /* session branding may lag until next login */
        }
      }
      addToast('Workspace appearance saved');
    },
    onError: (e: Error) =>
      addToast(e instanceof ApiError ? e.message : 'Failed to save appearance', 'error'),
  });
}

export function useComplianceTiers() {
  return useQuery({ queryKey: ['compliance-tiers'], queryFn: settingsService.getComplianceTiers });
}

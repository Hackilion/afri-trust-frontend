import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCheckCatalogue,
  getTierProfiles,
  getTierProfileById,
  createTierProfile,
  updateTierProfile,
  archiveTierProfile,
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  publishWorkflow,
  archiveWorkflow,
  cloneWorkflow,
  cloneWorkflowToSandbox,
  addWorkflowStep,
  removeWorkflowStep,
  syncWorkflowGraph,
  dryRunWorkflow,
} from '../services/workflowService';
import type {
  TierProfile,
  Workflow,
  WorkflowEnvironment,
  WorkflowGraphEdge,
  WorkflowStep,
  WorkflowStatus,
  WorkflowStepCreate,
} from '../types';
import { useUIStore } from '../store/uiStore';

// ── Check Catalogue ───────────────────────────────────────────────────────────

export function useCheckCatalogue() {
  return useQuery({ queryKey: ['check-catalogue'], queryFn: getCheckCatalogue, staleTime: Infinity });
}

// ── Tier Profiles ─────────────────────────────────────────────────────────────

export function useTierProfiles(includeArchived = false) {
  return useQuery({
    queryKey: ['tier-profiles'],
    queryFn: () => getTierProfiles(true),
    staleTime: 120_000,
    select: (data: TierProfile[]) =>
      includeArchived ? data : data.filter(t => !t.isArchived),
  });
}

export function useTierProfile(id: string) {
  return useQuery({
    queryKey: ['tier-profiles', id],
    queryFn: () => getTierProfileById(id),
    enabled: !!id,
  });
}

export function useTierProfileActions() {
  const qc = useQueryClient();
  const addToast = useUIStore(s => s.addToast);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tier-profiles'] });

  const create = useMutation({
    mutationFn: (data: Parameters<typeof createTierProfile>[0]) => createTierProfile(data),
    onSuccess: () => { invalidate(); addToast('Tier profile created', 'success'); },
    onError: () => addToast('Failed to create tier profile', 'error'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTierProfile>[1] }) =>
      updateTierProfile(id, data),
    onSuccess: () => { invalidate(); addToast('Tier profile updated', 'success'); },
    onError: () => addToast('Failed to update tier profile', 'error'),
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveTierProfile(id),
    onSuccess: () => { invalidate(); addToast('Tier profile archived', 'success'); },
    onError: () => addToast('Failed to archive tier profile', 'error'),
  });

  return { create, update, archive };
}

// ── Workflows ─────────────────────────────────────────────────────────────────

export function useWorkflows(status?: WorkflowStatus, environment?: WorkflowEnvironment | 'all') {
  return useQuery({
    queryKey: ['workflows', status ?? 'all', environment ?? 'all'],
    queryFn: () => getWorkflows(status, environment),
    staleTime: 30_000,
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: () => getWorkflowById(id),
    enabled: !!id,
  });
}

export function useWorkflowActions() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const addToast = useUIStore(s => s.addToast);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['workflows'] });

  const create = useMutation({
    mutationFn: (
      data: Pick<Workflow, 'name' | 'description'> &
        Partial<Pick<Workflow, 'environment' | 'tags' | 'industryVertical'>>
    ) => createWorkflow(data),
    onSuccess: () => { invalidate(); addToast('Workflow created', 'success'); },
    onError: () => addToast('Failed to create workflow', 'error'),
  });

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<
        Pick<Workflow, 'name' | 'description' | 'steps' | 'edges' | 'environment' | 'tags' | 'industryVertical'>
      >;
      silent?: boolean;
    }) => updateWorkflow(id, data),
    onSuccess: (_d, vars) => {
      invalidate();
      if (!vars.silent) addToast('Workflow saved', 'success');
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  const publish = useMutation({
    mutationFn: (id: string) => publishWorkflow(id),
    onSuccess: () => { invalidate(); addToast('Workflow published', 'success'); },
    onError: (err: Error) => addToast(err.message || 'Failed to publish workflow', 'error'),
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveWorkflow(id),
    onSuccess: () => { invalidate(); addToast('Workflow archived', 'success'); },
    onError: () => addToast('Failed to archive workflow', 'error'),
  });

  const clone = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => cloneWorkflow(id, newName),
    onSuccess: () => { invalidate(); addToast('Workflow cloned as draft', 'success'); },
    onError: () => addToast('Failed to clone workflow', 'error'),
  });

  const cloneSandbox = useMutation({
    mutationFn: (id: string) => cloneWorkflowToSandbox(id),
    onSuccess: w => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['workflows', w.id] });
      addToast('Sandbox draft created — safe to experiment', 'success');
      navigate(`/workflows/${w.id}`);
    },
    onError: () => addToast('Failed to create sandbox copy', 'error'),
  });

  const dryRun = useMutation({
    mutationFn: (workflowId: string) => dryRunWorkflow(workflowId),
    onError: () => addToast('Simulation failed', 'error'),
  });

  const addStep = useMutation({
    mutationFn: ({ id, step }: { id: string; step: WorkflowStepCreate }) => addWorkflowStep(id, step),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['workflows', id] });
    },
    onError: (err: Error) => {
      addToast(err?.message?.trim() ? err.message : 'Failed to add step', 'error');
    },
  });

  const removeStep = useMutation({
    mutationFn: ({ id, nodeId }: { id: string; nodeId: string }) => removeWorkflowStep(id, nodeId),
    onSuccess: (_data, { id }) => { qc.invalidateQueries({ queryKey: ['workflows', id] }); },
    onError: () => addToast('Failed to remove step', 'error'),
  });

  const syncGraph = useMutation({
    mutationFn: ({
      id,
      steps,
      edges,
    }: {
      id: string;
      steps: WorkflowStep[];
      edges: WorkflowGraphEdge[];
    }) => syncWorkflowGraph(id, { steps, edges }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['workflows', id] });
      qc.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  });

  return { create, update, publish, archive, clone, cloneSandbox, dryRun, addStep, removeStep, syncGraph };
}

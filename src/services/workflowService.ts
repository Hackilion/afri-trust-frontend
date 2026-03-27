import {
  mockTierProfiles,
  mockWorkflows,
  mockSessions,
  CHECK_CATALOGUE,
} from '../mocks/workflows';
import { isLiveApi } from '../lib/apiConfig';
import {
  backendGetKycSummary,
  backendGetVerificationDetail,
  mapKycSessionsToVerificationSessions,
} from './backendApplicantsService';
import * as liveWf from './workflowLive';
import { resolveTierProfileForLiveStep } from '../lib/workflowTierResolution';
import {
  applyTopologicalOrder,
  buildLinearEdges,
  defaultStepPosition,
  graphHasCycle,
  newStepNodeId,
  normalizeWorkflowSteps,
} from '../lib/workflowGraph';
import { validateWorkflow, simulateWorkflowExecution } from '../lib/workflowValidation';
import type { DryRunResult } from '../lib/workflowValidation';
import type {
  TierProfile,
  Workflow,
  WorkflowEnvironment,
  WorkflowGraphEdge,
  WorkflowStep,
  WorkflowStatus,
  WorkflowStepCreate,
} from '../types';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

// ── Check Catalogue ───────────────────────────────────────────────────────────

export async function getCheckCatalogue() {
  if (isLiveApi()) return liveWf.liveGetCheckCatalogue();
  await delay(200);
  return [...CHECK_CATALOGUE];
}

// ── Tier Profiles ─────────────────────────────────────────────────────────────

export async function getTierProfiles(includeArchived = false) {
  if (isLiveApi()) return liveWf.liveGetTierProfiles(includeArchived);
  await delay();
  return mockTierProfiles.filter(t => includeArchived || !t.isArchived);
}

export async function getTierProfileById(id: string) {
  if (isLiveApi()) return liveWf.liveGetTierProfileById(id);
  await delay();
  return mockTierProfiles.find(t => t.id === id) ?? null;
}

export async function createTierProfile(
  data: Pick<TierProfile, 'name' | 'description' | 'requiredChecks' | 'requiredAttributes' | 'acceptedDocumentTypes' | 'settings'>
) {
  if (isLiveApi()) return liveWf.liveCreateTierProfile(data);
  await delay();
  const next: TierProfile = {
    ...data,
    id: `TP-${String(mockTierProfiles.length + 1).padStart(3, '0')}`,
    orgId: 'ORG-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'TM-001',
    isArchived: false,
  };
  mockTierProfiles.push(next);
  return next;
}

export async function updateTierProfile(
  id: string,
  data: Partial<Pick<TierProfile, 'name' | 'description' | 'requiredChecks' | 'requiredAttributes' | 'acceptedDocumentTypes' | 'settings'>>
) {
  if (isLiveApi()) return liveWf.liveUpdateTierProfile(id, data);
  await delay();
  const idx = mockTierProfiles.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Tier profile not found');
  mockTierProfiles[idx] = { ...mockTierProfiles[idx], ...data, updatedAt: new Date().toISOString() };
  return mockTierProfiles[idx];
}

export async function archiveTierProfile(id: string) {
  if (isLiveApi()) return liveWf.liveArchiveTierProfile(id);
  await delay();
  const idx = mockTierProfiles.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Tier profile not found');
  mockTierProfiles[idx] = { ...mockTierProfiles[idx], isArchived: true, updatedAt: new Date().toISOString() };
  return mockTierProfiles[idx];
}

// ── Workflows ─────────────────────────────────────────────────────────────────

export async function getWorkflows(
  status?: WorkflowStatus,
  environment?: WorkflowEnvironment | 'all'
) {
  if (isLiveApi()) return liveWf.liveGetWorkflows(status, environment);
  await delay();
  let list = [...mockWorkflows];
  if (status) list = list.filter(w => w.status === status);
  if (environment && environment !== 'all') {
    list = list.filter(w => (w.environment ?? 'production') === environment);
  }
  return list;
}

export async function getWorkflowById(id: string) {
  if (isLiveApi()) return liveWf.liveGetWorkflowById(id);
  await delay();
  const w = mockWorkflows.find(x => x.id === id) ?? null;
  if (!w) return null;
  const steps = normalizeWorkflowSteps(w.id, w.steps);
  const edges =
    w.edges && w.edges.length > 0 ? w.edges : buildLinearEdges(steps);
  return { ...w, steps, edges };
}

export async function createWorkflow(
  data: Pick<Workflow, 'name' | 'description'> &
    Partial<Pick<Workflow, 'environment' | 'tags' | 'industryVertical'>>
) {
  if (isLiveApi()) return liveWf.liveCreateWorkflow(data);
  await delay();
  const tags = data.tags?.map(t => t.trim()).filter(Boolean);
  const next: Workflow = {
    name: data.name,
    description: data.description,
    id: `WF-${String(mockWorkflows.length + 1).padStart(3, '0')}`,
    orgId: 'ORG-001',
    status: 'draft',
    steps: [],
    version: 1,
    environment: data.environment ?? 'production',
    tags: tags && tags.length ? [...new Set(tags)] : undefined,
    industryVertical: data.industryVertical?.trim() || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'TM-001',
  };
  mockWorkflows.push(next);
  return next;
}

export async function updateWorkflow(
  id: string,
  data: Partial<
    Pick<Workflow, 'name' | 'description' | 'steps' | 'edges' | 'environment' | 'tags' | 'industryVertical'>
  >
) {
  if (isLiveApi()) return liveWf.liveUpdateWorkflow(id, data);
  await delay();
  const idx = mockWorkflows.findIndex(w => w.id === id);
  if (idx === -1) throw new Error('Workflow not found');
  if (mockWorkflows[idx].status === 'published') throw new Error('Cannot edit a published workflow — clone it first');
  const next = { ...mockWorkflows[idx], ...data, updatedAt: new Date().toISOString() };
  if (data.tags !== undefined) {
    const t = data.tags.map(x => x.trim()).filter(Boolean);
    next.tags = t.length ? [...new Set(t)] : undefined;
  }
  if (data.steps !== undefined && data.edges === undefined) {
    next.edges = buildLinearEdges(normalizeWorkflowSteps(next.id, next.steps));
  }
  mockWorkflows[idx] = next;
  return mockWorkflows[idx];
}

export async function publishWorkflow(id: string) {
  if (isLiveApi()) {
    const w = await liveWf.liveGetWorkflowById(id);
    if (!w) throw new Error('Workflow not found');
    const tierList = await liveWf.liveGetTierProfiles(true);
    const tierIds = new Set(tierList.map(t => t.id));
    const validation = validateWorkflow(w, {
      strictIntegrationKeys: true,
      tierProfileIds: tierIds,
      checkCatalogue: CHECK_CATALOGUE,
    });
    if (!validation.canPublish) {
      throw new Error(validation.errors.map(e => e.message).join(' · '));
    }
    return liveWf.livePublishWorkflow(id);
  }
  await delay();
  const idx = mockWorkflows.findIndex(w => w.id === id);
  if (idx === -1) throw new Error('Workflow not found');
  const w = mockWorkflows[idx];
  const steps = normalizeWorkflowSteps(w.id, w.steps);
  const edges = w.edges && w.edges.length > 0 ? w.edges : buildLinearEdges(steps);
  const synthetic: Workflow = { ...w, steps, edges };
  const tierIds = new Set(mockTierProfiles.map(t => t.id));
  const validation = validateWorkflow(synthetic, {
    strictIntegrationKeys: true,
    tierProfileIds: tierIds,
    checkCatalogue: CHECK_CATALOGUE,
  });
  if (!validation.canPublish) {
    throw new Error(validation.errors.map(e => e.message).join(' · '));
  }
  mockWorkflows[idx] = {
    ...mockWorkflows[idx],
    status: 'published',
    publishedAt: new Date().toISOString(),
    version: mockWorkflows[idx].version + 1,
    updatedAt: new Date().toISOString(),
  };
  return mockWorkflows[idx];
}

export async function archiveWorkflow(id: string) {
  if (isLiveApi()) return liveWf.liveArchiveWorkflow(id);
  await delay();
  const idx = mockWorkflows.findIndex(w => w.id === id);
  if (idx === -1) throw new Error('Workflow not found');
  mockWorkflows[idx] = {
    ...mockWorkflows[idx],
    status: 'archived',
    archivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return mockWorkflows[idx];
}

export async function cloneWorkflow(id: string, newName: string) {
  if (isLiveApi()) return liveWf.liveCloneWorkflow(id, newName);
  await delay();
  const source = mockWorkflows.find(w => w.id === id);
  if (!source) throw new Error('Workflow not found');
  const next: Workflow = {
    ...source,
    id: `WF-${String(mockWorkflows.length + 1).padStart(3, '0')}`,
    name: newName,
    status: 'draft',
    version: 1,
    publishedAt: undefined,
    archivedAt: undefined,
    clonedFromId: id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'TM-001',
    environment: source.environment ?? 'production',
    edges: source.edges?.map(e => ({ ...e, id: `e-${newStepNodeId()}` })),
  };
  mockWorkflows.push(next);
  return next;
}

/** Clone as a new draft sandbox copy for safe experimentation. */
export async function cloneWorkflowToSandbox(sourceId: string) {
  if (isLiveApi()) return liveWf.liveCloneWorkflowToSandbox(sourceId);
  await delay();
  const source = mockWorkflows.find(w => w.id === sourceId);
  if (!source) throw new Error('Workflow not found');
  const baseName = source.name.replace(/\s*\(Sandbox\)\s*$/i, '').trim();
  const next: Workflow = {
    ...source,
    id: `WF-${String(mockWorkflows.length + 1).padStart(3, '0')}`,
    name: `${baseName} (Sandbox)`,
    status: 'draft',
    version: 1,
    environment: 'sandbox',
    publishedAt: undefined,
    archivedAt: undefined,
    clonedFromId: sourceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'TM-001',
    tags: source.tags ? [...source.tags, 'sandbox-clone'] : ['sandbox-clone'],
    edges: source.edges?.map(e => ({ ...e, id: `e-${newStepNodeId()}` })),
  };
  mockWorkflows.push(next);
  return next;
}

export async function addWorkflowStep(id: string, step: WorkflowStepCreate): Promise<Workflow> {
  if (isLiveApi()) {
    const tiers = await liveWf.liveGetTierProfiles(true);
    const resolved = resolveTierProfileForLiveStep(step, tiers);
    return liveWf.liveAddWorkflowStep(id, resolved);
  }
  await delay();
  const idx = mockWorkflows.findIndex(w => w.id === id);
  if (idx === -1) throw new Error('Workflow not found');
  const wf = mockWorkflows[idx];
  const nodeId = step.nodeId ?? newStepNodeId();
  const order = wf.steps.length + 1;
  const pos =
    step.position ??
    defaultStepPosition(wf.steps.length);
  const newStep: WorkflowStep = { ...step, nodeId, order, position: pos };
  const prevSteps = normalizeWorkflowSteps(wf.id, wf.steps);
  const edges: WorkflowGraphEdge[] =
    wf.edges && wf.edges.length > 0 ? [...wf.edges] : buildLinearEdges(prevSteps);
  if (prevSteps.length > 0) {
    const tail = [...prevSteps].sort((a, b) => a.order - b.order).at(-1)!;
    edges.push({
      id: `e-${tail.nodeId}-${nodeId}`,
      source: tail.nodeId,
      target: nodeId,
    });
  }
  const nextSteps = [...prevSteps, newStep];
  const topo = applyTopologicalOrder(nextSteps, edges);
  mockWorkflows[idx] = {
    ...wf,
    steps: topo.ok ? topo.steps : nextSteps,
    edges,
    updatedAt: new Date().toISOString(),
  };
  return mockWorkflows[idx];
}

export async function removeWorkflowStep(workflowId: string, nodeId: string) {
  if (isLiveApi()) return liveWf.liveRemoveWorkflowStep(workflowId, nodeId);
  await delay();
  const idx = mockWorkflows.findIndex(w => w.id === workflowId);
  if (idx === -1) throw new Error('Workflow not found');
  const wf = mockWorkflows[idx];
  const prevSteps = normalizeWorkflowSteps(wf.id, wf.steps);
  const steps = prevSteps
    .filter(s => s.nodeId !== nodeId)
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i + 1 }));
  let edges = (wf.edges ?? buildLinearEdges(prevSteps)).filter(
    e => e.source !== nodeId && e.target !== nodeId
  );
  const ids = new Set(steps.map(s => s.nodeId));
  edges = edges.filter(e => ids.has(e.source) && ids.has(e.target));
  let topo = applyTopologicalOrder(steps, edges);
  if (!topo.ok) {
    edges = buildLinearEdges(steps);
    topo = applyTopologicalOrder(steps, edges);
  }
  mockWorkflows[idx] = {
    ...wf,
    steps: topo.ok ? topo.steps : steps,
    edges,
    updatedAt: new Date().toISOString(),
  };
  return mockWorkflows[idx];
}

/** Replace steps + edges from the graph editor (validates DAG). */
export async function syncWorkflowGraph(
  workflowId: string,
  payload: { steps: WorkflowStep[]; edges: WorkflowGraphEdge[] }
) {
  if (isLiveApi()) return liveWf.liveSyncWorkflowGraph(workflowId, payload);
  await delay();
  const idx = mockWorkflows.findIndex(w => w.id === workflowId);
  if (idx === -1) throw new Error('Workflow not found');
  if (mockWorkflows[idx].status === 'published') throw new Error('Cannot edit a published workflow — clone it first');
  const ids = new Set(payload.steps.map(s => s.nodeId));
  const stepEdges = payload.edges.filter(e => ids.has(e.source) && ids.has(e.target));
  if (graphHasCycle(stepEdges, ids)) throw new Error('That connection would create a cycle');
  const topo = applyTopologicalOrder(
    normalizeWorkflowSteps(workflowId, payload.steps),
    stepEdges
  );
  if (!topo.ok) throw new Error('Invalid graph: resolve branches or add missing links');
  mockWorkflows[idx] = {
    ...mockWorkflows[idx],
    steps: topo.steps,
    edges: stepEdges,
    updatedAt: new Date().toISOString(),
  };
  return mockWorkflows[idx];
}

export async function dryRunWorkflow(id: string): Promise<DryRunResult | null> {
  await delay(100);
  const w = await getWorkflowById(id);
  if (!w) return null;
  return simulateWorkflowExecution(w);
}

// ── Verification Sessions ─────────────────────────────────────────────────────

export async function getSessionsByApplicant(applicantId: string, workspaceOrgId: string | null) {
  if (isLiveApi() && workspaceOrgId) {
    const kyc = await backendGetKycSummary(applicantId);
    return mapKycSessionsToVerificationSessions(applicantId, workspaceOrgId, kyc);
  }
  await delay();
  return mockSessions.filter(s => s.applicantId === applicantId);
}

export async function getSessionById(id: string) {
  if (isLiveApi()) {
    return backendGetVerificationDetail(id);
  }
  await delay();
  return mockSessions.find(s => s.id === id) ?? null;
}

export async function getStepChecks(sessionId: string, stepOrder: number) {
  if (isLiveApi()) {
    const session = await backendGetVerificationDetail(sessionId);
    if (!session) return [];
    const step = session.steps.find(s => s.order === stepOrder);
    return step?.checks ?? [];
  }
  await delay(200);
  const session = mockSessions.find(s => s.id === sessionId);
  if (!session) return [];
  const st = session.steps.find(s => s.order === stepOrder);
  return st?.checks ?? [];
}

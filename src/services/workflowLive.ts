/**
 * Live AfriTrust API implementations for workflowService (requires JWT session).
 */
import type {
  TierProfile,
  Workflow,
  WorkflowEnvironment,
  WorkflowGraphEdge,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepCreate,
} from '../types';
import { buildLinearEdges, normalizeWorkflowSteps } from '../lib/workflowGraph';
import {
  assertLinearChainForApi,
  checkCatalogueForBackendApi,
  orderedStepsForSync,
  tierProfileToFrontend,
  workflowDetailToFrontend,
  workflowListItemToFrontend,
  checksToBackendValues,
  attributeSchemaFromKeys,
  documentsToBackend,
} from '../lib/workflowBackendMap';
import { resolveTierProfileForLiveStep } from '../lib/workflowTierResolution';
import {
  apiAddWorkflowStep,
  apiArchiveTierProfile,
  apiArchiveWorkflow,
  apiCheckCatalogue,
  apiCloneWorkflow,
  apiCreateTierProfile,
  apiCreateWorkflow,
  apiGetTierProfile,
  apiGetWorkflow,
  apiListTierProfiles,
  apiListWorkflows,
  apiPublishWorkflow,
  apiRemoveWorkflowStep,
  apiUpdateTierProfile,
  apiUpdateWorkflow,
} from './workflowBackendApi';

export async function liveGetCheckCatalogue() {
  const raw = await apiCheckCatalogue();
  return checkCatalogueForBackendApi(raw);
}

export async function liveGetTierProfiles(includeArchived: boolean): Promise<TierProfile[]> {
  const rows = await apiListTierProfiles({ includeInactive: includeArchived });
  return rows.map(tierProfileToFrontend);
}

export async function liveGetTierProfileById(id: string): Promise<TierProfile | null> {
  try {
    const tp = await apiGetTierProfile(id);
    return tierProfileToFrontend(tp);
  } catch {
    return null;
  }
}

export async function liveCreateTierProfile(
  data: Pick<
    TierProfile,
    'name' | 'description' | 'requiredChecks' | 'requiredAttributes' | 'acceptedDocumentTypes' | 'settings'
  >
): Promise<TierProfile> {
  const tp = await apiCreateTierProfile({
    name: data.name,
    description: data.description?.trim() || null,
    required_checks: checksToBackendValues(data.requiredChecks),
    attribute_schema: attributeSchemaFromKeys(data.requiredAttributes),
    accepted_document_types: documentsToBackend(data.acceptedDocumentTypes),
    settings: { ...(data.settings as unknown as Record<string, unknown>) },
  });
  return tierProfileToFrontend(tp);
}

export async function liveUpdateTierProfile(
  id: string,
  data: Partial<
    Pick<TierProfile, 'name' | 'description' | 'requiredChecks' | 'requiredAttributes' | 'acceptedDocumentTypes' | 'settings'>
  >
): Promise<TierProfile> {
  const body: Parameters<typeof apiUpdateTierProfile>[1] = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.description !== undefined) body.description = data.description;
  if (data.requiredChecks !== undefined) body.required_checks = checksToBackendValues(data.requiredChecks);
  if (data.requiredAttributes !== undefined) body.attribute_schema = attributeSchemaFromKeys(data.requiredAttributes);
  if (data.acceptedDocumentTypes !== undefined) {
    body.accepted_document_types = documentsToBackend(data.acceptedDocumentTypes);
  }
  if (data.settings !== undefined) {
    body.settings = data.settings as unknown as Record<string, unknown>;
  }
  const tp = await apiUpdateTierProfile(id, body);
  return tierProfileToFrontend(tp);
}

export async function liveArchiveTierProfile(id: string): Promise<TierProfile> {
  await apiArchiveTierProfile(id);
  const tp = await apiGetTierProfile(id);
  return tierProfileToFrontend(tp);
}

function inferEnvironment(name: string): WorkflowEnvironment {
  return name.toLowerCase().includes('(sandbox)') ? 'sandbox' : 'production';
}

export async function liveGetWorkflows(
  status?: WorkflowStatus,
  environment?: WorkflowEnvironment | 'all'
): Promise<Workflow[]> {
  const list = await apiListWorkflows(status);
  let mapped = list.map(w => {
    const base = workflowListItemToFrontend(w);
    return { ...base, environment: inferEnvironment(w.name) };
  });
  if (environment && environment !== 'all') {
    mapped = mapped.filter(w => w.environment === environment);
  }
  return mapped;
}

export async function liveGetWorkflowById(id: string): Promise<Workflow | null> {
  try {
    const w = await apiGetWorkflow(id);
    const wf = workflowDetailToFrontend(w);
    return { ...wf, environment: inferEnvironment(w.name) };
  } catch {
    return null;
  }
}

export async function liveCreateWorkflow(
  data: Pick<Workflow, 'name' | 'description'> &
    Partial<Pick<Workflow, 'environment' | 'tags' | 'industryVertical'>>
): Promise<Workflow> {
  let w = await apiCreateWorkflow({
    name: data.name.trim(),
    description: data.description?.trim() || null,
  });
  if (data.environment === 'sandbox' && !w.name.toLowerCase().includes('sandbox')) {
    w = await apiUpdateWorkflow(w.id, { name: `${w.name} (Sandbox)` });
  }
  const wf = workflowDetailToFrontend(w);
  return {
    ...wf,
    environment: data.environment ?? inferEnvironment(w.name),
    tags: data.tags,
    industryVertical: data.industryVertical,
  };
}

export async function liveUpdateWorkflow(
  id: string,
  data: Partial<
    Pick<Workflow, 'name' | 'description' | 'steps' | 'edges' | 'environment' | 'tags' | 'industryVertical'>
  >
): Promise<Workflow> {
  if (data.steps !== undefined) {
    const edges = data.edges ?? buildLinearEdges(normalizeWorkflowSteps(id, data.steps));
    return liveSyncWorkflowGraph(id, { steps: data.steps, edges });
  }
  const body: { name?: string; description?: string } = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.description !== undefined) body.description = data.description;
  if (Object.keys(body).length === 0) {
    const w = await apiGetWorkflow(id);
    const base = { ...workflowDetailToFrontend(w), environment: inferEnvironment(w.name) };
    return {
      ...base,
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.industryVertical !== undefined ? { industryVertical: data.industryVertical } : {}),
      ...(data.environment !== undefined ? { environment: data.environment } : {}),
    };
  }
  const w = await apiUpdateWorkflow(id, body);
  const base = { ...workflowDetailToFrontend(w), environment: inferEnvironment(w.name) };
  return {
    ...base,
    ...(data.tags !== undefined ? { tags: data.tags } : {}),
    ...(data.industryVertical !== undefined ? { industryVertical: data.industryVertical } : {}),
    ...(data.environment !== undefined ? { environment: data.environment } : {}),
  };
}

export async function livePublishWorkflow(id: string): Promise<Workflow> {
  const w = await apiPublishWorkflow(id);
  return { ...workflowDetailToFrontend(w), environment: inferEnvironment(w.name) };
}

export async function liveArchiveWorkflow(id: string): Promise<Workflow> {
  const w = await apiArchiveWorkflow(id);
  const wf = workflowDetailToFrontend(w);
  return {
    ...wf,
    archivedAt: wf.updatedAt,
    environment: inferEnvironment(w.name),
  };
}

export async function liveCloneWorkflow(id: string, newName: string): Promise<Workflow> {
  let w = await apiCloneWorkflow(id);
  const name = newName.trim() || w.name;
  if (name !== w.name) {
    w = await apiUpdateWorkflow(w.id, { name });
  }
  return { ...workflowDetailToFrontend(w), environment: inferEnvironment(w.name) };
}

export async function liveCloneWorkflowToSandbox(sourceId: string): Promise<Workflow> {
  let w = await apiCloneWorkflow(sourceId);
  const base = w.name.replace(/\s*\(copy\)\s*$/i, '').replace(/\s*\(sandbox\)\s*$/i, '').trim();
  const name = `${base} (Sandbox)`;
  w = await apiUpdateWorkflow(w.id, { name });
  return { ...workflowDetailToFrontend(w), environment: 'sandbox' };
}

export async function liveAddWorkflowStep(workflowId: string, step: WorkflowStepCreate): Promise<Workflow> {
  if (!step.tierProfileId?.trim()) {
    throw new Error(
      'Live API: each step must use a tier profile. Add a tier-backed step from the Tier profiles list, or open Settings → Tier profiles to create one.'
    );
  }
  const wf = await apiGetWorkflow(workflowId);
  if (wf.status !== 'draft') {
    throw new Error('Cannot edit a published workflow — clone it first');
  }
  const nextOrder = wf.steps.length ? Math.max(...wf.steps.map(s => s.step_order)) + 1 : 1;
  await apiAddWorkflowStep(workflowId, {
    tier_profile_id: step.tierProfileId.trim(),
    step_order: nextOrder,
    is_optional: Boolean(step.isOptional || step.required === false),
  });
  const fresh = await apiGetWorkflow(workflowId);
  return { ...workflowDetailToFrontend(fresh), environment: inferEnvironment(fresh.name) };
}

export async function liveRemoveWorkflowStep(workflowId: string, nodeId: string): Promise<Workflow> {
  if (!nodeId.startsWith('s-')) {
    throw new Error('Invalid step id — reload the workflow from the server.');
  }
  const stepId = nodeId.slice(2);
  await apiRemoveWorkflowStep(workflowId, stepId);
  const fresh = await apiGetWorkflow(workflowId);
  return { ...workflowDetailToFrontend(fresh), environment: inferEnvironment(fresh.name) };
}

export async function liveSyncWorkflowGraph(
  workflowId: string,
  payload: { steps: WorkflowStep[]; edges: WorkflowGraphEdge[] }
): Promise<Workflow> {
  const { steps, edges } = payload;
  assertLinearChainForApi(steps, edges);
  const orderedRaw = orderedStepsForSync(steps, edges);
  const tierRows = await apiListTierProfiles({ includeInactive: false });
  const tiers = tierRows.map(tierProfileToFrontend);
  const ordered: WorkflowStep[] = [];
  for (const s of orderedRaw) {
    const r = resolveTierProfileForLiveStep(
      {
        stepType: s.stepType,
        checks: s.checks,
        label: s.label,
        required: s.required,
        isOptional: s.isOptional,
        integrationKey: s.integrationKey,
        metadata: s.metadata,
        tierProfileId: s.tierProfileId,
      },
      tiers
    );
    ordered.push({
      ...s,
      tierProfileId: r.tierProfileId!,
      checks: r.checks ?? s.checks,
      label: r.label ?? s.label,
    });
  }
  let wf = await apiGetWorkflow(workflowId);
  if (wf.status !== 'draft') {
    throw new Error('Cannot edit a published workflow — clone it first');
  }
  const sortedRemote = [...wf.steps].sort((a, b) => b.step_order - a.step_order);
  for (const st of sortedRemote) {
    await apiRemoveWorkflowStep(workflowId, st.id);
  }
  for (let i = 0; i < ordered.length; i++) {
    const s = ordered[i];
    await apiAddWorkflowStep(workflowId, {
      tier_profile_id: s.tierProfileId!.trim(),
      step_order: i + 1,
      is_optional: Boolean(s.isOptional || s.required === false),
    });
  }
  const fresh = await apiGetWorkflow(workflowId);
  return { ...workflowDetailToFrontend(fresh), environment: inferEnvironment(fresh.name) };
}

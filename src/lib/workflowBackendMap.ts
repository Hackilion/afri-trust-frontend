import { CHECK_CATALOGUE } from '../mocks/workflows';
import { applyTopologicalOrder, buildLinearEdges, normalizeWorkflowSteps } from './workflowGraph';
import type {
  CheckCatalogueEntry,
  CheckCatalogueId,
  DocumentType,
  TierProfile,
  Workflow,
  WorkflowGraphEdge,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepType,
} from '../types';
import type { BackendTierProfile, BackendWorkflowDetail, BackendWorkflowListItem } from '../services/workflowBackendApi';

/** Map UI check ids → AfriTrust `CheckType` values (POST tier profile). */
export const CHECK_CATALOGUE_ID_TO_BACKEND: Partial<Record<CheckCatalogueId, string>> = {
  email_verification: 'email',
  phone_verification: 'phone',
  liveness: 'liveness',
  video_selfie: 'liveness',
  face_match: 'face_match',
  document_authenticity: 'government_id',
  document_expiry: 'government_id',
  registry_document: 'government_id',
  watchlist: 'aml_screening',
  pep: 'pep_screening',
  adverse_media: 'aml_screening',
  address_verification: 'address_proof',
  biometric_dedup: 'selfie',
  selfie_capture: 'selfie',
  database_lookup: 'aml_screening',
};

const BACKEND_CHECK_TO_CATALOGUE: Record<string, CheckCatalogueId> = {
  email: 'email_verification',
  phone: 'phone_verification',
  selfie: 'liveness',
  government_id: 'document_authenticity',
  face_match: 'face_match',
  liveness: 'liveness',
  address_proof: 'address_verification',
  pep_screening: 'pep',
  aml_screening: 'watchlist',
};

/** Map UI document types → backend `DocumentType` enum strings. */
const DOC_TO_BACKEND: Partial<Record<DocumentType, string>> = {
  passport: 'passport',
  national_id: 'national_id',
  drivers_license: 'drivers_license',
  voters_card: 'voter_card',
  ghana_card: 'national_id',
  nin: 'national_id',
  bvn: 'national_id',
  alien_card: 'residence_permit',
};

export function checksToBackendValues(checks: CheckCatalogueId[]): string[] {
  const out: string[] = [];
  for (const c of checks) {
    const v = CHECK_CATALOGUE_ID_TO_BACKEND[c];
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

export function checksFromBackend(required: string[]): CheckCatalogueId[] {
  const out: CheckCatalogueId[] = [];
  for (const r of required) {
    const m = BACKEND_CHECK_TO_CATALOGUE[r];
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}

export function documentsToBackend(docs: DocumentType[]): string[] {
  return docs.map(d => DOC_TO_BACKEND[d] ?? 'national_id');
}

const BACKEND_DOC_TO_UI: Record<string, DocumentType> = {
  passport: 'passport',
  national_id: 'national_id',
  drivers_license: 'drivers_license',
  voter_card: 'voters_card',
  residence_permit: 'alien_card',
  address_proof: 'national_id',
  other: 'national_id',
};

export function documentsFromBackend(values: string[]): DocumentType[] {
  return values.map(v => BACKEND_DOC_TO_UI[v] ?? 'national_id');
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
}

export function attributeSchemaFromKeys(keys: string[]) {
  return keys.map(key => ({
    key,
    label: humanizeKey(key),
    data_type: 'string',
    required: true,
  }));
}

export function requiredAttributesFromSchema(schema: { key: string; required?: boolean }[]): string[] {
  return schema.filter(a => a.required !== false).map(a => a.key);
}

export function tierProfileSettingsFromBackend(s: Record<string, unknown>): TierProfile['settings'] {
  return {
    allowManualReview: Boolean(s.allowManualReview ?? s.allow_manual_review ?? false),
    autoApproveOnPass: Boolean(s.autoApproveOnPass ?? s.auto_approve_on_pass ?? true),
    expiryDays: typeof s.expiryDays === 'number' ? s.expiryDays : typeof s.expiry_days === 'number' ? s.expiry_days : undefined,
    resubmissionAllowed: Boolean(s.resubmissionAllowed ?? s.resubmission_allowed ?? true),
    allowSelfie: Boolean(s.allowSelfie ?? s.allow_selfie ?? true),
    requireLiveness: Boolean(s.requireLiveness ?? s.require_liveness ?? false),
  };
}

export function tierProfileToFrontend(tp: BackendTierProfile): TierProfile {
  return {
    id: tp.id,
    orgId: tp.org_id,
    name: tp.name,
    description: tp.description ?? '',
    requiredChecks: checksFromBackend(tp.required_checks),
    requiredAttributes: requiredAttributesFromSchema(tp.attribute_schema ?? []),
    acceptedDocumentTypes: documentsFromBackend(tp.accepted_document_types ?? []),
    settings: tierProfileSettingsFromBackend(tp.settings ?? {}),
    createdAt: tp.created_at,
    updatedAt: tp.updated_at,
    createdBy: '—',
    isArchived: !tp.is_active,
  };
}

const DEFAULT_STEP_TYPE: WorkflowStepType = 'data_form';

export function backendStepToWorkflowStep(step: BackendWorkflowDetail['steps'][0]): WorkflowStep {
  return {
    nodeId: `s-${step.id}`,
    order: step.step_order,
    stepType: DEFAULT_STEP_TYPE,
    tierProfileId: step.tier_profile_id,
    label: step.tier_profile_name ?? undefined,
    isOptional: step.is_optional,
    required: !step.is_optional,
    position: { x: 80 + (step.step_order - 1) * 280, y: 160 },
  };
}

export function workflowDetailToFrontend(w: BackendWorkflowDetail): Workflow {
  const steps = [...w.steps]
    .sort((a, b) => a.step_order - b.step_order)
    .map(s => backendStepToWorkflowStep(s));
  const norm = normalizeWorkflowSteps(w.id, steps);
  const edges = buildLinearEdges(norm);
  return {
    id: w.id,
    orgId: w.org_id,
    name: w.name,
    description: w.description ?? '',
    status: w.status as WorkflowStatus,
    steps: norm,
    edges,
    version: w.version,
    publishedAt: w.published_at ?? undefined,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
    createdBy: '—',
    environment: 'production',
  };
}

export function workflowListItemToFrontend(w: BackendWorkflowListItem): Workflow {
  return {
    id: w.id,
    orgId: w.org_id,
    name: w.name,
    description: w.description ?? '',
    status: w.status as WorkflowStatus,
    steps: [],
    version: w.version,
    publishedAt: w.published_at ?? undefined,
    createdAt: w.created_at,
    updatedAt: w.created_at,
    createdBy: '—',
    environment: 'production',
  };
}

/** Merge static catalogue labels with backend enum metadata (optional). */
export function mergeCheckCatalogue(backend?: { check_types: { value: string; label: string }[] }): CheckCatalogueEntry[] {
  if (!backend?.check_types?.length) return [...CHECK_CATALOGUE];
  const byBackend = new Map(backend.check_types.map(c => [c.value, c.label]));
  return CHECK_CATALOGUE.map(entry => {
    const b = CHECK_CATALOGUE_ID_TO_BACKEND[entry.id];
    const bl = b ? byBackend.get(b) : undefined;
    return bl ? { ...entry, label: bl } : entry;
  });
}

/**
 * Catalogue entries that map to a `CheckType` exposed by the running API (for workflow builder + tier forms).
 */
export function checkCatalogueForBackendApi(backend: {
  check_types: { value: string; label: string }[];
}): CheckCatalogueEntry[] {
  const allowed = new Set(backend.check_types.map(c => c.value));
  const labelByValue = new Map(backend.check_types.map(c => [c.value, c.label]));
  return CHECK_CATALOGUE.filter(entry => {
    const b = CHECK_CATALOGUE_ID_TO_BACKEND[entry.id];
    return Boolean(b && allowed.has(b));
  }).map(entry => {
    const b = CHECK_CATALOGUE_ID_TO_BACKEND[entry.id]!;
    const lbl = labelByValue.get(b);
    return { ...entry, label: lbl ?? entry.label };
  });
}

export function assertLinearChainForApi(steps: WorkflowStep[], edges: WorkflowGraphEdge[]) {
  const ids = new Set(steps.map(s => s.nodeId));
  if (ids.size <= 1) return;
  const persisted = edges.filter(e => ids.has(e.source) && ids.has(e.target));
  const inn = new Map<string, number>();
  const out = new Map<string, number>();
  for (const id of ids) {
    inn.set(id, 0);
    out.set(id, 0);
  }
  for (const e of persisted) {
    out.set(e.source, (out.get(e.source) ?? 0) + 1);
    inn.set(e.target, (inn.get(e.target) ?? 0) + 1);
  }
  const roots = [...ids].filter(id => (inn.get(id) ?? 0) === 0);
  if (roots.length !== 1) {
    throw new Error(
      'AfriTrust API only supports a single linear workflow: connect steps in one sequence (one starting step).'
    );
  }
  for (const id of ids) {
    if ((out.get(id) ?? 0) > 1) {
      throw new Error('AfriTrust API does not support branching — each step may link to at most one next step.');
    }
  }
}

export function orderedStepsForSync(steps: WorkflowStep[], edges: WorkflowGraphEdge[]): WorkflowStep[] {
  const norm = normalizeWorkflowSteps('', steps);
  const e = edges.length ? edges : buildLinearEdges(norm);
  const topo = applyTopologicalOrder(norm, e);
  if (!topo.ok) throw new Error('Invalid workflow graph: fix cycles or disconnected steps.');
  return topo.steps;
}

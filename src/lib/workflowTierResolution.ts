import { checksToBackendValues } from './workflowBackendMap';

/** Tier matching: backend treats selfie + liveness as one biometric capture lane (see verifications upload). */
function tierCoversBackendNeed(tierBackend: Set<string>, need: string): boolean {
  if (tierBackend.has(need)) return true;
  if (need === 'selfie' || need === 'liveness') {
    return tierBackend.has('selfie') || tierBackend.has('liveness');
  }
  return false;
}
import type {
  CheckCatalogueEntry,
  CheckCatalogueId,
  TierProfile,
  WorkflowStepCreate,
  WorkflowStepType,
} from '../types';

/** Default step type for a catalogue check when building live API steps. */
export function stepTypeForCatalogueCheck(id: CheckCatalogueId): WorkflowStepType {
  if (id === 'watchlist' || id === 'pep' || id === 'adverse_media') return 'aml_screen';
  if (
    id === 'liveness' ||
    id === 'face_match' ||
    id === 'biometric_dedup' ||
    id === 'selfie_capture' ||
    id === 'video_selfie'
  ) {
    return 'liveness_check';
  }
  if (
    id === 'document_authenticity' ||
    id === 'document_expiry' ||
    id === 'address_verification' ||
    id === 'registry_document'
  ) {
    return 'document_upload';
  }
  return 'data_form';
}

/** Catalogue check ids allowed for each builder step type (live + mock). */
export function checkCatalogueIdsForStepType(stepType: WorkflowStepType): CheckCatalogueId[] {
  switch (stepType) {
    case 'data_form':
      return ['email_verification', 'phone_verification', 'database_lookup'];
    case 'document_upload':
      return ['document_authenticity', 'document_expiry', 'address_verification', 'registry_document'];
    case 'liveness_check':
      return ['liveness', 'video_selfie', 'face_match', 'selfie_capture', 'biometric_dedup'];
    case 'aml_screen':
      return ['watchlist', 'pep', 'adverse_media'];
    case 'manual_review':
    case 'webhook':
    case 'custom':
    default:
      return [];
  }
}

export function filterCatalogueByStepType(
  stepType: WorkflowStepType,
  entries: CheckCatalogueEntry[]
): CheckCatalogueEntry[] {
  const allowed = new Set(checkCatalogueIdsForStepType(stepType));
  return entries.filter(e => allowed.has(e.id));
}

/** Step types the AfriTrust backend can represent via tier profiles (no arbitrary webhooks). */
export const LIVE_API_STEP_TYPES: WorkflowStepType[] = [
  'data_form',
  'document_upload',
  'liveness_check',
  'aml_screen',
];

export function inferDefaultChecksForStepType(stepType: WorkflowStepType): CheckCatalogueId[] {
  switch (stepType) {
    case 'data_form':
      return ['email_verification', 'phone_verification'];
    case 'document_upload':
      return ['document_authenticity'];
    case 'liveness_check':
      return ['liveness'];
    case 'aml_screen':
      return ['watchlist'];
    default:
      return [];
  }
}

/**
 * Find an active tier whose required checks are a superset of `needed`.
 * Prefers the tier with the fewest extra checks (minimal match).
 */
/**
 * Tier match uses **backend** check keys (e.g. document_authenticity + document_expiry → `government_id`),
 * so a single `government_id` on the tier still satisfies both UI checks.
 */
export function findTierCoveringChecks(tiers: TierProfile[], needed: CheckCatalogueId[]): TierProfile | null {
  if (needed.length === 0) return null;
  const neededBackend = checksToBackendValues(needed);
  if (neededBackend.length === 0) return null;
  const neededSet = new Set(neededBackend);
  const active = tiers.filter(t => !t.isArchived);
  const matches = active.filter(t => {
    const tierSet = new Set(checksToBackendValues(t.requiredChecks));
    return [...neededSet].every(b => tierCoversBackendNeed(tierSet, b));
  });
  if (matches.length === 0) return null;
  matches.sort(
    (a, b) => checksToBackendValues(a.requiredChecks).length - checksToBackendValues(b.requiredChecks).length
  );
  return matches[0] ?? null;
}

/**
 * Ensures `tierProfileId` is set for live API: uses explicit id, or finds a tier that covers `checks`
 * / step-type defaults.
 */
export function resolveTierProfileForLiveStep(
  step: WorkflowStepCreate,
  tiers: TierProfile[]
): WorkflowStepCreate {
  if (step.tierProfileId?.trim()) {
    return { ...step, tierProfileId: step.tierProfileId.trim() };
  }

  if (step.stepType === 'custom' || step.stepType === 'webhook' || step.stepType === 'manual_review') {
    throw new Error(
      'Live API workflows only support tier-profile steps. Use a tier from the library or step types: data form, document, liveness, AML.'
    );
  }

  let needed = step.checks?.filter(Boolean) ?? [];
  if (needed.length === 0) {
    needed = inferDefaultChecksForStepType(step.stepType);
  }
  if (needed.length === 0) {
    throw new Error(
      'Live API: pick at least one check, or drag a tier profile onto the canvas to add a step.'
    );
  }

  const match = findTierCoveringChecks(tiers, needed);
  if (!match) {
    const backendNeeded = checksToBackendValues(needed);
    throw new Error(
      `No tier profile covers all required checks (${backendNeeded.join(', ')}). Open Settings → Tier profiles and add those check types, or drag a tier from the library.`
    );
  }

  return {
    ...step,
    tierProfileId: match.id,
    checks: needed,
    label: step.label ?? match.name,
  };
}

import type { CheckCatalogueEntry, Workflow, WorkflowGraphEdge, WorkflowStep } from '../types';
import {
  buildLinearEdges,
  graphHasCycle,
  normalizeWorkflowSteps,
  unreachableStepNodeIds,
  applyTopologicalOrder,
  executionWaves,
} from './workflowGraph';

export type WorkflowValidationIssue = {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  nodeId?: string;
};

export type WorkflowValidationResult = {
  issues: WorkflowValidationIssue[];
  errors: WorkflowValidationIssue[];
  warnings: WorkflowValidationIssue[];
  canPublish: boolean;
};

const INTEGRATION_KEY_RE = /^[a-z][a-z0-9_.-]{1,62}$/i;

function resolvedEdges(workflow: Workflow): WorkflowGraphEdge[] {
  const steps = normalizeWorkflowSteps(workflow.id, workflow.steps);
  return workflow.edges && workflow.edges.length > 0 ? workflow.edges : buildLinearEdges(steps);
}

/**
 * Validates a workflow graph and metadata. Pass a workflow with normalized steps and resolved edges (e.g. from getWorkflowById).
 */
export function validateWorkflow(
  workflow: Workflow,
  options?: {
    /** When true, custom/webhook steps without integrationKey are errors. */
    strictIntegrationKeys?: boolean;
    tierProfileIds?: Set<string>;
    checkCatalogue?: CheckCatalogueEntry[];
  }
): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = [];
  const strict = options?.strictIntegrationKeys ?? false;
  const tierIds = options?.tierProfileIds;
  const catalogue = options?.checkCatalogue ?? [];

  const name = workflow.name?.trim() ?? '';
  if (!name) {
    issues.push({ code: 'NAME_REQUIRED', severity: 'error', message: 'Workflow name is required.' });
  } else if (name.length > 160) {
    issues.push({
      code: 'NAME_TOO_LONG',
      severity: 'error',
      message: 'Workflow name must be at most 160 characters.',
    });
  }

  if (workflow.description && workflow.description.length > 4000) {
    issues.push({
      code: 'DESCRIPTION_TOO_LONG',
      severity: 'warning',
      message: 'Description is very long; consider shortening for operator clarity.',
    });
  }

  const steps = normalizeWorkflowSteps(workflow.id, workflow.steps);
  const edges = resolvedEdges(workflow);
  const ids = new Set(steps.map(s => s.nodeId));

  if (steps.length === 0) {
    issues.push({
      code: 'NO_STEPS',
      severity: 'error',
      message: 'Add at least one step before publishing.',
    });
  }

  const stepEdges = edges.filter(e => ids.has(e.source) && ids.has(e.target));
  if (steps.length > 0 && graphHasCycle(stepEdges, ids)) {
    issues.push({
      code: 'GRAPH_CYCLE',
      severity: 'error',
      message: 'The flow contains a cycle. Remove a link to form a directed acyclic graph.',
    });
  }

  const topo = applyTopologicalOrder(steps, stepEdges);
  if (steps.length > 0 && !topo.ok) {
    issues.push({
      code: 'GRAPH_INVALID',
      severity: 'error',
      message: 'Graph could not be ordered. Ensure every step is reachable and links are valid.',
    });
  }

  const unreachable = unreachableStepNodeIds(steps, stepEdges);
  for (const nid of unreachable) {
    issues.push({
      code: 'UNREACHABLE_STEP',
      severity: 'error',
      message: 'This step is not reachable from the flow entry. Connect it or remove it.',
      nodeId: nid,
    });
  }

  const integrationKeys = new Map<string, string>();
  for (const s of steps) {
    if (tierIds && s.tierProfileId && !tierIds.has(s.tierProfileId)) {
      issues.push({
        code: 'UNKNOWN_TIER',
        severity: 'error',
        message: `Tier profile "${s.tierProfileId}" does not exist or is not available.`,
        nodeId: s.nodeId,
      });
    }

    if (s.stepType === 'custom' || s.stepType === 'webhook') {
      const key = s.integrationKey?.trim();
      if (!key) {
        issues.push({
          code: 'INTEGRATION_KEY_MISSING',
          severity: strict ? 'error' : 'warning',
          message:
            strict || s.stepType === 'webhook'
              ? 'Webhook and custom steps should define an integration key for orchestration.'
              : 'Consider adding an integration key so backends can route this step.',
          nodeId: s.nodeId,
        });
      } else if (!INTEGRATION_KEY_RE.test(key)) {
        issues.push({
          code: 'INTEGRATION_KEY_FORMAT',
          severity: 'error',
          message:
            'Integration key must start with a letter and use only letters, numbers, dots, underscores, and hyphens (2–63 chars).',
          nodeId: s.nodeId,
        });
      } else if (integrationKeys.has(key)) {
        issues.push({
          code: 'DUPLICATE_INTEGRATION_KEY',
          severity: 'warning',
          message: `Duplicate integration key "${key}" across steps may confuse webhooks and audit logs.`,
          nodeId: s.nodeId,
        });
      } else {
        integrationKeys.set(key, s.nodeId);
      }
    }

    if (s.checks?.length && catalogue.length > 0) {
      const byId = new Map(catalogue.map(c => [c.id, c] as const));
      for (const cid of s.checks) {
        const entry = byId.get(cid);
        if (!entry) continue;
        if (entry.requiresBiometric && s.stepType !== 'liveness_check' && s.stepType !== 'document_upload') {
          issues.push({
            code: 'CHECK_CONTEXT',
            severity: 'warning',
            message: `Check "${entry.name}" typically expects a biometric or document step context.`,
            nodeId: s.nodeId,
          });
        }
      }
    }
  }

  if (workflow.environment === 'sandbox' && workflow.status === 'published') {
    issues.push({
      code: 'SANDBOX_PUBLISHED',
      severity: 'warning',
      message: 'This workflow is marked sandbox but published. Confirm it should receive production traffic.',
    });
  }

  if (workflow.tags && workflow.tags.length > 24) {
    issues.push({
      code: 'TOO_MANY_TAGS',
      severity: 'warning',
      message: 'More than 24 tags is hard to manage; consider consolidating.',
    });
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  return {
    issues,
    errors,
    warnings,
    canPublish: errors.length === 0,
  };
}

export type DryRunStep = {
  waveIndex: number;
  order: number;
  nodeId: string;
  stepType: WorkflowStep['stepType'];
  label?: string;
};

export interface DryRunResult {
  ok: boolean;
  steps: DryRunStep[];
  waves: DryRunStep[][];
}

/** Deterministic simulation of traversal order and parallel waves (for sandbox / dev tools). */
export function simulateWorkflowExecution(workflow: Workflow): DryRunResult {
  const steps = normalizeWorkflowSteps(workflow.id, workflow.steps);
  const edges = resolvedEdges(workflow);
  const ids = new Set(steps.map(s => s.nodeId));
  const stepEdges = edges.filter(e => ids.has(e.source) && ids.has(e.target));
  const { ok, waves } = executionWaves(steps, stepEdges);
  if (!ok) {
    return { ok: false, steps: [], waves: [] };
  }
  const byId = new Map(steps.map(s => [s.nodeId, s] as const));
  let order = 0;
  const flat: DryRunStep[] = [];
  const layered: DryRunStep[][] = waves.map((wave, wi) =>
    wave.map(nodeId => {
      const s = byId.get(nodeId)!;
      order += 1;
      const row: DryRunStep = {
        waveIndex: wi,
        order,
        nodeId,
        stepType: s.stepType,
        label: s.label,
      };
      flat.push(row);
      return row;
    })
  );
  return { ok: true, steps: flat, waves: layered };
}

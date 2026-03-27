import {
  executionWaves,
  normalizeWorkflowSteps,
  resolvePersistedEdges,
  unreachableStepNodeIds,
} from './workflowGraph';
import type { Workflow, WorkflowStep } from '../types';

export type PreviewWave = WorkflowStep[];

/**
 * Applicant journey order that matches the workflow graph (not just `order` field).
 * Parallel steps share a wave; linear edges produce a single step per wave.
 */
export function getPreviewJourney(workflow: Workflow): {
  /** Flat sequence (waves flattened left-to-right, stable tie-break). */
  steps: WorkflowStep[];
  /** Grouped waves when graph is valid; empty if fallback linear. */
  waves: PreviewWave[];
  /** True when at least one wave has multiple steps (parallel). */
  hasParallelWaves: boolean;
  /** Graph could not be layered (cycle); preview fell back to `order` sort. */
  graphInvalid: boolean;
  /** Steps not reachable from roots. */
  unreachable: WorkflowStep[];
} {
  const norm = normalizeWorkflowSteps(workflow.id, workflow.steps);
  const edges = resolvePersistedEdges(workflow);
  const unreachableIds = unreachableStepNodeIds(norm, edges);
  const unreachable = norm.filter(s => unreachableIds.includes(s.nodeId));
  const byId = new Map(norm.map(s => [s.nodeId, s] as const));

  const { ok, waves: waveIds } = executionWaves(norm, edges);

  if (!ok || norm.length === 0) {
    const fallback = [...norm].sort((a, b) => a.order - b.order);
    return {
      steps: fallback,
      waves: fallback.map(s => [s]),
      hasParallelWaves: false,
      graphInvalid: norm.length > 0 && !ok,
      unreachable,
    };
  }

  const waves = waveIds.map(w => w.map(id => byId.get(id)!));
  const steps = waves.flat();
  return {
    steps,
    waves,
    hasParallelWaves: waves.some(w => w.length > 1),
    graphInvalid: false,
    unreachable,
  };
}

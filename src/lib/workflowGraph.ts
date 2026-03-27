import type { Workflow, WorkflowGraphEdge, WorkflowStep } from '../types';

export const WF_START_NODE_ID = 'wf-start';

export function newStepNodeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `st-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Default horizontal layout origin */
export function defaultStepPosition(index: number): { x: number; y: number } {
  return { x: 40 + index * 268, y: 140 };
}

export function buildLinearEdges(steps: WorkflowStep[]): WorkflowGraphEdge[] {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const out: WorkflowGraphEdge[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    out.push({ id: `e-${a.nodeId}-${b.nodeId}`, source: a.nodeId, target: b.nodeId });
  }
  return out;
}

/** Ensure every step has nodeId + position (pure). */
export function normalizeWorkflowSteps(workflowId: string, steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((s, i) => ({
    ...s,
    nodeId: s.nodeId || `st-${workflowId}-${s.order}-${i}`,
    position: s.position ?? defaultStepPosition(i),
  }));
}

export function resolvePersistedEdges(workflow: Workflow): WorkflowGraphEdge[] {
  const steps = normalizeWorkflowSteps(workflow.id, workflow.steps);
  if (workflow.edges && workflow.edges.length > 0) return workflow.edges;
  return buildLinearEdges(steps);
}

function stepIds(steps: WorkflowStep[]): Set<string> {
  return new Set(steps.map(s => s.nodeId));
}

/** Directed cycle detection on step-step edges. */
export function graphHasCycle(edges: WorkflowGraphEdge[], ids: Set<string>): boolean {
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of ids) {
    indeg.set(id, 0);
    adj.set(id, []);
  }
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }
  const q = [...ids].filter(id => (indeg.get(id) ?? 0) === 0);
  let seen = 0;
  while (q.length) {
    const id = q.shift()!;
    seen++;
    for (const t of adj.get(id) ?? []) {
      const next = (indeg.get(t) ?? 0) - 1;
      indeg.set(t, next);
      if (next === 0) q.push(t);
    }
  }
  return seen !== ids.size;
}

/**
 * Kahn topological order; tie-break by visual position (top-to-left) for stable UX.
 */
export function applyTopologicalOrder(
  steps: WorkflowStep[],
  edges: WorkflowGraphEdge[]
): { steps: WorkflowStep[]; ok: boolean } {
  const ids = stepIds(steps);
  const byId = new Map(steps.map(s => [s.nodeId, s] as const));
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of ids) {
    indeg.set(id, 0);
    adj.set(id, []);
  }
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }

  const tieBreak = (a: string, b: string) => {
    const A = byId.get(a)!;
    const B = byId.get(b)!;
    return (A.position?.y ?? 0) - (B.position?.y ?? 0) || (A.position?.x ?? 0) - (B.position?.x ?? 0);
  };

  const orderIds: string[] = [];
  const done = new Set<string>();
  while (orderIds.length < steps.length) {
    const zeros = [...ids].filter(id => !done.has(id) && (indeg.get(id) ?? 0) === 0);
    if (!zeros.length) return { steps, ok: false };
    zeros.sort(tieBreak);
    const id = zeros[0];
    done.add(id);
    orderIds.push(id);
    for (const t of adj.get(id) ?? []) {
      indeg.set(t, (indeg.get(t) ?? 0) - 1);
    }
  }

  const ordered = orderIds.map((nid, i) => ({ ...byId.get(nid)!, order: i + 1 }));
  return { steps: ordered, ok: true };
}

export function rootsFromEdges(steps: WorkflowStep[], edges: WorkflowGraphEdge[]): string[] {
  const ids = stepIds(steps);
  const hasIn = new Set<string>();
  for (const e of edges) {
    if (ids.has(e.source) && ids.has(e.target)) hasIn.add(e.target);
  }
  return [...ids].filter(id => !hasIn.has(id));
}

export function stripStartEdges(edges: WorkflowGraphEdge[]): WorkflowGraphEdge[] {
  return edges.filter(e => e.source !== WF_START_NODE_ID && e.target !== WF_START_NODE_ID);
}

/** Step nodeIds not reachable from any graph root (orphans / disconnected islands). */
export function unreachableStepNodeIds(steps: WorkflowStep[], edges: WorkflowGraphEdge[]): string[] {
  const ids = stepIds(steps);
  if (ids.size === 0) return [];
  const stepEdges = edges.filter(e => ids.has(e.source) && ids.has(e.target));
  const roots = rootsFromEdges(steps, stepEdges);
  const adj = new Map<string, string[]>();
  for (const id of ids) adj.set(id, []);
  for (const e of stepEdges) adj.get(e.source)!.push(e.target);
  const seen = new Set<string>();
  const q = [...roots];
  while (q.length) {
    const u = q.shift()!;
    if (seen.has(u)) continue;
    seen.add(u);
    for (const v of adj.get(u) ?? []) q.push(v);
  }
  return [...ids].filter(id => !seen.has(id));
}

/**
 * Parallel execution layers: each inner array can run concurrently; layers run in sequence.
 * Tie-break within a layer uses canvas position (top-left first).
 */
export function executionWaves(
  steps: WorkflowStep[],
  edges: WorkflowGraphEdge[]
): { ok: boolean; waves: string[][] } {
  const ids = stepIds(steps);
  const byId = new Map(steps.map(s => [s.nodeId, s] as const));
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of ids) {
    indeg.set(id, 0);
    adj.set(id, []);
  }
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }
  const tieBreak = (a: string, b: string) => {
    const A = byId.get(a)!;
    const B = byId.get(b)!;
    return (A.position?.y ?? 0) - (B.position?.y ?? 0) || (A.position?.x ?? 0) - (B.position?.x ?? 0);
  };
  const waves: string[][] = [];
  const done = new Set<string>();
  while (done.size < steps.length) {
    const zeros = [...ids].filter(id => !done.has(id) && (indeg.get(id) ?? 0) === 0);
    if (!zeros.length) return { ok: false, waves };
    zeros.sort(tieBreak);
    waves.push(zeros);
    for (const id of zeros) {
      done.add(id);
      for (const t of adj.get(id) ?? []) {
        indeg.set(t, (indeg.get(t) ?? 0) - 1);
      }
    }
  }
  return { ok: true, waves };
}

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  WF_START_NODE_ID,
  buildLinearEdges,
  graphHasCycle,
  normalizeWorkflowSteps,
  rootsFromEdges,
} from '../../lib/workflowGraph';
import type { Workflow, WorkflowGraphEdge, WorkflowStep, WorkflowStepType } from '../../types';
import { useUIStore } from '../../store/uiStore';
import StepFlowNode, { type StepFlowNodeData } from './StepFlowNode';
import WfStartNode from './WfStartNode';

const nodeTypes = { wfStart: WfStartNode, wfStep: StepFlowNode } as NodeTypes;

const STEP_PRESENTATION: Record<
  WorkflowStepType,
  { title: string; accent: string }
> = {
  document_upload: { title: 'Document Upload', accent: 'border-blue-300/80 shadow-blue-100/50' },
  liveness_check: { title: 'Liveness Check', accent: 'border-violet-300/80 shadow-violet-100/50' },
  data_form: { title: 'Data Form', accent: 'border-slate-300/80 shadow-slate-100/50' },
  aml_screen: { title: 'AML Screen', accent: 'border-amber-300/80 shadow-amber-100/50' },
  manual_review: { title: 'Manual Review', accent: 'border-rose-300/80 shadow-rose-100/50' },
  webhook: { title: 'Webhook', accent: 'border-cyan-300/80 shadow-cyan-100/50' },
  custom: { title: 'Custom', accent: 'border-emerald-300/80 shadow-emerald-100/50' },
};

function stepEdgesForWorkflow(wf: Workflow): WorkflowGraphEdge[] {
  const steps = normalizeWorkflowSteps(wf.id, wf.steps);
  return wf.edges && wf.edges.length > 0 ? wf.edges : buildLinearEdges(steps);
}

function toReactFlowState(
  wf: Workflow,
  readOnly: boolean,
  removeStep: (nodeId: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const steps = normalizeWorkflowSteps(wf.id, wf.steps);
  const stepEdges = stepEdgesForWorkflow(wf);
  const startX =
    steps.length === 0
      ? 240
      : steps.reduce((acc, s) => acc + (s.position?.x ?? 0), 0) / steps.length;

  const nodes: Node[] = [
    {
      id: WF_START_NODE_ID,
      type: 'wfStart',
      position: { x: startX, y: 0 },
      data: {},
      draggable: false,
      selectable: false,
      connectable: !readOnly,
      deletable: false,
    },
    ...steps.map(s => {
      const meta = STEP_PRESENTATION[s.stepType];
      const title =
        s.stepType === 'custom' || s.stepType === 'webhook'
          ? s.label?.trim() || meta.title
          : meta.title;
      return {
        id: s.nodeId,
        type: 'wfStep',
        position: s.position ?? { x: 0, y: 120 },
        deletable: false,
        data: {
          step: s,
          title,
          accent: meta.accent,
          readOnly,
          onRemove: readOnly ? undefined : () => removeStep(s.nodeId),
        } satisfies StepFlowNodeData,
      };
    }),
  ];

  const startTargets = rootsFromEdges(steps, stepEdges);
  const startRf: Edge[] =
    steps.length === 0
      ? []
      : startTargets.map(t => ({
          id: `e-start-${t}`,
          source: WF_START_NODE_ID,
          target: t,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#818cf8', strokeWidth: 2 },
        }));

  const mainRf: Edge[] = stepEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  }));

  return { nodes, edges: [...startRf, ...mainRf] };
}

function nodesToSteps(nodes: Node[]): WorkflowStep[] {
  return nodes
    .filter(n => n.type === 'wfStep')
    .map(n => {
      const data = n.data as StepFlowNodeData;
      return { ...data.step, position: { x: n.position.x, y: n.position.y } };
    });
}

function edgesToPersisted(edges: Edge[]): WorkflowGraphEdge[] {
  return edges
    .filter(e => e.source !== WF_START_NODE_ID && e.target !== WF_START_NODE_ID)
    .map(e => ({ id: e.id, source: e.source, target: e.target }));
}

type InnerProps = {
  workflow: Workflow;
  readOnly: boolean;
  onSync: (steps: WorkflowStep[], edges: WorkflowGraphEdge[]) => void;
  onDropStep: (payload: WorkflowStepCreatePayload) => void;
  onRemoveStep: (nodeId: string) => void;
};

export type WorkflowStepCreatePayload = {
  position: { x: number; y: number };
  stepType: WorkflowStep['stepType'];
  checks?: WorkflowStep['checks'];
  required?: boolean;
  label?: string;
  integrationKey?: string;
  metadata?: Record<string, unknown>;
};

function WorkflowFlowCanvasInner({ workflow, readOnly, onSync, onDropStep, onRemoveStep }: InnerProps) {
  const addToast = useUIStore(s => s.addToast);
  const { screenToFlowPosition, fitView, getNodes, getEdges } = useReactFlow();
  const removeRef = useRef(onRemoveStep);
  const syncRef = useRef(onSync);
  const wfRef = useRef(workflow);

  useEffect(() => {
    removeRef.current = onRemoveStep;
    syncRef.current = onSync;
    wfRef.current = workflow;
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePersist = useCallback(() => {
    if (readOnly) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      persistTimer.current = null;
      const n = getNodes();
      const e = getEdges();
      const steps = nodesToSteps(n);
      const pe = edgesToPersisted(e);
      const ids = new Set(steps.map(s => s.nodeId));
      const filtered = pe.filter(x => ids.has(x.source) && ids.has(x.target));
      syncRef.current(steps, filtered);
    }, 550);
  }, [readOnly, getNodes, getEdges]);

  const resetKey = `${workflow.id}:${workflow.updatedAt}`;
  useLayoutEffect(() => {
    const next = toReactFlowState(workflow, readOnly, id => removeRef.current(id));
    setNodes(next.nodes);
    setEdges(next.edges);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when persisted graph fields change
  }, [resetKey, readOnly, setNodes, setEdges, workflow.id, workflow.steps, workflow.edges]);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      fitView({ padding: 0.2, maxZoom: 1.15, minZoom: 0.35 });
    });
    return () => cancelAnimationFrame(t);
  }, [resetKey, fitView, nodes.length]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      if (params.target === WF_START_NODE_ID) return;
      setEdges(eds => {
        const next = addEdge(
          {
            ...params,
            id: `e-${params.source}-${params.target}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#64748b', strokeWidth: 2 },
          },
          eds
        );
        const wf = wfRef.current;
        const ids = new Set(wf.steps.map(s => s.nodeId));
        const stepOnly = edgesToPersisted(next).filter(e => ids.has(e.source) && ids.has(e.target));
        if (graphHasCycle(stepOnly, ids)) {
          addToast('That link would create a cycle', 'error');
          return eds;
        }
        return next;
      });
      schedulePersist();
    },
    [readOnly, setEdges, addToast, schedulePersist]
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      if (!readOnly) schedulePersist();
    },
    [onEdgesChange, readOnly, schedulePersist]
  );

  const onNodeDragStop = useCallback(() => {
    schedulePersist();
  }, [schedulePersist]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (readOnly) return;
      const raw = e.dataTransfer.getData('application/wf-step');
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Omit<WorkflowStepCreatePayload, 'position'>;
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        onDropStep({ ...parsed, position });
      } catch {
        addToast('Invalid palette payload', 'error');
      }
    },
    [readOnly, screenToFlowPosition, onDropStep, addToast]
  );

  return (
    <div className="h-[min(640px,calc(100vh-220px))] w-full min-h-[420px] rounded-2xl border border-slate-200/80 bg-slate-50/80 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        minZoom={0.25}
        maxZoom={1.6}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        deleteKeyCode={readOnly ? null : 'Delete'}
        className="rounded-2xl"
      >
        <Background gap={20} size={1} color="#cbd5e1" className="rounded-2xl" />
        <Controls className="!rounded-xl !border-slate-200 !shadow-md" showInteractive={false} />
        <MiniMap
          className="!rounded-xl !border !border-slate-200 !shadow-md"
          nodeColor={n => (n.type === 'wfStart' ? '#6366f1' : '#e2e8f0')}
          maskColor="rgb(15 23 42 / 0.08)"
        />
      </ReactFlow>
    </div>
  );
}

export type WorkflowFlowCanvasProps = InnerProps;

export function WorkflowFlowCanvas(props: WorkflowFlowCanvasProps) {
  return (
    <ReactFlowProvider key={props.workflow.id}>
      <WorkflowFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

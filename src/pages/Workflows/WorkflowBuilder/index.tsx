import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  GitBranch,
  GripVertical,
  Plus,
  Send,
  AlertTriangle,
  FlaskConical,
  PlayCircle,
  Terminal,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  useWorkflow,
  useWorkflowActions,
  useCheckCatalogue,
  useTierProfiles,
} from '../../../hooks/useWorkflows';
import { isLiveApi } from '../../../lib/apiConfig';
import {
  LIVE_API_STEP_TYPES,
  inferDefaultChecksForStepType,
  filterCatalogueByStepType,
  checkCatalogueIdsForStepType,
} from '../../../lib/workflowTierResolution';
import { WorkflowStatusBadge } from '../../../components/shared/WorkflowStatusBadge';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { Modal } from '../../../components/shared/Modal';
import { TabGuide } from '../../../components/shared/TabGuide';
import { CopyButton } from '../../../components/shared/CopyButton';
import {
  WorkflowFlowCanvas,
  type WorkflowStepCreatePayload,
} from '../../../components/workflow/WorkflowFlowCanvas';
import { WorkflowIntegrationPreview } from '../../../components/workflow/WorkflowIntegrationPreview';
import {
  validateWorkflow,
  type WorkflowValidationResult,
  type DryRunResult,
} from '../../../lib/workflowValidation';
import { useDeveloperStore } from '../../../store/developerStore';
import { useSession } from '../../../hooks/useSession';
import { cn } from '../../../lib/utils';
import type {
  TierProfile,
  Workflow,
  WorkflowGraphEdge,
  WorkflowStep,
  WorkflowStepCreate,
  CheckCatalogueId,
  WorkflowStepType,
} from '../../../types';

const STEP_TYPES: WorkflowStepType[] = [
  'document_upload',
  'liveness_check',
  'data_form',
  'aml_screen',
  'manual_review',
  'webhook',
  'custom',
];

const STEP_TYPE_LABELS: Record<WorkflowStepType, string> = {
  document_upload: 'Document Upload',
  liveness_check: 'Liveness Check',
  data_form: 'Data Form',
  aml_screen: 'AML Screen',
  manual_review: 'Manual Review',
  webhook: 'Webhook',
  custom: 'Custom',
};

const STEP_TYPE_COLORS: Record<WorkflowStepType, string> = {
  document_upload: 'bg-blue-50 border-blue-200 text-blue-700',
  liveness_check: 'bg-purple-50 border-purple-200 text-purple-700',
  data_form: 'bg-gray-50 border-gray-200 text-gray-700',
  aml_screen: 'bg-amber-50 border-amber-200 text-amber-700',
  manual_review: 'bg-red-50 border-red-200 text-red-700',
  webhook: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  custom: 'bg-emerald-50 border-emerald-200 text-emerald-800',
};

function workflowDefinitionJson(w: Workflow): string {
  const { steps, edges, ...meta } = w;
  const leanSteps = steps.map(s => {
    const { tierProfile, ...rest } = s;
    void tierProfile;
    return rest;
  });
  return JSON.stringify({ ...meta, steps: leanSteps, edges }, null, 2);
}

function buildStepCreatePayload(
  selectedType: WorkflowStepType,
  selectedChecks: CheckCatalogueId[],
  required: boolean,
  customLabel: string,
  integrationKey: string
): WorkflowStepCreate {
  const base: WorkflowStepCreate = {
    stepType: selectedType,
    checks: selectedChecks.length ? selectedChecks : undefined,
    required,
  };
  if (selectedType === 'custom' || selectedType === 'webhook') {
    return {
      ...base,
      label: customLabel.trim() || (selectedType === 'webhook' ? 'Webhook' : 'Custom step'),
      integrationKey: integrationKey.trim() || undefined,
    };
  }
  return base;
}

function ValidationSummary({ result }: { result: WorkflowValidationResult | null }) {
  if (!result) return null;
  const { errors, warnings } = result;
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-xs text-emerald-900 flex items-start gap-2">
        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" />
        <div>
          <p className="font-semibold">Ready to publish</p>
          <p className="text-emerald-800/90 mt-0.5 leading-relaxed">No blocking issues. Warnings are optional improvements.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 text-xs">
      <p className="font-semibold text-gray-700 uppercase tracking-wider text-[10px]">Validation</p>
      {errors.length > 0 && (
        <ul className="space-y-1.5 text-red-700">
          {errors.map((e, i) => (
            <li key={`e-${i}`} className="flex gap-2">
              <span className="font-mono text-[10px] shrink-0 opacity-60">{e.code}</span>
              <span>{e.message}{e.nodeId ? ` (${e.nodeId.slice(0, 8)}…)` : ''}</span>
            </li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="space-y-1.5 text-amber-800 border-t border-amber-100 pt-2 mt-2">
          {warnings.map((w, i) => (
            <li key={`w-${i}`} className="flex gap-2">
              <Info size={12} className="shrink-0 mt-0.5 text-amber-500" />
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddStepPanel({
  onAdd,
  disabled,
  tierList,
}: {
  onAdd: (step: WorkflowStepCreate) => void;
  disabled: boolean;
  tierList: TierProfile[] | undefined;
}) {
  const live = isLiveApi();
  const { data: catalogue } = useCheckCatalogue();
  const stepTypes = live ? LIVE_API_STEP_TYPES : STEP_TYPES;
  const [selectedType, setSelectedType] = useState<WorkflowStepType>('document_upload');
  const [selectedChecks, setSelectedChecks] = useState<CheckCatalogueId[]>([]);
  const [required, setRequired] = useState(true);
  const [customLabel, setCustomLabel] = useState('');
  const [integrationKey, setIntegrationKey] = useState('');

  const toggleCheck = (id: CheckCatalogueId) =>
    setSelectedChecks(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const checksForStepType = useMemo(
    () => filterCatalogueByStepType(selectedType, catalogue ?? []),
    [selectedType, catalogue]
  );

  useEffect(() => {
    const allowed = new Set(checkCatalogueIdsForStepType(selectedType));
    setSelectedChecks(prev => prev.filter(id => allowed.has(id)));
  }, [selectedType]);

  const payload = (): WorkflowStepCreate =>
    buildStepCreatePayload(selectedType, selectedChecks, required, customLabel, integrationKey);

  const dragPayload = (): Omit<WorkflowStepCreatePayload, 'position'> => {
    const p = payload();
    return {
      stepType: p.stepType,
      checks: p.checks,
      required: p.required,
      label: p.label,
      integrationKey: p.integrationKey,
      metadata: p.metadata,
    };
  };

  const handleAdd = () => {
    onAdd(payload());
    setSelectedChecks([]);
  };

  const inferredForAdd = inferDefaultChecksForStepType(selectedType);
  const addBlockedLive =
    live && inferredForAdd.length === 0 && selectedChecks.length === 0;
  const activeTiers = (tierList ?? []).filter(t => !t.isArchived);
  const noLiveTiers = live && activeTiers.length === 0;

  const composeSection = (
    <>
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Step category</label>
        <p className="text-[10px] text-gray-400 mb-1.5 leading-relaxed">
          {live
            ? 'UI grouping only. On save we resolve a tier whose required checks cover your selection (or defaults for this category).'
            : 'Groups which catalogue checks you can attach.'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {stepTypes.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedType === t ? STEP_TYPE_COLORS[t] : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {STEP_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {!live && (selectedType === 'custom' || selectedType === 'webhook') && (
        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Label</label>
            <input
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              placeholder={selectedType === 'webhook' ? 'e.g. Notify CRM' : 'e.g. Credit bureau pull'}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
              Integration key
            </label>
            <input
              value={integrationKey}
              onChange={e => setIntegrationKey(e.target.value)}
              placeholder="e.g. partner.acme.webhook"
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-mono outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Checks for this category</label>
        {checksForStepType.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic py-2">
            No checks for this category{live ? ' in the API catalogue.' : '.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[min(320px,50vh)] overflow-y-auto pr-1">
            {checksForStepType.map(c => (
              <label
                key={c.id}
                className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedChecks.includes(c.id)}
                  onChange={() => toggleCheck(c.id)}
                  className="rounded border-gray-300 text-indigo-600 w-3 h-3"
                />
                <span className="text-gray-600 truncate" title={c.description}>
                  {c.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={e => setRequired(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600"
          />
          Required step
        </label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || addBlockedLive || noLiveTiers}
          title={
            noLiveTiers
              ? 'Create at least one active tier profile under Settings so the API can assign tier_profile_id.'
              : addBlockedLive
                ? 'This step category has no default checks against the API — pick at least one check or drag a tier chip.'
                : undefined
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Plus size={12} />
          Add step
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step library</p>
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
            {live
              ? 'Drag a tier chip for a fixed tier_profile_id, or use category + checks — we match an active tier by required checks. Graph must stay linear.'
              : 'Drag the block or use Add step. Execution follows the graph you connect on the canvas.'}
          </p>
        </div>
        <div
          draggable={!disabled && !addBlockedLive}
          onDragStart={e => {
            e.dataTransfer.setData('application/wf-step', JSON.stringify(dragPayload()));
            e.dataTransfer.effectAllowed = 'move';
          }}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-indigo-200 bg-indigo-50 px-2.5 py-2 text-[11px] font-semibold text-indigo-800 ${
            disabled || addBlockedLive ? 'opacity-40 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:bg-indigo-100'
          }`}
          title={live ? 'Drags the current category + selected checks (defaults apply when nothing is ticked).' : undefined}
        >
          <GripVertical size={14} className="text-indigo-400" />
          Drag block
        </div>
      </div>

      {live && activeTiers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1.5">Tier profiles — drag onto canvas</p>
          <div className="flex flex-wrap gap-2 max-h-[min(280px,45vh)] overflow-y-auto pr-0.5">
            {activeTiers.map(t => (
              <div
                key={t.id}
                draggable={!disabled}
                onDragStart={e => {
                  e.dataTransfer.setData(
                    'application/wf-tier',
                    JSON.stringify({
                      tierProfileId: t.id,
                      name: t.name,
                      requiredChecks: t.requiredChecks,
                    })
                  );
                  e.dataTransfer.effectAllowed = 'move';
                }}
                  className={`px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-900 max-w-[min(100%,11rem)] truncate ${
                  disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:bg-emerald-100'
                }`}
                title={t.description ?? t.name}
              >
                {t.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {live && activeTiers.length === 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
          No active tier profiles — create one under Settings → Tier profiles before adding steps, or the API cannot
          resolve a tier_profile_id.
        </p>
      )}

      <div className="space-y-4">{composeSection}</div>
    </div>
  );
}

export default function WorkflowBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useSession();
  const readOnlyRole = !can('workflows.write');
  const { data: workflow, isLoading } = useWorkflow(id!);
  const { data: catalogue } = useCheckCatalogue();
  const { data: tiers } = useTierProfiles();
  const { update, publish, addStep, removeStep, syncGraph, cloneSandbox, dryRun } = useWorkflowActions();
  const workflowDevMode = useDeveloperStore(s => s.workflowDevMode);
  const setWorkflowDevMode = useDeveloperStore(s => s.setWorkflowDevMode);
  const workflowStrictIntegration = useDeveloperStore(s => s.workflowStrictIntegration);
  const setWorkflowStrictIntegration = useDeveloperStore(s => s.setWorkflowStrictIntegration);

  const [publishConfirm, setPublishConfirm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [dryRunOpen, setDryRunOpen] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [builderTab, setBuilderTab] = useState<'workflow' | 'preview'>('workflow');

  const validation = useMemo(() => {
    if (!workflow) return null;
    return validateWorkflow(workflow, {
      strictIntegrationKeys: workflowStrictIntegration,
      tierProfileIds: new Set(tiers?.map(t => t.id) ?? []),
      checkCatalogue: catalogue ?? [],
    });
  }, [workflow, workflowStrictIntegration, tiers, catalogue]);

  const handleNameSave = async () => {
    if (!workflow) return;
    if (nameValue.trim() && nameValue !== workflow.name) {
      await update.mutateAsync({ id: workflow.id, data: { name: nameValue } });
    }
    setEditingName(false);
  };

  const handleAddStep = (step: WorkflowStepCreate) => {
    if (!workflow) return;
    addStep.mutate({ id: workflow.id, step });
  };

  const handleRemoveStep = useCallback(
    (nodeId: string) => {
      if (!workflow) return;
      removeStep.mutate({ id: workflow.id, nodeId });
    },
    [workflow, removeStep]
  );

  const handleSync = useCallback(
    (steps: WorkflowStep[], edges: WorkflowGraphEdge[]) => {
      if (!workflow || workflow.status !== 'draft') return;
      syncGraph.mutate({ id: workflow.id, steps, edges });
    },
    [workflow, syncGraph]
  );

  const handleDropStep = useCallback(
    (payload: WorkflowStepCreatePayload) => {
      if (!workflow) return;
      const { position, ...rest } = payload;
      addStep.mutate({
        id: workflow.id,
        step: { ...rest, position },
      });
    },
    [workflow, addStep]
  );

  const runDryRun = async () => {
    if (!workflow) return;
    try {
      const res = await dryRun.mutateAsync(workflow.id);
      if (res) {
        setDryRunResult(res);
        setDryRunOpen(true);
      }
    } catch {
      /* toast from mutation */
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }
  if (!workflow) {
    return <div className="text-center py-16 text-gray-400">Workflow not found</div>;
  }

  const isEditable = workflow.status === 'draft' && !readOnlyRole;
  const canPublish = (validation?.canPublish ?? false) && !readOnlyRole;
  const envLabel = (workflow.environment ?? 'production') === 'sandbox' ? 'Sandbox' : 'Production';

  return (
    <div className="space-y-5">
      {readOnlyRole && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">View-only access.</span> Your role can inspect workflows but cannot
          edit, publish, or run sandbox actions. Ask an owner or admin for <code className="text-xs">workflows:write</code>{' '}
          if you need to change definitions.
        </div>
      )}
      {workflowDevMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50/90 px-4 py-2.5 text-xs text-violet-900">
          <div className="flex items-center gap-2 font-medium">
            <Terminal size={14} />
            Developer mode — definition JSON, simulation, and strict integration rules are visible. Preferences persist in this browser.
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={workflowStrictIntegration}
              onChange={e => setWorkflowStrictIntegration(e.target.checked)}
              className="rounded border-violet-400 text-violet-700"
            />
            Strict integration keys (UI matches publish rules)
          </label>
        </div>
      )}

      <TabGuide title="Guide: workflow detail" dataTour="workflow-detail-guide">
        <ul className="list-disc space-y-1.5 pl-4">
          <li>
            <strong>Draft</strong> workflows are editable on the canvas; <strong>published</strong> definitions are fixed for
            in-flight verifications.
          </li>
          <li>
            <strong>Sandbox</strong> is for safe experiments — use “Sandbox copy” to branch from production when the API allows
            it.
          </li>
          <li>
            Keep the graph <strong>linear</strong>: one path through steps. With the live API, drag <strong>tier profile</strong>{' '}
            chips for a fixed tier, or choose a <strong>step category + checks</strong> so the backend can match an active tier.
          </li>
          <li>
            Resolve every <strong>validation</strong> error before publishing; warnings are hints (e.g. optional integration
            keys).
          </li>
          <li>
            Switch to <strong>Integration preview</strong> for hosted-flow copy; turn on <strong>Dev mode</strong> for raw JSON,
            simulation, and stricter integration-key checks.
          </li>
        </ul>
      </TabGuide>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/workflows')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 flex flex-wrap items-center gap-2 min-w-[200px]">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={e => {
                if (e.key === 'Enter') void handleNameSave();
                if (e.key === 'Escape') setEditingName(false);
              }}
              className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-indigo-400 outline-none w-64 max-w-full"
            />
          ) : (
            <h1
              onClick={() => {
                if (isEditable) {
                  setNameValue(workflow.name);
                  setEditingName(true);
                }
              }}
              className={`text-xl font-semibold text-gray-900 ${isEditable ? 'cursor-text hover:text-indigo-700' : ''}`}
            >
              {workflow.name}
            </h1>
          )}
          <WorkflowStatusBadge status={workflow.status} />
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
              envLabel === 'Sandbox' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {envLabel}
          </span>
          <span className="text-sm text-gray-400">v{workflow.version}</span>
          {syncGraph.isPending && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-500">Saving graph…</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={workflowDevMode}
              onChange={e => setWorkflowDevMode(e.target.checked)}
              className="rounded border-gray-300 text-violet-600"
            />
            Dev mode
          </label>
          {isEditable && (
            <button
              type="button"
              onClick={() => cloneSandbox.mutate(workflow.id)}
              disabled={cloneSandbox.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <FlaskConical size={14} />
              Sandbox copy
            </button>
          )}
          {workflow.status === 'draft' && (
            <>
              {workflow.steps.length === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  <AlertTriangle size={12} />
                  Add at least one step before publishing
                </div>
              )}
              <button
                type="button"
                onClick={() => setPublishConfirm(true)}
                disabled={workflow.steps.length === 0 || !canPublish}
                title={!canPublish ? 'Fix validation errors before publishing' : undefined}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="flex w-full max-w-2xl rounded-xl border border-gray-200/90 bg-gray-50/80 p-1 shadow-sm"
        role="tablist"
        aria-label="Workflow builder views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={builderTab === 'workflow'}
          onClick={() => setBuilderTab('workflow')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all min-w-0 sm:flex-initial sm:px-6',
            builderTab === 'workflow'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
          )}
        >
          <GitBranch className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          <span>Workflow</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={builderTab === 'preview'}
          onClick={() => setBuilderTab('preview')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all min-w-0 sm:flex-initial sm:px-6',
            builderTab === 'preview'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
          )}
        >
          <Eye className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          <span>Preview</span>
        </button>
      </div>

      {builderTab === 'workflow' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6" role="tabpanel" aria-label="Workflow editor">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Flow canvas ({workflow.steps.length} steps)
              </p>
              <p className="text-[11px] text-gray-400 max-w-xl">
                Scroll to pan · drag nodes · connect handles for branches · Delete removes selected edges
              </p>
            </div>
            <WorkflowFlowCanvas
              workflow={workflow}
              readOnly={!isEditable}
              onSync={handleSync}
              onDropStep={handleDropStep}
              onRemoveStep={handleRemoveStep}
            />
          </div>

          <div className="space-y-4">
            <ValidationSummary result={validation} />

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Created by</span>
                <span className="text-gray-700">{workflow.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-gray-700">{workflow.version}</span>
              </div>
              {workflow.clonedFromId && (
                <div className="flex justify-between">
                  <span>Cloned from</span>
                  <span className="text-gray-700">{workflow.clonedFromId}</span>
                </div>
              )}
              {workflow.industryVertical && (
                <div className="flex justify-between">
                  <span>Vertical</span>
                  <span className="text-gray-700">{workflow.industryVertical}</span>
                </div>
              )}
              {workflow.tags && workflow.tags.length > 0 && (
                <div className="pt-1">
                  <span className="text-gray-400">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {workflow.tags.map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-gray-400 pt-1 leading-relaxed">{workflow.description}</p>
            </div>

            {workflowDevMode && (
              <div className="rounded-xl border border-violet-200 bg-white p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-violet-900 uppercase tracking-wider text-[10px]">Sandbox simulation</p>
                  <button
                    type="button"
                    onClick={runDryRun}
                    disabled={dryRun.isPending || workflow.steps.length === 0}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600 text-white text-[11px] font-medium hover:bg-violet-700 disabled:opacity-50"
                  >
                    <PlayCircle size={12} />
                    Run dry-run
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Computes parallel waves from the current graph (no side effects). Use to verify branching before publishing.
                </p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-gray-500 uppercase">Definition JSON</span>
                    <CopyButton value={workflowDefinitionJson(workflow)} className="!text-[10px]" />
                  </div>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 text-slate-100 p-2 text-[10px] font-mono leading-relaxed">
                    {workflowDefinitionJson(workflow)}
                  </pre>
                </div>
              </div>
            )}

            {isEditable && (
              <AddStepPanel onAdd={handleAddStep} disabled={addStep.isPending} tierList={tiers} />
            )}
          </div>
        </div>
      )}

      {builderTab === 'preview' && (
        <div role="tabpanel" aria-label="Integration preview">
          <WorkflowIntegrationPreview workflow={workflow} variant="tab" />
        </div>
      )}

      <ConfirmDialog
        open={publishConfirm}
        onClose={() => setPublishConfirm(false)}
        onConfirm={async () => {
          await publish.mutateAsync(workflow.id);
          setPublishConfirm(false);
        }}
        title="Publish Workflow"
        description={
          validation && validation.warnings.length > 0
            ? `Publish "${workflow.name}"? You have ${validation.warnings.length} warning(s) — review the validation panel. Published workflows cannot be edited directly.`
            : `Publish "${workflow.name}"? Once published, the workflow cannot be edited directly — clone it to create a new version.`
        }
        confirmLabel="Publish"
        variant="warning"
        loading={publish.isPending}
      />

      <Modal
        open={dryRunOpen}
        onClose={() => {
          setDryRunOpen(false);
          setDryRunResult(null);
        }}
        title="Dry-run execution"
        description="Parallel waves: steps in the same wave may run concurrently; waves run in order."
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setDryRunOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        }
      >
        {dryRunResult && !dryRunResult.ok ? (
          <p className="text-sm text-red-600">Graph is invalid for simulation (cycles or disconnected nodes).</p>
        ) : dryRunResult?.ok ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto text-sm">
            {dryRunResult.waves.map((wave, wi) => (
              <div key={wi}>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">Wave {wi + 1}</p>
                <ul className="space-y-1 border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {wave.map(s => (
                    <li key={s.nodeId} className="px-3 py-2 flex justify-between gap-2 text-xs">
                      <span className="font-mono text-gray-500 truncate">{s.nodeId}</span>
                      <span className="text-gray-800">
                        {STEP_TYPE_LABELS[s.stepType]}
                        {s.label ? ` — ${s.label}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No simulation data.</p>
        )}
      </Modal>
    </div>
  );
}

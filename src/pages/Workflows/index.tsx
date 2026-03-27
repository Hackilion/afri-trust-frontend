import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GitBranch, Copy, Archive, Pencil, Eye, FlaskConical } from 'lucide-react';
import { useWorkflows, useWorkflowActions } from '../../hooks/useWorkflows';
import { WorkflowStatusBadge } from '../../components/shared/WorkflowStatusBadge';
import { Modal } from '../../components/shared/Modal';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { PageHeader } from '../../components/shared/PageHeader';
import { SkeletonCard } from '../../components/shared/LoadingSpinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatDate } from '../../lib/formatters';
import { useDeveloperStore } from '../../store/developerStore';
import type { Workflow, WorkflowEnvironment, WorkflowStatus } from '../../types';

const STATUS_TABS: { label: string; value: WorkflowStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

const ENV_TABS: { label: string; value: WorkflowEnvironment | 'all' }[] = [
  { label: 'All env', value: 'all' },
  { label: 'Production', value: 'production' },
  { label: 'Sandbox', value: 'sandbox' },
];

function NewWorkflowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<WorkflowEnvironment>('production');
  const [industryVertical, setIndustryVertical] = useState('general');
  const [tagsStr, setTagsStr] = useState('');
  const { create } = useWorkflowActions();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const workflow = await create.mutateAsync({
      name,
      description,
      environment,
      industryVertical: industryVertical || undefined,
      tags: tags.length ? tags : undefined,
    });
    onClose();
    navigate(`/workflows/${workflow.id}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Workflow"
      description="Create a blank draft workflow to configure steps and checks."
      size="md"
      footer={
        <>
          <button onClick={onClose} disabled={create.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={create.isPending || !name.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {create.isPending ? 'Creating…' : 'Create Workflow'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Premium Onboarding" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
            <select
              value={environment}
              onChange={e => setEnvironment(e.target.value as WorkflowEnvironment)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="production">Production</option>
              <option value="sandbox">Sandbox</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
            <select
              value={industryVertical}
              onChange={e => setIndustryVertical(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="general">General</option>
              <option value="banking">Banking</option>
              <option value="fintech">Fintech</option>
              <option value="financial_services">Financial services</option>
              <option value="insurance">Insurance</option>
              <option value="telco">Telco</option>
              <option value="gaming">Gaming</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(optional, comma-separated)</span></label>
          <input
            type="text"
            value={tagsStr}
            onChange={e => setTagsStr(e.target.value)}
            placeholder="e.g. eu, b2b"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </Modal>
  );
}

function CloneModal({ workflow, onClose }: { workflow: Workflow; onClose: () => void }) {
  const [name, setName] = useState(`${workflow.name} (Copy)`);
  const { clone } = useWorkflowActions();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const cloned = await clone.mutateAsync({ id: workflow.id, newName: name });
    onClose();
    navigate(`/workflows/${cloned.id}`);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Clone Workflow"
      size="sm"
      footer={
        <>
          <button onClick={onClose} disabled={clone.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={clone.isPending || !name.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {clone.isPending ? 'Cloning…' : 'Clone'}
          </button>
        </>
      }
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
    </Modal>
  );
}

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const navigate = useNavigate();
  const { archive, cloneSandbox } = useWorkflowActions();
  const workflowDevMode = useDeveloperStore(s => s.workflowDevMode);
  const [cloneTarget, setCloneTarget] = useState<Workflow | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const isSandbox = (workflow.environment ?? 'production') === 'sandbox';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <WorkflowStatusBadge status={workflow.status} />
            {isSandbox && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                Sandbox
              </span>
            )}
            <span className="text-xs text-gray-400">v{workflow.version}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mt-1.5 text-sm">{workflow.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{workflow.description}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
            <span>{workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>Created {formatDate(workflow.createdAt)}</span>
            {workflow.publishedAt && <><span>·</span><span>Published {formatDate(workflow.publishedAt)}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => navigate(`/workflows/${workflow.id}`)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title={workflow.status === 'draft' ? 'Edit' : 'View'}
          >
            {workflow.status === 'draft' ? <Pencil size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={() => setCloneTarget(workflow)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Clone as draft"
          >
            <Copy size={14} />
          </button>
          {workflowDevMode && workflow.status !== 'archived' && (
            <button
              onClick={() => cloneSandbox.mutate(workflow.id)}
              disabled={cloneSandbox.isPending}
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
              title="Clone to sandbox draft (dev)"
            >
              <FlaskConical size={14} />
            </button>
          )}
          {workflow.status !== 'archived' && (
            <button
              onClick={() => setArchiveConfirm(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              title="Archive"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      </div>

      {cloneTarget && <CloneModal workflow={cloneTarget} onClose={() => setCloneTarget(null)} />}
      <ConfirmDialog
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        onConfirm={async () => { await archive.mutateAsync(workflow.id); setArchiveConfirm(false); }}
        title="Archive Workflow"
        description={`Archive "${workflow.name}"? It will no longer be assignable to new verification sessions.`}
        confirmLabel="Archive"
        variant="warning"
        loading={archive.isPending}
      />
    </div>
  );
}

export default function Workflows() {
  const [activeTab, setActiveTab] = useState<WorkflowStatus | 'all'>('all');
  const [envTab, setEnvTab] = useState<WorkflowEnvironment | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const workflowDevMode = useDeveloperStore(s => s.workflowDevMode);
  const setWorkflowDevMode = useDeveloperStore(s => s.setWorkflowDevMode);
  const { data: workflows, isLoading } = useWorkflows(
    activeTab === 'all' ? undefined : activeTab,
    envTab
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Workflows"
        subtitle="Design and manage the verification journeys for your applicants."
        action={
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} />
            New Workflow
          </button>
        }
      />

      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={workflowDevMode}
          onChange={e => setWorkflowDevMode(e.target.checked)}
          className="rounded border-gray-300 text-violet-600"
        />
        Developer mode (sandbox quick-clone, persisted in this browser)
      </label>

      {/* Status tabs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-0">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors shrink-0 ${
                activeTab === tab.value
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 overflow-x-auto sm:border-0 border-t border-gray-100 pt-2 sm:pt-0">
          {ENV_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setEnvTab(tab.value)}
              className={`px-3 py-2 text-[12px] font-medium rounded-lg transition-colors shrink-0 ${
                envTab === tab.value ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && (workflows ?? []).length === 0 && (
        <EmptyState
          icon={GitBranch}
          title="No workflows"
          description={activeTab === 'all' ? 'Create your first workflow to start onboarding applicants.' : `No ${activeTab} workflows.`}
          action={activeTab === 'all' || activeTab === 'draft' ? (
            <button onClick={() => setShowNewModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
              New Workflow
            </button>
          ) : undefined}
        />
      )}

      {!isLoading && (workflows ?? []).length > 0 && (
        <div className="grid gap-3">
          {(workflows ?? []).map(w => <WorkflowCard key={w.id} workflow={w} />)}
        </div>
      )}

      <NewWorkflowModal open={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}

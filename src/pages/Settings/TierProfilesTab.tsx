import { useState } from 'react';
import { Plus, Archive, Edit2, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useTierProfiles, useTierProfileActions } from '../../hooks/useWorkflows';
import { useCheckCatalogue } from '../../hooks/useWorkflows';
import { Modal } from '../../components/shared/Modal';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { SkeletonCard } from '../../components/shared/LoadingSpinner';
import type { TierProfile, CheckCatalogueId, DocumentType } from '../../types';

const ATTRIBUTE_OPTIONS = [
  'full_name', 'date_of_birth', 'nationality', 'address',
  'phone', 'email', 'document_number', 'face_image',
];

const DOCUMENT_TYPE_OPTIONS: DocumentType[] = [
  'national_id', 'passport', 'voters_card', 'drivers_license',
  'nin', 'bvn', 'ghana_card', 'alien_card',
];

function TierProfileCard({ profile, onEdit, onArchive }: {
  profile: TierProfile;
  onEdit: (p: TierProfile) => void;
  onArchive: (p: TierProfile) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-xl border ${profile.isArchived ? 'border-gray-200 opacity-60' : 'border-gray-200'} overflow-hidden`}>
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Shield size={16} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{profile.name}</h3>
            {profile.isArchived && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Archived</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{profile.description}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{profile.requiredChecks.length} checks</span>
            <span>·</span>
            <span>{profile.requiredAttributes.length} attributes</span>
            <span>·</span>
            <span>{profile.acceptedDocumentTypes.length} doc types</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!profile.isArchived && (
            <>
              <button
                onClick={() => onEdit(profile)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onArchive(profile)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                title="Archive"
              >
                <Archive size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Required Checks</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.requiredChecks.map(c => (
                <span key={c} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                  {c.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Required Attributes</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.requiredAttributes.map(a => (
                <span key={a} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs border border-gray-200">
                  {a.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Accepted Document Types</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.acceptedDocumentTypes.map(d => (
                <span key={d} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs border border-gray-200">
                  {d.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TierFormData {
  name: string;
  description: string;
  requiredChecks: CheckCatalogueId[];
  requiredAttributes: string[];
  acceptedDocumentTypes: DocumentType[];
  settings: TierProfile['settings'];
}

function TierProfileFormModal({ open, onClose, initial }: {
  open: boolean;
  onClose: () => void;
  initial?: TierProfile;
}) {
  const { data: catalogue } = useCheckCatalogue();
  const { create, update } = useTierProfileActions();

  const [form, setForm] = useState<TierFormData>(() => ({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    requiredChecks: initial?.requiredChecks ?? [],
    requiredAttributes: initial?.requiredAttributes ?? [],
    acceptedDocumentTypes: initial?.acceptedDocumentTypes ?? [],
    settings: initial?.settings ?? { allowManualReview: false, autoApproveOnPass: true, expiryDays: 365, resubmissionAllowed: true, allowSelfie: true, requireLiveness: false },
  }));

  const toggle = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

  const handleSubmit = async () => {
    if (initial) {
      await update.mutateAsync({ id: initial.id, data: form });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  };

  const busy = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Tier Profile' : 'New Tier Profile'}
      size="xl"
      footer={
        <>
          <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={busy || !form.name} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {busy ? 'Saving…' : initial ? 'Save Changes' : 'Create Profile'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Enhanced KYC"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Required Checks</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(catalogue ?? []).map(c => (
              <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.requiredChecks.includes(c.id)}
                  onChange={() => setForm(f => ({ ...f, requiredChecks: toggle(f.requiredChecks, c.id) }))}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-gray-700">{c.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Required Attributes</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ATTRIBUTE_OPTIONS.map(a => (
              <label key={a} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.requiredAttributes.includes(a)}
                  onChange={() => setForm(f => ({ ...f, requiredAttributes: toggle(f.requiredAttributes, a) }))}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-gray-700">{a.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Accepted Document Types</label>
          <div className="grid grid-cols-2 gap-1.5">
            {DOCUMENT_TYPE_OPTIONS.map(d => (
              <label key={d} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.acceptedDocumentTypes.includes(d)}
                  onChange={() => setForm(f => ({ ...f, acceptedDocumentTypes: toggle(f.acceptedDocumentTypes, d) }))}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-gray-700">{d.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (days)</label>
            <input
              type="number"
              value={form.settings.expiryDays}
              onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, expiryDays: Number(e.target.value) } }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.settings.allowSelfie}
                onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, allowSelfie: e.target.checked } }))}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700">Allow Selfie</span>
            </label>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.settings.requireLiveness}
                onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, requireLiveness: e.target.checked } }))}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700">Require Liveness</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function TierProfilesTab() {
  const [showArchived, setShowArchived] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; profile?: TierProfile }>({ open: false });
  const [archiveTarget, setArchiveTarget] = useState<TierProfile | null>(null);

  const { data: profiles, isLoading } = useTierProfiles(showArchived);
  const { archive } = useTierProfileActions();

  if (isLoading) return <div className="space-y-4">{[0, 1, 2].map(i => <SkeletonCard key={i} />)}</div>;

  const active = (profiles ?? []).filter(p => !p.isArchived);
  const archived = (profiles ?? []).filter(p => p.isArchived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Tier Profiles</h2>
          <p className="text-xs text-gray-500 mt-0.5">Define the checks and attributes required for each verification tier</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded border-gray-300" />
            Show archived
          </label>
          <button
            onClick={() => setFormModal({ open: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} />
            New Tier
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {active.map(p => (
          <TierProfileCard
            key={p.id}
            profile={p}
            onEdit={p => setFormModal({ open: true, profile: p })}
            onArchive={setArchiveTarget}
          />
        ))}
        {active.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No active tier profiles</div>
        )}
      </div>

      {showArchived && archived.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Archived</p>
          {archived.map(p => (
            <TierProfileCard key={p.id} profile={p} onEdit={() => {}} onArchive={() => {}} />
          ))}
        </div>
      )}

      <TierProfileFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false })}
        initial={formModal.profile}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={async () => {
          if (archiveTarget) {
            await archive.mutateAsync(archiveTarget.id);
            setArchiveTarget(null);
          }
        }}
        title="Archive Tier Profile"
        description={`Archive "${archiveTarget?.name}"? Existing applicants using this tier won't be affected, but it won't be selectable for new workflows.`}
        confirmLabel="Archive"
        variant="warning"
        loading={archive.isPending}
      />
    </div>
  );
}

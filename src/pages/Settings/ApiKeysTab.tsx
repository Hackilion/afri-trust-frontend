import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Copy, Check, Sparkles } from 'lucide-react';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../../hooks/useSettings';
import { useSession } from '../../hooks/useSession';
import { isLiveApi } from '../../lib/apiConfig';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { ApiKeyEnvironment, ApiKeyPermission } from '../../types';

function CopyIconButton({ text, title }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={title}
      aria-label={title ?? 'Copy to clipboard'}
      className="text-gray-400 hover:text-indigo-600 transition-colors p-1 shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function ApiKeysTab() {
  const { workspaceOrgId } = useSession();
  const live = isLiveApi();
  const { data: keys, isLoading } = useApiKeys();
  const { mutate: createKey, data: newKeyData, isPending: creating } = useCreateApiKey();
  const { mutate: revokeKey, isPending: revoking } = useRevokeApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', env: 'test' as ApiKeyEnvironment, permissions: ['applicants:read'] as ApiKeyPermission[] });
  /** Full secrets we only learn at create time — keep in memory so the table copy matches the green banner. */
  const [fullKeyById, setFullKeyById] = useState<Record<string, string>>({});

  const PERMS: { value: ApiKeyPermission; label: string }[] = [
    { value: 'applicants:read', label: 'Read applicants' },
    { value: 'applicants:write', label: 'Write applicants' },
    { value: 'webhooks:read', label: 'Read webhooks' },
    { value: 'webhooks:write', label: 'Write webhooks' },
  ];

  const togglePerm = (p: ApiKeyPermission) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p],
    }));
  };

  const handleCreate = () => {
    if (!form.name.trim() || form.permissions.length === 0) return;
    createKey([form.name.trim(), form.env, form.permissions], {
      onSuccess: data => {
        setFullKeyById(prev => ({ ...prev, [data.key.id]: data.fullKey }));
        setShowCreate(false);
      },
    });
  };

  if (live && !workspaceOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center text-sm text-amber-900">
        <p className="font-semibold">Select a workspace</p>
        <p className="mt-2 text-amber-800/90">API keys are tied to an organisation. Choose a tenant in the header to list and create keys.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        to="/settings/integration-demo"
        className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-[13px] font-medium text-violet-900 transition-colors hover:border-violet-300 hover:bg-violet-50"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
        <span>
          <span className="font-semibold">New:</span> run a sandbox walkthrough — see requests &amp; webhooks for your organisation (no real calls).
        </span>
      </Link>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">Manage API keys for authenticating your integration with AfriTrust.</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Key
        </button>
      </div>

      {/* One-time reveal */}
      {newKeyData && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-emerald-800 mb-1">Copy this key now — it won't be shown again</p>
            <code className="text-[13px] font-mono text-emerald-900">{newKeyData.fullKey}</code>
          </div>
          <CopyIconButton text={newKeyData.fullKey} title="Copy full API key" />
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-900">Create new API key</h3>
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Key name</label>
            <input
              type="text"
              placeholder="e.g. Production Integration"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          {!live ? (
            <div>
              <label className="text-[12px] font-medium text-gray-600 block mb-2">Environment</label>
              <div className="flex gap-2">
                {(['test', 'live'] as ApiKeyEnvironment[]).map(env => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, env }))}
                    className={cn('px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all capitalize', form.env === env ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-600 border-gray-200 hover:border-indigo-300')}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Keys are created for your signed-in organisation. The backend stores <strong>scopes</strong> only (shown as permissions below); the test/live toggle applies to mock mode.
            </p>
          )}
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-2">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {PERMS.map(p => (
                <button
                  key={p.value}
                  onClick={() => togglePerm(p.value)}
                  className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all', form.permissions.includes(p.value) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-gray-600 border-gray-200 hover:border-gray-300')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!form.name.trim() || form.permissions.length === 0 || creating}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-50 bg-gray-50/50">
            <tr>
              {['Name', 'Environment', 'Permissions', 'Last used', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-gray-400">Loading...</td></tr>
            ) : !keys?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-gray-500">
                  No API keys yet. Create one to call AfriTrust from your servers with <code className="rounded bg-gray-100 px-1 font-mono text-[12px]">X-API-Key</code>.
                </td>
              </tr>
            ) : (
              keys.map(key => {
                const fullSecret =
                  fullKeyById[key.id] ??
                  (newKeyData?.key.id === key.id ? newKeyData.fullKey : undefined);
                return (
              <tr key={key.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3.5">
                  <p className="text-[13px] font-semibold text-gray-800">{key.name}</p>
                  <code className="text-[11px] text-gray-400 font-mono flex items-center gap-1 min-w-0 max-w-md">
                    <span className="truncate">{key.prefix}</span>
                    <span className="shrink-0">…</span>
                    {fullSecret ? (
                      <CopyIconButton
                        text={fullSecret}
                        title="Copy full API key (only available in this session after creation)"
                      />
                    ) : null}
                  </code>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', key.environment === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600')}>
                    {key.environment}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.length ? (
                      key.permissions.map(p => (
                        <span key={p} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{p}</span>
                      ))
                    ) : (
                      <span className="text-[12px] text-gray-400">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[12px] text-gray-500">{key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : '—'}</td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', key.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500 line-through')}>
                    {key.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {key.status === 'active' && (
                    <button onClick={() => revokeKey(key.id)} disabled={revoking} className="text-[12px] text-red-500 hover:text-red-700 font-medium disabled:opacity-50">Revoke</button>
                  )}
                </td>
              </tr>
                );
              })
            )}
          </tbody>
        </table>
        <p className="px-4 py-3 text-[11px] text-gray-500 border-t border-gray-50 bg-gray-50/30">
          Only a short prefix is stored for each key. The full secret is shown once in the green banner when you create
          a key; use the copy icon on that key’s row during this session to copy the complete value.
        </p>
      </div>
    </div>
  );
}

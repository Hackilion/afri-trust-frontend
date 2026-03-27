import { useState } from 'react';
import { Plus, Copy, Check } from 'lucide-react';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../../hooks/useSettings';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { ApiKeyEnvironment, ApiKeyPermission } from '../../types';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-gray-400 hover:text-indigo-600 transition-colors p-1">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function ApiKeysTab() {
  const { data: keys, isLoading } = useApiKeys();
  const { mutate: createKey, data: newKeyData, isPending: creating } = useCreateApiKey();
  const { mutate: revokeKey, isPending: revoking } = useRevokeApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', env: 'test' as ApiKeyEnvironment, permissions: ['applicants:read'] as ApiKeyPermission[] });

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
    createKey([form.name, form.env, form.permissions], {
      onSuccess: () => setShowCreate(false),
    });
  };

  return (
    <div className="space-y-4">
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
          <CopyButton text={newKeyData.fullKey} />
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
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-2">Environment</label>
            <div className="flex gap-2">
              {(['test', 'live'] as ApiKeyEnvironment[]).map(env => (
                <button
                  key={env}
                  onClick={() => setForm(f => ({ ...f, env }))}
                  className={cn('px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all capitalize', form.env === env ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-600 border-gray-200 hover:border-indigo-300')}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>
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
            <button onClick={() => setShowCreate(false)} className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={!form.name || creating} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
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
            ) : keys?.map(key => (
              <tr key={key.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3.5">
                  <p className="text-[13px] font-semibold text-gray-800">{key.name}</p>
                  <code className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                    {key.prefix}
                    <CopyButton text={key.prefix} />
                  </code>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', key.environment === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600')}>
                    {key.environment}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.map(p => (
                      <span key={p} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{p}</span>
                    ))}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

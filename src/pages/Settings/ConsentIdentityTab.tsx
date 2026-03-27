import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Fingerprint, ScrollText, ShieldCheck } from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { useAllConsents } from '../../hooks/useConsent';
import { useUIStore } from '../../store/uiStore';
import { isLiveApi } from '../../lib/apiConfig';
import {
  fetchIdentityAttributes,
  grantConsentForSession,
} from '../../services/consentService';
import { formatDateTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { ConsentAttribute } from '../../types';

const ATTRIBUTE_OPTIONS: { id: ConsentAttribute; label: string }[] = [
  { id: 'full_name', label: 'Full name' },
  { id: 'date_of_birth', label: 'Date of birth' },
  { id: 'nationality', label: 'Nationality' },
  { id: 'address', label: 'Address' },
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'document_number', label: 'Document number' },
  { id: 'face_image', label: 'Face image' },
];

function toggleInSet<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

export function ConsentIdentityTab() {
  const addToast = useUIStore(s => s.addToast);
  const qc = useQueryClient();
  const { workspaceOrgId } = useSession();
  const live = isLiveApi();

  const [activeOnly, setActiveOnly] = useState(false);
  const { data: orgGrants, isLoading: listLoading } = useAllConsents(activeOnly);

  const [sessionId, setSessionId] = useState('');
  const [expiresDays, setExpiresDays] = useState(30);
  const [grantAttrs, setGrantAttrs] = useState<Set<ConsentAttribute>>(
    () => new Set(ATTRIBUTE_OPTIONS.map(o => o.id))
  );
  const [lastToken, setLastToken] = useState('');

  const [identityApplicantId, setIdentityApplicantId] = useState('');
  const [identityToken, setIdentityToken] = useState('');
  const [identityAttrs, setIdentityAttrs] = useState<Set<ConsentAttribute>>(
    () => new Set(['full_name', 'email'])
  );
  const [identityResult, setIdentityResult] = useState<Record<string, unknown> | null>(null);

  const grantMut = useMutation({
    mutationFn: () =>
      grantConsentForSession(sessionId.trim(), {
        granted_attributes: [...grantAttrs],
        expires_in_days: Math.max(1, Math.min(365, expiresDays)),
      }),
    onSuccess: res => {
      setLastToken(res.verificationToken);
      void qc.invalidateQueries({ queryKey: ['consents'] });
      addToast('Consent created. Store the verification token securely.', 'success');
    },
    onError: (e: Error) => addToast(e.message || 'Grant failed', 'error'),
  });

  const identityMut = useMutation({
    mutationFn: () =>
      fetchIdentityAttributes(
        identityApplicantId.trim(),
        [...identityAttrs],
        identityToken.trim()
      ),
    onSuccess: attrs => {
      setIdentityResult(attrs);
      addToast('Identity attributes loaded (audit event recorded).', 'success');
    },
    onError: (e: Error) => addToast(e.message || 'Identity request failed', 'error'),
  });

  const copyText = useCallback(
    (text: string, msg: string) => {
      void navigator.clipboard.writeText(text).then(() => addToast(msg, 'success'));
    },
    [addToast]
  );

  const sortedGrants = useMemo(() => orgGrants ?? [], [orgGrants]);

  if (!workspaceOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center text-sm text-amber-900">
        <p className="font-semibold">Select a workspace first</p>
        <p className="mt-2 text-amber-800/90">
          Consent and identity tools are scoped to your organisation. Choose a tenant in the header.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!live && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Mock API mode</p>
          <p className="mt-1 text-amber-900/90">
            Org consent list uses local mock data. Grant and identity API tools require{' '}
            <code className="rounded bg-amber-100/80 px-1 font-mono text-[12px]">VITE_USE_LIVE_API</code> or dev proxy to
            the backend.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-indigo-500" />
              Organisation consent grants
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5 max-w-xl">
              Data-sharing grants created from verification sessions. Revoke from the applicant profile.
            </p>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={e => setActiveOnly(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Active only
          </label>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          {listLoading ? (
            <p className="p-8 text-center text-sm text-gray-400">Loading…</p>
          ) : sortedGrants.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">No consent grants in this workspace.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-2.5 font-semibold text-gray-600">Applicant</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600">Session</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600">Attributes</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGrants.map(g => (
                    <tr key={g.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/applicants/${g.applicantId}`}
                          className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {g.grantedTo.split(' · ')[0] || 'Applicant'}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">{g.grantedTo.split(' · ')[1] ?? '—'}</td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-600 max-w-[200px] truncate" title={g.grantedAttributes.join(', ')}>
                        {g.grantedAttributes.join(', ')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'text-[11px] font-semibold',
                            g.isActive ? 'text-emerald-600' : g.revokedAt ? 'text-red-500' : 'text-gray-400'
                          )}
                        >
                          {g.isActive ? 'Active' : g.revokedAt ? 'Revoked' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-[12px] whitespace-nowrap">{formatDateTime(g.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {live && (
        <>
          <section className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Grant consent (API mirror)
            </h3>
            <p className="text-[12px] text-gray-600 leading-relaxed">
              Calls <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">POST /v1/verifications/&#123;session_id&#125;/consent</code>.
              Use a verification session that belongs to your organisation. The response includes a{' '}
              <strong>verification token</strong> for the identity endpoint below.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Session ID</span>
                <input
                  value={sessionId}
                  onChange={e => setSessionId(e.target.value)}
                  placeholder="UUID"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-mono"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Expires in (days)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={expiresDays}
                  onChange={e => setExpiresDays(Number(e.target.value) || 30)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px]"
                />
              </label>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Granted attributes</legend>
              <div className="flex flex-wrap gap-2">
                {ATTRIBUTE_OPTIONS.map(opt => (
                  <label
                    key={opt.id}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors',
                      grantAttrs.has(opt.id)
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={grantAttrs.has(opt.id)}
                      onChange={() => setGrantAttrs(prev => toggleInSet(prev, opt.id))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={grantMut.isPending || !sessionId.trim() || grantAttrs.size === 0}
                onClick={() => grantMut.mutate()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {grantMut.isPending ? 'Granting…' : 'Grant consent'}
              </button>
            </div>
            {lastToken ? (
              <div className="rounded-lg border border-gray-200 bg-slate-950 p-3 text-emerald-200/95">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verification token</span>
                  <button
                    type="button"
                    onClick={() => copyText(lastToken, 'Token copied')}
                    className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/15"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap break-all">{lastToken}</pre>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-violet-600" />
              Fetch identity attributes
            </h3>
            <p className="text-[12px] text-gray-600 leading-relaxed">
              Calls{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px]">GET /v1/identities/&#123;applicant_id&#125;</code>{' '}
              with your JWT. Only attributes covered by the grant and present on approved verification sessions are returned.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Applicant ID</span>
                <input
                  value={identityApplicantId}
                  onChange={e => setIdentityApplicantId(e.target.value)}
                  placeholder="UUID"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-mono"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Verification token</span>
                <textarea
                  value={identityToken}
                  onChange={e => setIdentityToken(e.target.value)}
                  rows={2}
                  placeholder="From grant response"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-mono"
                />
              </label>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Requested attributes</legend>
              <div className="flex flex-wrap gap-2">
                {ATTRIBUTE_OPTIONS.map(opt => (
                  <label
                    key={opt.id}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors',
                      identityAttrs.has(opt.id)
                        ? 'border-violet-300 bg-violet-50 text-violet-900'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={identityAttrs.has(opt.id)}
                      onChange={() => setIdentityAttrs(prev => toggleInSet(prev, opt.id))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              disabled={
                identityMut.isPending ||
                !identityApplicantId.trim() ||
                !identityToken.trim() ||
                identityAttrs.size === 0
              }
              onClick={() => identityMut.mutate()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {identityMut.isPending ? 'Fetching…' : 'Fetch attributes'}
            </button>
            {identityResult ? (
              <pre className="max-h-64 overflow-auto rounded-lg border border-gray-100 bg-slate-950 p-3 text-[11px] leading-relaxed text-emerald-200/95 font-mono">
                {JSON.stringify(identityResult, null, 2)}
              </pre>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, UserPlus, Trash2, Users, ExternalLink } from 'lucide-react';
import { useTeam, useInviteTeamMember, useRemoveTeamMember } from '../../hooks/useSettings';
import { useSession } from '../../hooks/useSession';
import { useUIStore } from '../../store/uiStore';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { CompanyOnboardingDraft } from '../../types/companyOnboarding';
import type { TeamRole } from '../../types';

const ROLES: { value: TeamRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin', desc: 'Integrations & team' },
  { value: 'reviewer', label: 'Reviewer', desc: 'Decisioning' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only' },
];

type Props = {
  draft: CompanyOnboardingDraft;
  onEditPrimaryContact: () => void;
};

export function CompanyManagementTeamSection({ draft, onEditPrimaryContact }: Props) {
  const addToast = useUIStore(s => s.addToast);
  const { workspaceOrgId, can, isSuperAdmin } = useSession();
  const { data: team, isLoading } = useTeam();
  const { mutate: invite, isPending: inviting } = useInviteTeamMember();
  const { mutate: remove } = useRemoveTeamMember();
  const canInvite = can('settings.team.invite');
  const canRemove = can('settings.team.remove');

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('reviewer');

  const leadName = [draft.leadFirstName, draft.leadLastName].filter(Boolean).join(' ').trim();
  const leadEmail = draft.leadEmail.trim();

  const handleInvite = () => {
    invite(
      { email, role },
      {
        onSuccess: () => {
          setShowInvite(false);
          setEmail('');
          addToast('Invitation sent', 'success');
        },
      }
    );
  };

  const copyInviteTemplate = () => {
    const org = draft.legalName.trim() || draft.tradingName.trim() || 'our organisation';
    const text = `You're invited to join ${org} on AfriTrust Identity.\nAccept at: https://app.afritrust.io/register\nContact: ${leadEmail || '—'}`;
    void navigator.clipboard.writeText(text).then(() => addToast('Invite template copied', 'success'));
  };

  if (!workspaceOrgId) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Users className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">Company access & users</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-lg">
                {isSuperAdmin
                  ? 'Select a company in the top bar to load that workspace’s member roster and send invites. Your KYB draft below is the planned primary contact.'
                  : 'Connect this profile to your workspace to manage seats. The fields below come from your company setup (primary contact).'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary contact (KYB draft)</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-800">
              <Mail className="h-4 w-4 text-indigo-500" />
              <span className="font-medium">{leadName || 'Name not set'}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{leadEmail || '—'}</span>
            </div>
            <button
              type="button"
              onClick={onEditPrimaryContact}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Edit in wizard
            </button>
            <button
              type="button"
              onClick={copyInviteTemplate}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-200"
            >
              Copy invite blurb
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 text-indigo-600">
            <Building2 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">Workspace members</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              People with access to this company’s AfriTrust tenant. Roles control applicants, workflows, and settings.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                to="/settings/team"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Open full team settings
                <ExternalLink className="h-3 w-3" />
              </Link>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={onEditPrimaryContact}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
              >
                KYB primary contact
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {canInvite && (
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite member
            </button>
          )}
          <button
            type="button"
            onClick={copyInviteTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-200"
          >
            Copy invite text
          </button>
        </div>
      </div>

      {showInvite && canInvite && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 animate-fade-in">
          <p className="text-xs font-semibold text-slate-800">Invite by email</p>
          <input
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  'rounded-lg border px-2 py-2 text-left transition-all',
                  role === r.value ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <p className="text-[11px] font-semibold text-slate-900">{r.label}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInvite}
              disabled={!email.trim() || inviting}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-indigo-500"
            >
              {inviting ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Member</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Active</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-500">
                  Loading roster…
                </td>
              </tr>
            ) : !team?.length ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-500">
                  No members loaded.
                </td>
              </tr>
            ) : (
              team.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-800">
                        {m.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{m.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-800">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase',
                        m.status === 'active' ? 'text-emerald-600' : m.status === 'invited' ? 'text-amber-600' : 'text-slate-500'
                      )}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500">
                    {m.lastActiveAt ? formatRelativeTime(m.lastActiveAt) : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {canRemove && m.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${m.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        <span className="font-medium text-slate-700">{team?.length ?? 0}</span> seat{team?.length !== 1 ? 's' : ''} in this
        workspace · Owner role is managed from Settings.
      </p>
    </div>
  );
}

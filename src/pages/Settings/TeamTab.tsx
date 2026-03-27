import { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { useTeam, useInviteTeamMember, useRemoveTeamMember } from '../../hooks/useSettings';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { TeamRole } from '../../types';

const ROLES: { value: TeamRole; label: string; desc: string }[] = [
  { value: 'owner', label: 'Owner', desc: 'Full access' },
  { value: 'admin', label: 'Admin', desc: 'Manage team & settings' },
  { value: 'reviewer', label: 'Reviewer', desc: 'Approve/reject applicants' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access' },
];

export function TeamTab() {
  const { data: team, isLoading } = useTeam();
  const { mutate: invite, isPending: inviting } = useInviteTeamMember();
  const { mutate: remove } = useRemoveTeamMember();

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('reviewer');

  const handleInvite = () => {
    invite({ email, role }, { onSuccess: () => { setShowInvite(false); setEmail(''); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">Manage who has access to your AfriTrust workspace.</p>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <UserPlus className="w-3.5 h-3.5" /> Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold">Invite team member</h3>
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Email address</label>
            <input type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-2">Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLES.filter(r => r.value !== 'owner').map(r => (
                <button key={r.value} onClick={() => setRole(r.value)} className={cn('p-2.5 rounded-lg border text-left transition-all', role === r.value ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200 hover:border-gray-300')}>
                  <p className="text-[12px] font-semibold text-gray-800">{r.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowInvite(false)} className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleInvite} disabled={!email || inviting} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-medium disabled:opacity-50 hover:bg-indigo-700">
              {inviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-50 bg-gray-50/50">
            <tr>
              {['Member', 'Role', 'Status', 'Last active', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-[13px]">Loading...</td></tr>
              : team?.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-[11px] font-bold text-indigo-700">
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">{m.name}</p>
                        <p className="text-[11px] text-gray-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 capitalize">{m.role}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', m.status === 'active' ? 'bg-emerald-50 text-emerald-700' : m.status === 'invited' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500')}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-gray-500">{m.lastActiveAt ? formatRelativeTime(m.lastActiveAt) : '—'}</td>
                  <td className="px-4 py-3.5">
                    {m.role !== 'owner' && (
                      <button onClick={() => remove(m.id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

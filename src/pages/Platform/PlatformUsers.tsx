import { useMemo, useState } from 'react';
import { Filter, Search, Shield, UserCog } from 'lucide-react';
import { useOrganizations, usePlatformUserDirectory, useUpdatePlatformUser } from '../../hooks/usePlatformAdmin';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import type { PlatformUserRecord } from '../../types/rbac';
import type { TeamRole } from '../../types/settings';

const ROLES: TeamRole[] = ['owner', 'admin', 'reviewer', 'viewer'];

function UserRow({
  row,
  orgOptions,
  onSave,
  saving,
}: {
  row: PlatformUserRecord;
  orgOptions: { id: string; name: string }[];
  onSave: (id: string, patch: Partial<Pick<PlatformUserRecord, 'orgId' | 'orgRole' | 'status'>>) => void;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [orgId, setOrgId] = useState(row.orgId ?? '');
  const [orgRole, setOrgRole] = useState<TeamRole>((row.orgRole ?? 'viewer') as TeamRole);
  const [status, setStatus] = useState(row.status);

  const isPlatform = row.platformRole === 'super_admin';

  const apply = () => {
    const oid = orgId.trim() || null;
    onSave(row.id, {
      orgId: oid,
      orgRole: oid ? orgRole : null,
      status,
    });
    setOpen(false);
  };

  return (
    <>
      <tr className={cn('hover:bg-slate-50/60', open && 'bg-indigo-50/40')}>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-[11px] font-bold text-indigo-800">
              {row.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{row.name}</p>
              <p className="text-xs text-slate-500">{row.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5">
          {isPlatform ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800">
              <Shield className="h-3 w-3" />
              Super admin
            </span>
          ) : (
            <span className="text-sm text-slate-700">{row.orgName ?? '—'}</span>
          )}
        </td>
        <td className="px-4 py-3.5">
          {row.orgRole ? (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-800">
              {row.orgRole}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3.5">
          <span
            className={cn(
              'text-[11px] font-bold uppercase tracking-wide',
              row.status === 'active'
                ? 'text-emerald-700'
                : row.status === 'invited'
                  ? 'text-amber-700'
                  : 'text-red-700'
            )}
          >
            {row.status}
          </span>
        </td>
        <td className="px-4 py-3.5 text-xs text-slate-500">
          {row.lastActiveAt ? formatRelativeTime(row.lastActiveAt) : '—'}
        </td>
        <td className="px-4 py-3.5 text-right">
          {!isPlatform && (
            <button
              type="button"
              onClick={() => {
                setOrgId(row.orgId ?? '');
                setOrgRole((row.orgRole ?? 'viewer') as TeamRole);
                setStatus(row.status);
                setOpen(!open);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-800"
            >
              <UserCog className="h-3.5 w-3.5" />
              {open ? 'Close' : 'Manage'}
            </button>
          )}
        </td>
      </tr>
      {open && !isPlatform && (
        <tr className="bg-indigo-50/30">
          <td colSpan={6} className="px-4 py-4">
            <div className="flex flex-col gap-4 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
              <label className="block min-w-[200px] flex-1">
                <span className="text-[11px] font-bold uppercase text-slate-500">Organisation</span>
                <select
                  value={orgId}
                  onChange={e => setOrgId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {orgOptions.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-[140px]">
                <span className="text-[11px] font-bold uppercase text-slate-500">Workspace role</span>
                <select
                  value={orgRole}
                  onChange={e => setOrgRole(e.target.value as TeamRole)}
                  disabled={!orgId}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-[140px]">
                <span className="text-[11px] font-bold uppercase text-slate-500">Account status</span>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as PlatformUserRecord['status'])}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="active">active</option>
                  <option value="invited">invited</option>
                  <option value="suspended">suspended</option>
                </select>
              </label>
              <button
                type="button"
                disabled={saving || (!!orgId && !orgRole)}
                onClick={apply}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Save changes
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PlatformUsers() {
  const { data: rows, isLoading } = usePlatformUserDirectory();
  const { data: orgs } = useOrganizations();
  const { mutate: updateUser, isPending: saving } = useUpdatePlatformUser();

  const [q, setQ] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const orgOptions = useMemo(() => (orgs ?? []).map(o => ({ id: o.id, name: o.name })), [orgs]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    return list.filter(r => {
      const matchQ =
        !q.trim() ||
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.email.toLowerCase().includes(q.toLowerCase());
      const matchOrg = orgFilter === 'all' || r.orgId === orgFilter || (orgFilter === 'none' && !r.orgId);
      const matchRole =
        roleFilter === 'all' ||
        (roleFilter === 'platform' && r.platformRole) ||
        (roleFilter !== 'platform' && r.orgRole === roleFilter);
      return matchQ && matchOrg && matchRole;
    });
  }, [rows, q, orgFilter, roleFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">User management</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Global directory of identities across tenants. Reassign organisations, adjust workspace roles, and suspend access —
          this demo updates in-memory fixtures only.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={orgFilter}
            onChange={e => setOrgFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
          >
            <option value="all">All organisations</option>
            <option value="none">Unassigned</option>
            {orgOptions.map(o => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
          >
            <option value="all">All roles</option>
            <option value="platform">Platform</option>
            {ROLES.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              {['User', 'Organisation', 'Role', 'Status', 'Last active', ''].map(h => (
                <th key={h || 'a'} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  Loading directory…
                </td>
              </tr>
            ) : (
              filtered.map(row => (
                <UserRow
                  key={row.id}
                  row={row}
                  orgOptions={orgOptions}
                  saving={saving}
                  onSave={(id, patch) => updateUser({ userId: id, patch })}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

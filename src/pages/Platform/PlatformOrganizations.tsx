import { useMemo, useState } from 'react';
import { Building2, Search, SlidersHorizontal } from 'lucide-react';
import { useOrganizations } from '../../hooks/usePlatformAdmin';
import { cn } from '../../lib/utils';
import type { OrganizationStatus } from '../../types/rbac';

const STATUS_FILTER: (OrganizationStatus | 'all')[] = ['all', 'active', 'trial', 'suspended'];

export default function PlatformOrganizations() {
  const { data: orgs, isLoading } = useOrganizations();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<OrganizationStatus | 'all'>('all');

  const filtered = useMemo(() => {
    const list = orgs ?? [];
    return list.filter(o => {
      const matchQ =
        !q.trim() ||
        o.name.toLowerCase().includes(q.toLowerCase()) ||
        o.slug.toLowerCase().includes(q.toLowerCase()) ||
        o.id.toLowerCase().includes(q.toLowerCase());
      const matchS = status === 'all' || o.status === status;
      return matchQ && matchS;
    });
  }, [orgs, q, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Organisations</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Every company workspace on the platform. Use this view for support, billing alignment, and compliance escalations.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, slug, or ID…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTER.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  status === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              {['Organisation', 'Plan', 'Region', 'Members', 'Applicants / mo', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  Loading organisations…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No organisations match your filters.
                </td>
              </tr>
            ) : (
              filtered.map(org => (
                <tr key={org.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{org.name}</p>
                        <p className="text-xs font-mono text-slate-500">{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 capitalize text-slate-700">{org.plan}</td>
                  <td className="px-4 py-3.5 text-slate-600">{org.region}</td>
                  <td className="px-4 py-3.5 tabular-nums font-medium text-slate-900">{org.memberCount}</td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-700">{org.applicantsThisMonth}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                        org.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : org.status === 'trial'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-red-100 text-red-800'
                      )}
                    >
                      {org.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

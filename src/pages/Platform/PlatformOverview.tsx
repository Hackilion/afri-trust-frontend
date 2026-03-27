import { Link } from 'react-router-dom';
import { Building2, LayoutGrid, Users, TrendingUp, ArrowRight, Shield } from 'lucide-react';
import { usePlatformStats, useOrganizations } from '../../hooks/usePlatformAdmin';
import { cn } from '../../lib/utils';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Users;
  tone: 'indigo' | 'violet' | 'emerald' | 'amber';
}) {
  const tones = {
    indigo: 'from-indigo-500/15 to-indigo-600/5 text-indigo-600 border-indigo-200/60',
    violet: 'from-violet-500/15 to-violet-600/5 text-violet-600 border-violet-200/60',
    emerald: 'from-emerald-500/15 to-emerald-600/5 text-emerald-600 border-emerald-200/60',
    amber: 'from-amber-500/15 to-amber-600/5 text-amber-700 border-amber-200/60',
  } as const;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm',
        tones[tone]
      )}
    >
      <Icon className="absolute right-4 top-4 h-10 w-10 opacity-[0.12]" strokeWidth={1.25} />
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-600">{sub}</p> : null}
    </div>
  );
}

export default function PlatformOverview() {
  const { data: stats, isLoading: sLoading } = usePlatformStats();
  const { data: orgs, isLoading: oLoading } = useOrganizations();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-800">
            <Shield className="h-3.5 w-3.5" />
            Platform console
          </div>
          <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Cross-tenant overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Monitor every organisation on AfriTrust, aggregate verification volume, and drill into user access from one
            place. Tenant workspaces open when you pick a company in the header.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/platform/organizations"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
          >
            All organisations
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/platform/users"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-200 hover:text-indigo-800"
          >
            User directory
            <Users className="h-4 w-4 text-indigo-500" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Organisations"
          value={sLoading ? '—' : stats?.organizationCount ?? 0}
          sub="Live + trial tenants"
          icon={Building2}
          tone="indigo"
        />
        <StatCard
          label="Active seats"
          value={sLoading ? '—' : stats?.activeUsers ?? 0}
          sub="Across all workspaces"
          icon={Users}
          tone="violet"
        />
        <StatCard
          label="Applicants (30d)"
          value={sLoading ? '—' : stats?.applicantsThisMonth ?? 0}
          sub="Platform-wide volume"
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Trials"
          value={sLoading ? '—' : stats?.trialOrgs ?? 0}
          sub="Convert or suspend"
          icon={LayoutGrid}
          tone="amber"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent organisations</h2>
          <Link to="/platform/organizations" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {oLoading ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Loading…</p>
          ) : (
            (orgs ?? []).slice(0, 5).map(org => (
              <div key={org.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">
                    {org.region} · <span className="capitalize">{org.plan}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-900">{org.memberCount}</span> members
                  </span>
                  <span>
                    <span className="font-semibold text-slate-900">{org.applicantsThisMonth}</span> applicants / mo
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-semibold capitalize',
                      org.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800'
                        : org.status === 'trial'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-red-50 text-red-800'
                    )}
                  >
                    {org.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

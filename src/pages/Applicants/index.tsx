import { useState, useEffect } from 'react';
import { Search, Download, Users, ClipboardCheck, AlertOctagon, Globe2, Activity, Building2 } from 'lucide-react';
import { useApplicants } from '../../hooks/useApplicants';
import { useApplicantPipelineStats } from '../../hooks/useApplicantPipelineStats';
import { useSession } from '../../hooks/useSession';
import { useFilterStore } from '../../store/filterStore';
import { ApplicantFilters } from './ApplicantFilters';
import { ApplicantsTable } from './ApplicantsTable';
import { PageHeader } from '../../components/shared/PageHeader';
import { organizationNameById } from '../../services/applicantService';
import { cn } from '../../lib/utils';

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (n: number) => void;
  onPageSize: (n: number) => void;
}) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (i === 0) return 1;
    if (i === 6) return totalPages;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-slate-500">Rows per page</span>
        <select
          value={pageSize}
          onChange={e => onPageSize(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {[10, 25, 50].map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-slate-400">{total} in view</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
        >
          Prev
        </button>
        {pages.map((p, i) => (
          <button
            key={`${p}-${i}`}
            type="button"
            onClick={() => typeof p === 'number' && onPage(p)}
            className={cn(
              'h-8 min-w-[2rem] rounded-lg text-[12px] font-semibold transition-colors',
              p === page ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  accent: 'indigo' | 'emerald' | 'amber' | 'sky' | 'violet';
}) {
  const accents = {
    indigo: 'from-indigo-500/15 to-violet-500/10 text-indigo-700 ring-indigo-500/15',
    emerald: 'from-emerald-500/15 to-teal-500/10 text-emerald-800 ring-emerald-500/20',
    amber: 'from-amber-500/15 to-orange-500/10 text-amber-900 ring-amber-500/20',
    sky: 'from-sky-500/15 to-cyan-500/10 text-sky-900 ring-sky-500/20',
    violet: 'from-violet-500/15 to-fuchsia-500/10 text-violet-900 ring-violet-500/20',
  };
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br p-4 shadow-sm ring-1 backdrop-blur-sm',
        accents[accent]
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          <Icon className="h-5 w-5 opacity-90" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-0.5 text-[11px] font-medium text-slate-600/90">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function Applicants() {
  const [searchInput, setSearchInput] = useState('');
  const { filters, setFilter, setPage } = useFilterStore();
  const { workspaceOrgId, isSuperAdmin } = useSession();
  const { data, isLoading } = useApplicants();
  const { data: stats } = useApplicantPipelineStats();

  useEffect(() => {
    const timer = setTimeout(() => setFilter('search', searchInput || undefined), 300);
    return () => clearTimeout(timer);
  }, [searchInput, setFilter]);

  if (!workspaceOrgId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Applicants"
          subtitle="Identity applications are scoped to your organisation."
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white px-6 py-16 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Building2 className="h-7 w-7" strokeWidth={2} />
          </span>
          <div className="max-w-md">
            <h3 className="text-lg font-semibold text-slate-900">Choose a workspace</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {isSuperAdmin
                ? 'Super admins must pick a tenant in the header to view applicants. Each record belongs to exactly one organisation and is never shared across tenants.'
                : 'Your account is not linked to an organisation workspace. Contact your administrator so you can access the right applicant queue.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const orgName = organizationNameById(workspaceOrgId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applicants"
        subtitle={
          data
            ? `${orgName} · Showing ${data.data.length} of ${data.total} identities for this workspace only.`
            : `Loading ${orgName} pipeline…`
        }
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
          >
            <Download className="h-3.5 w-3.5 text-indigo-500" /> Export CSV
          </button>
        }
      />

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={Users}
            label="Total identities"
            value={stats.total}
            sub="This organisation only"
            accent="indigo"
          />
          <StatCard
            icon={ClipboardCheck}
            label="Verified"
            value={stats.byStatus.verified}
            sub={`${stats.inProgressPct}% avg. pipeline fill`}
            accent="emerald"
          />
          <StatCard
            icon={AlertOctagon}
            label="Needs review"
            value={stats.needsReview}
            sub={stats.openHighRisk ? `${stats.openHighRisk} open high-risk` : 'Queue clear'}
            accent="amber"
          />
          <StatCard
            icon={Globe2}
            label="Cross-border"
            value={stats.crossBorder}
            sub="Nationality ≠ residence"
            accent="sky"
          />
          <StatCard
            icon={Activity}
            label="Avg risk score"
            value={stats.avgRiskScore}
            sub="This workspace portfolio"
            accent="violet"
          />
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search name, ID, email, phone, partner ref, or compliance tag…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full rounded-2xl border border-slate-200/90 bg-white py-3.5 pl-11 pr-4 text-[13px] text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      <ApplicantFilters />

      <div className="space-y-0">
        <ApplicantsTable applicants={data?.data ?? []} isLoading={isLoading} />
        {data && data.totalPages > 1 && (
          <div className="-mt-px overflow-hidden rounded-b-2xl border border-t-0 border-slate-200/80 bg-white">
            <Pagination
              page={filters.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={filters.pageSize}
              onPage={setPage}
              onPageSize={n => setFilter('pageSize', n)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

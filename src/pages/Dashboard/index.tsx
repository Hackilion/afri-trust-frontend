import { Link } from 'react-router-dom';
import { Building2, Shield } from 'lucide-react';
import { useDashboardKpis } from '../../hooks/useDashboardStats';
import { KpiCards } from './KpiCards';
import { TrendChart } from './TrendChart';
import { StatusBreakdown } from './StatusBreakdown';
import { ActivityFeed } from './ActivityFeed';
import { formatPercent } from '../../lib/formatters';
import { useSession } from '../../hooks/useSession';
import { cn } from '../../lib/utils';

export default function Dashboard() {
  const { data: kpis, isLoading } = useDashboardKpis();
  const { user, isSuperAdmin, workspaceOrgId, can } = useSession();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const tenantMode = Boolean(workspaceOrgId);
  const showOpsKpis = tenantMode && can('applicants.read');

  if (isSuperAdmin && !workspaceOrgId) {
    return (
      <div className="space-y-6">
        <div
          className={cn(
            'overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50/60 p-8 shadow-sm'
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-800">
            <Shield className="h-3.5 w-3.5" />
            Platform mode
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
            {greeting}, {user?.name?.split(' ')[0] ?? 'there'}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-gray-600 leading-relaxed">
            You are not scoped to a single tenant. Open the <strong>platform console</strong> for cross-organisation metrics, or
            choose a company in the header to load the standard workspace (applicants, workflows, settings) as that tenant.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/platform"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
            >
              Open platform overview
            </Link>
            <Link
              to="/platform/users"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:border-indigo-200"
            >
              User directory
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 flex gap-4">
          <Building2 className="h-10 w-10 shrink-0 text-amber-700/80" />
          <div>
            <p className="text-sm font-semibold text-amber-950">Select a tenant workspace</p>
            <p className="mt-1 text-sm text-amber-900/80">
              Use the company dropdown in the top bar to impersonate Ghana Commerce Bank, Nairobi Pay, or Lagos Lend and unlock
              the full product surface for demos and support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {greeting}, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {!can('applicants.write') && can('applicants.read') && (
            <span className="mr-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              Read-only workspace
            </span>
          )}
          {showOpsKpis && kpis
            ? `${kpis.pending + kpis.needsReview} applications need attention · ${formatPercent(kpis.approvalRate)} approval rate`
            : 'Workspace overview'}
        </p>
      </div>

      {showOpsKpis ? (
        <>
          <KpiCards kpis={kpis} isLoading={isLoading} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TrendChart />
            </div>
            <div>
              <StatusBreakdown kpis={kpis} />
            </div>
          </div>
          <ActivityFeed />
        </>
      ) : (
        <p className="text-sm text-gray-500">Loading workspace context…</p>
      )}
    </div>
  );
}

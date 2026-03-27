import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, ChevronDown, Search, Shield } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useOrganizations } from '../hooks/usePlatformAdmin';
import { mockOrganizations } from '../mocks/organizations';
import { cn } from '../lib/utils';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/company-onboarding': 'Company onboarding',
  '/applicants': 'Applicants',
  '/settings': 'Settings',
  '/settings/api-keys': 'Settings',
  '/settings/integration-demo': 'Settings · Integration demo',
  '/settings/webhooks': 'Settings',
  '/settings/team': 'Settings',
  '/settings/tier-profiles': 'Settings',
  '/settings/check-catalogue': 'Settings',
  '/platform': 'Platform',
  '/platform/organizations': 'Platform · Organisations',
  '/platform/users': 'Platform · User management',
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, impersonatedOrgId, setImpersonatedOrgId, workspaceOrgId, can } = useSession();
  const { data: orgs } = useOrganizations({ enabled: isSuperAdmin });

  const pathBase = '/' + location.pathname.split('/')[1];
  const isDetailPage = location.pathname.match(/^\/applicants\/APL-/);

  const title = ROUTE_TITLES[location.pathname] ?? ROUTE_TITLES[pathBase] ?? 'AfriTrust';

  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const tenantOrgName = user?.orgId ? mockOrganizations.find(o => o.id === user.orgId)?.name ?? null : null;
  const activeOrgName = isSuperAdmin
    ? (orgs?.find(o => o.id === impersonatedOrgId)?.name ?? null)
    : tenantOrgName;

  return (
    <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center px-6 gap-4 shrink-0 sticky top-0 z-20">
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-gray-900 leading-none">{title}</h1>
          {!isDetailPage && <p className="text-[12px] text-gray-400 mt-0.5">{today}</p>}
        </div>

        {isSuperAdmin && (
          <div className="relative mt-2 sm:mt-0 flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-800">
              <Shield className="h-3 w-3" />
              Super admin
            </span>
            <div className="relative min-w-0 max-w-[min(100%,280px)]">
              <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select
                value={impersonatedOrgId ?? ''}
                onChange={e => {
                  const v = e.target.value;
                  setImpersonatedOrgId(v || null);
                  if (v && !location.pathname.startsWith('/platform')) {
                    /* keep route */
                  }
                }}
                className={cn(
                  'w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-[13px] font-medium text-gray-800 shadow-sm',
                  'focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                )}
                aria-label="Tenant workspace"
              >
                <option value="">All tenants (platform mode)</option>
                {(orgs ?? []).map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
            {workspaceOrgId && activeOrgName ? (
              <span className="hidden lg:inline text-[12px] text-gray-500 truncate max-w-[140px]" title={activeOrgName}>
                Acting as <span className="font-semibold text-gray-800">{activeOrgName}</span>
              </span>
            ) : null}
          </div>
        )}

        {!isSuperAdmin && user?.orgId && (
          <span className="mt-2 sm:mt-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-[12px] text-gray-600">
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-medium text-gray-800 truncate max-w-[200px]">{activeOrgName ?? 'Workspace'}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {can('applicants.read') && (
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 rounded-lg hover:bg-gray-50 py-1 pr-2 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-semibold">
            {user?.initials ?? '—'}
          </div>
          <span className="text-[13px] font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
            {user?.name ?? 'Account'}
          </span>
        </button>
      </div>
    </header>
  );
}

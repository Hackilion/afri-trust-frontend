import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { PageHeader } from '../../components/shared/PageHeader';
import { useSession } from '../../hooks/useSession';
import type { Capability } from '../../lib/capabilities';

const TABS: { to: string; label: string; cap: Capability }[] = [
  { to: '/settings/api-keys', label: 'API Keys', cap: 'settings.api_keys' },
  { to: '/settings/webhooks', label: 'Webhooks', cap: 'settings.webhooks' },
  { to: '/settings/consent-identity', label: 'Consent & identity', cap: 'settings.consent_identity' },
  { to: '/settings/integration-demo', label: 'Integration demo', cap: 'settings.integration_demo' },
  { to: '/settings/team', label: 'Team', cap: 'settings.team' },
  { to: '/settings/appearance', label: 'Appearance', cap: 'settings.appearance' },
  { to: '/settings/tier-profiles', label: 'Tier Profiles', cap: 'settings.tier_profiles' },
  { to: '/settings/check-catalogue', label: 'Check Catalogue', cap: 'settings.check_catalogue' },
];

export default function Settings() {
  const location = useLocation();
  const { can } = useSession();
  const visible = TABS.filter(t => can(t.cap));
  const fallback = visible[0]?.to ?? '/dashboard';

  if (visible.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname === '/settings' || !visible.some(t => t.to === location.pathname)) {
    return <Navigate to={fallback} replace />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Manage your integration, team, and compliance configuration." />

      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 -mb-1">
        {visible.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
}

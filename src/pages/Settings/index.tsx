import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { PageHeader } from '../../components/shared/PageHeader';

const TABS = [
  { to: '/settings/api-keys', label: 'API Keys' },
  { to: '/settings/webhooks', label: 'Webhooks' },
  { to: '/settings/team', label: 'Team' },
  { to: '/settings/tier-profiles', label: 'Tier Profiles' },
  { to: '/settings/check-catalogue', label: 'Check Catalogue' },
];

export default function Settings() {
  const location = useLocation();
  if (location.pathname === '/settings') return <Navigate to="/settings/api-keys" replace />;

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Manage your integration, team, and compliance configuration." />

      <div className="flex items-center gap-0.5 border-b border-gray-200 -mb-1">
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => cn(
              'px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            )}
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

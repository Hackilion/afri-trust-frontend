import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  GitBranch,
  ScrollText,
  Landmark,
  Building2,
  UserCog,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useSession } from '../hooks/useSession';
import { cn } from '../lib/utils';
import type { Capability } from '../lib/capabilities';

type NavDef = { to: string; icon: LucideIcon; label: string; cap: Capability; end?: boolean };

const TENANT_NAV: NavDef[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', cap: 'nav.dashboard' },
  { to: '/company-onboarding', icon: Landmark, label: 'Company setup', cap: 'nav.company_setup' },
  { to: '/applicants', icon: Users, label: 'Applicants', cap: 'nav.applicants' },
  { to: '/workflows', icon: GitBranch, label: 'Workflows', cap: 'nav.workflows' },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Log', cap: 'nav.audit' },
  { to: '/settings', icon: Settings, label: 'Settings', cap: 'nav.settings', end: false },
];

const PLATFORM_NAV: NavDef[] = [
  { to: '/platform', icon: LayoutDashboard, label: 'Platform overview', cap: 'nav.platform', end: true },
  { to: '/platform/organizations', icon: Building2, label: 'Organisations', cap: 'nav.platform_orgs' },
  { to: '/platform/users', icon: UserCog, label: 'User management', cap: 'nav.platform_users' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, can, logout, isSuperAdmin, workspaceOrgId } = useSession();

  const tenantItems = TENANT_NAV.filter(item => can(item.cap));
  const platformItems = PLATFORM_NAV.filter(item => can(item.cap));
  const showTenantBlock = tenantItems.length > 0;
  const showPlatformBlock = platformItems.length > 0;

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[#0d0d14] border-r border-[#1e1e2e] transition-all duration-300 shrink-0 relative',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      <Link
        to="/"
        className={cn(
          'flex items-center gap-3 px-4 h-16 border-b border-[#1e1e2e] hover:bg-[#12121a] transition-colors',
          sidebarCollapsed && 'justify-center px-0'
        )}
        title="Back to landing"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shrink-0">
          <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <span className="text-white font-semibold text-[15px] tracking-tight leading-none">AfriTrust</span>
            <span className="block text-[10px] text-[#5a5a78] font-medium tracking-widest uppercase mt-0.5">Identity</span>
          </div>
        )}
      </Link>

      <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
        {showPlatformBlock && (
          <div>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-violet-400/80 uppercase tracking-widest px-3 pb-2">Platform</p>
            )}
            <div className="space-y-0.5">
              {platformItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg transition-all duration-150 group',
                      sidebarCollapsed ? 'justify-center px-0 py-2.5 mx-auto w-10' : 'px-3 py-2.5',
                      isActive
                        ? 'bg-violet-950/80 text-violet-100 ring-1 ring-violet-500/30'
                        : 'text-[#6060a0] hover:text-[#c8c8e8] hover:bg-[#16161f]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'shrink-0 transition-colors',
                          sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4',
                          isActive ? 'text-violet-300' : 'text-current'
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {!sidebarCollapsed && <span className="text-sm font-medium animate-fade-in">{label}</span>}
                      {isActive && !sidebarCollapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {showTenantBlock && (
          <div>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-[#3a3a55] uppercase tracking-widest px-3 pb-2">
                {isSuperAdmin ? 'Tenant workspace' : 'Navigation'}
              </p>
            )}
            <div className="space-y-0.5">
              {tenantItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg transition-all duration-150 group',
                      sidebarCollapsed ? 'justify-center px-0 py-2.5 mx-auto w-10' : 'px-3 py-2.5',
                      isActive ? 'bg-[#1e1e30] text-white' : 'text-[#6060a0] hover:text-[#c0c0e0] hover:bg-[#16161f]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'shrink-0 transition-colors',
                          sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4',
                          isActive ? 'text-indigo-400' : 'text-current'
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {!sidebarCollapsed && <span className="text-sm font-medium animate-fade-in">{label}</span>}
                      {isActive && !sidebarCollapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {isSuperAdmin && !workspaceOrgId && !sidebarCollapsed && (
          <p className="mx-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-snug text-amber-200/90">
            Select a company in the header to open integrations, applicants, and workflows for that tenant.
          </p>
        )}
      </nav>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-[#1e1e2e] border border-[#2e2e42] flex items-center justify-center text-[#6060a0] hover:text-white transition-colors z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className={cn('border-t border-[#1e1e2e] p-3 space-y-2', sidebarCollapsed && 'flex flex-col items-center')}>
        <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
            {user?.initials ?? '—'}
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white leading-none truncate">{user?.name ?? 'Guest'}</p>
              <p className="text-[11px] text-[#5a5a78] mt-0.5 truncate">
                {user?.platformRole === 'super_admin'
                  ? 'Super admin'
                  : user?.orgRole
                    ? user.orgRole.charAt(0).toUpperCase() + user.orgRole.slice(1)
                    : 'Member'}
              </p>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] py-2 text-[11px] font-semibold text-[#8b8ba8] hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}

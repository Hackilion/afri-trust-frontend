import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Layers,
  ScrollText,
  Landmark,
  Building2,
  UserCog,
  LogOut,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useSession } from '../hooks/useSession';
import { AfriTrustMark } from '../components/ui/afritrust-mark';
import { cn } from '../lib/utils';
import type { Capability } from '../lib/capabilities';

type NavDef = { to: string; icon: LucideIcon; label: string; cap: Capability; end?: boolean; tour?: string };

const TENANT_NAV: NavDef[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', cap: 'nav.dashboard', tour: 'tour-nav-dashboard' },
  { to: '/assistant', icon: Sparkles, label: 'Assistant', cap: 'nav.assistant' },
  { to: '/reports', icon: BarChart3, label: 'Reports', cap: 'nav.dashboard' },
  { to: '/company-onboarding', icon: Landmark, label: 'Company setup', cap: 'nav.company_setup' },
  { to: '/applicants', icon: Users, label: 'Applicants', cap: 'nav.applicants', tour: 'tour-nav-applicants' },
  { to: '/workflows', icon: GitBranch, label: 'Workflows', cap: 'nav.workflows', tour: 'tour-nav-workflows' },
  {
    to: '/tier-profiles',
    icon: Layers,
    label: 'Tier profiles',
    cap: 'nav.tier_profiles',
    tour: 'tour-nav-tier-profiles',
  },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit log', cap: 'nav.audit' },
  { to: '/settings', icon: Settings, label: 'Settings', cap: 'nav.settings', end: false, tour: 'tour-nav-settings' },
];

const PLATFORM_NAV: NavDef[] = [
  { to: '/platform', icon: LayoutDashboard, label: 'Overview', cap: 'nav.platform', end: true },
  { to: '/platform/organizations', icon: Building2, label: 'Organisations', cap: 'nav.platform_orgs' },
  { to: '/platform/users', icon: UserCog, label: 'Users', cap: 'nav.platform_users' },
];

function NavButton({
  to,
  end,
  icon: Icon,
  label,
  collapsed,
  activeClass,
  idleClass,
  iconActive,
  tour,
}: {
  to: string;
  end?: boolean;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  activeClass: string;
  idleClass: string;
  iconActive: string;
  tour?: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      {...(tour ? { 'data-tour': tour } : {})}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl transition-all duration-200',
          collapsed ? 'justify-center px-0 py-2.5 mx-auto w-11' : 'px-3 py-2.5 mx-1',
          isActive ? activeClass : idleClass
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className={cn(
                'absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full',
                iconActive.includes('violet') ? 'bg-violet-400' : 'bg-indigo-400'
              )}
            />
          )}
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-lg transition-colors',
              collapsed ? 'h-9 w-9' : 'h-8 w-8',
              isActive
                ? iconActive
                : 'bg-white/[0.04] text-[#7a7a9e] group-hover:bg-white/[0.07] group-hover:text-[#b8b8d4]'
            )}
          >
            <Icon className={cn(collapsed ? 'h-5 w-5' : 'h-4 w-4')} strokeWidth={isActive ? 2.25 : 2} />
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1 text-[13px] font-medium tracking-tight truncate">{label}</span>
          )}
          {isActive && !collapsed && (
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                iconActive.includes('violet') ? 'bg-violet-400' : 'bg-indigo-400'
              )}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

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
      data-tour="sidebar"
      className={cn(
        'flex flex-col h-screen shrink-0 relative transition-[width] duration-300 ease-out',
        'bg-[#09090f] border-r border-white/[0.06]',
        'shadow-[4px_0_24px_-8px_rgba(0,0,0,0.45)]',
        sidebarCollapsed ? 'w-[4.25rem]' : 'w-[15.5rem]'
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            'radial-gradient(ellipse 120% 80% at 0% 0%, rgba(99,102,241,0.12), transparent 55%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(139,92,246,0.08), transparent 50%)',
        }}
        aria-hidden
      />

      <Link
        to="/"
        className={cn(
          'relative z-[1] flex items-center gap-3 h-[4.25rem] border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors',
          sidebarCollapsed ? 'justify-center px-0' : 'px-4'
        )}
        title="AfriTrust home"
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0f0d1a] shadow-lg shadow-indigo-950/50 ring-1 ring-white/10">
          <AfriTrustMark className="h-[140%] w-[140%]" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 animate-fade-in">
            <span className="block text-white font-semibold text-[15px] tracking-tight leading-none">AfriTrust</span>
            <span className="block text-[10px] text-indigo-300/80 font-medium tracking-[0.12em] uppercase mt-1">
              Identity
            </span>
          </div>
        )}
      </Link>

      <nav
        data-tour="sidebar-nav"
        className="relative z-[1] flex-1 px-2 py-4 space-y-5 overflow-y-auto overflow-x-hidden"
      >
        {showPlatformBlock && (
          <div
            data-tour="sidebar-platform"
            className={cn(
              'rounded-2xl border border-violet-500/15 bg-violet-950/[0.25] p-1.5',
              sidebarCollapsed && 'mx-0.5'
            )}
          >
            {!sidebarCollapsed && (
              <p className="px-2.5 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-violet-300/70">
                Platform
              </p>
            )}
            <div className="space-y-0.5">
              {platformItems.map(({ to, icon, label, end, tour }) => (
                <NavButton
                  key={to}
                  to={to}
                  end={end}
                  icon={icon}
                  label={label}
                  collapsed={sidebarCollapsed}
                  tour={tour}
                  activeClass="bg-violet-500/15 text-violet-50 shadow-sm ring-1 ring-violet-400/20"
                  idleClass="text-[#8b8bb0] hover:text-violet-100/90 hover:bg-violet-500/10"
                  iconActive="bg-violet-500/25 text-violet-200"
                />
              ))}
            </div>
          </div>
        )}

        {showTenantBlock && (
          <div data-tour="sidebar-workspace">
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#4a4a68]">
                {isSuperAdmin ? 'Workspace' : 'Product'}
              </p>
            )}
            <div
              className={cn(
                'rounded-2xl border border-white/[0.05] bg-white/[0.02] p-1',
                sidebarCollapsed && 'border-transparent bg-transparent p-0'
              )}
            >
              <div className="space-y-0.5">
                {tenantItems.map(({ to, icon, label, end, tour }) => (
                  <NavButton
                    key={to}
                    to={to}
                    end={end}
                    icon={icon}
                    label={label}
                    collapsed={sidebarCollapsed}
                    tour={tour}
                    activeClass="bg-indigo-500/12 text-white shadow-sm ring-1 ring-indigo-400/15"
                    idleClass="text-[#8b8ba8] hover:text-[#d4d4e8] hover:bg-white/[0.04]"
                    iconActive="bg-indigo-500/20 text-indigo-200"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin && !workspaceOrgId && !sidebarCollapsed && (
          <div className="mx-1 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2.5">
            <p className="text-[11px] leading-snug text-amber-100/90">
              <span className="font-semibold text-amber-200">Tenant required.</span> Pick a company in the header to use
              applicants, workflows, and company setup for that org.
            </p>
          </div>
        )}
      </nav>

      <button
        type="button"
        data-tour="sidebar-toggle"
        onClick={toggleSidebar}
        className="absolute z-20 -right-3 top-[5.25rem] w-7 h-7 rounded-full bg-[#14141f] border border-white/10 flex items-center justify-center text-[#8b8bb0] hover:text-white hover:border-indigo-500/30 hover:bg-[#1a1a28] transition-all shadow-md"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div
        className={cn(
          'relative z-[1] border-t border-white/[0.06] p-3 space-y-2 bg-black/20',
          sidebarCollapsed && 'flex flex-col items-center px-2'
        )}
      >
        <div
          className={cn(
            'rounded-xl border border-white/[0.06] bg-white/[0.04] p-2.5',
            sidebarCollapsed && 'p-2 border-transparent bg-transparent'
          )}
        >
          <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 ring-2 ring-black/30">
              {user?.initials ?? '—'}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 animate-fade-in">
                <p className="text-[13px] font-medium text-white leading-tight truncate">{user?.name ?? 'Guest'}</p>
                <p className="text-[11px] text-indigo-200/50 mt-0.5 truncate">
                  {user?.platformRole === 'super_admin'
                    ? 'Super admin'
                    : user?.orgRole
                      ? user.orgRole.charAt(0).toUpperCase() + user.orgRole.slice(1)
                      : 'Member'}
                </p>
              </div>
            )}
          </div>
        </div>
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[12px] font-medium text-[#9a9ab8] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}

import { Link, NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/company-onboarding', icon: Landmark, label: 'Company setup' },
  { to: '/applicants', icon: Users, label: 'Applicants' },
  { to: '/workflows', icon: GitBranch, label: 'Workflows' },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Log' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[#0d0d14] border-r border-[#1e1e2e] transition-all duration-300 shrink-0 relative',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
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

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-[#3a3a55] uppercase tracking-widest px-3 pb-2">Navigation</p>
        )}
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg transition-all duration-150 group',
                sidebarCollapsed ? 'justify-center px-0 py-2.5 mx-auto w-10' : 'px-3 py-2.5',
                isActive
                  ? 'bg-[#1e1e30] text-white'
                  : 'text-[#6060a0] hover:text-[#c0c0e0] hover:bg-[#16161f]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('shrink-0 transition-colors', sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4', isActive ? 'text-indigo-400' : 'text-current')} strokeWidth={isActive ? 2.5 : 2} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium animate-fade-in">{label}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-[#1e1e2e] border border-[#2e2e42] flex items-center justify-center text-[#6060a0] hover:text-white transition-colors z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* User Footer */}
      <div className={cn('border-t border-[#1e1e2e] p-3', sidebarCollapsed && 'flex justify-center')}>
        <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
            SO
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in min-w-0">
              <p className="text-[13px] font-medium text-white leading-none truncate">Sarah Osei</p>
              <p className="text-[11px] text-[#5a5a78] mt-0.5">Owner</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

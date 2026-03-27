import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/company-onboarding': 'Company onboarding',
  '/applicants': 'Applicants',
  '/settings': 'Settings',
  '/settings/api-keys': 'Settings',
  '/settings/webhooks': 'Settings',
  '/settings/team': 'Settings',
  '/settings/compliance-tiers': 'Settings',
};

export function TopBar() {
  const location = useLocation();

  const pathBase = '/' + location.pathname.split('/')[1];
  const isDetailPage = location.pathname.match(/^\/applicants\/APL-/);

  const title = ROUTE_TITLES[location.pathname] ?? ROUTE_TITLES[pathBase] ?? 'AfriTrust';

  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center px-6 gap-4 shrink-0 sticky top-0 z-20">
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-gray-900 leading-none">{title}</h1>
        {!isDetailPage && (
          <p className="text-[12px] text-gray-400 mt-0.5">{today}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-semibold">
            SO
          </div>
          <span className="text-[13px] font-medium text-gray-700 hidden sm:block">Sarah Osei</span>
        </div>
      </div>
    </header>
  );
}

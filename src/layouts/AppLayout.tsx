import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from '../components/shared/ToastContainer';
import { ProductTour } from '../components/onboarding/ProductTour';
import { HelpHub } from '../components/onboarding/HelpHub';
import { useSessionStore } from '../store/sessionStore';

export function AppLayout() {
  const branding = useSessionStore(s => s.user?.orgBranding);

  useEffect(() => {
    const root = document.documentElement;
    const p = branding?.primaryColor;
    const a = branding?.accentColor;
    root.style.setProperty('--brand-primary', p && p.trim() ? p : '#6366f1');
    root.style.setProperty('--brand-accent', a && a.trim() ? a : '#8b5cf6');
  }, [branding?.primaryColor, branding?.accentColor]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f8fc]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1400px] mx-auto animate-fade-in" data-tour="main-outlet">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
      <ProductTour />
      <HelpHub />
    </div>
  );
}

import { Link, Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { ToastContainer } from '../components/shared/ToastContainer';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c12] text-[#e8e8f0]">
      <header className="shrink-0 z-50 border-b border-white/[0.06] bg-[#0c0c12]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/25 group-hover:bg-indigo-500 transition-colors">
              <Shield className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-white">AfriTrust</span>
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5a5a78]">
              Identity
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#a0a0c0] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-900/40 transition-colors"
            >
              Register company
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore } from '../../store/sessionStore';
import { DEMO_EMAIL_TO_USER, DEMO_LOGIN_HINTS } from '../../mocks/workspaceUsers';
import { cn } from '../../lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useUIStore(s => s.addToast);
  const setUser = useSessionStore(s => s.setUser);
  const setImpersonatedOrgId = useSessionStore(s => s.setImpersonatedOrgId);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const existing = useSessionStore(s => s.user);
  useEffect(() => {
    if (!existing) return;
    if (existing.platformRole === 'super_admin') navigate('/platform', { replace: true });
    else navigate(from.startsWith('/login') ? '/dashboard' : from, { replace: true });
  }, [existing, from, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast('Enter email and password to continue.', 'error');
      return;
    }
    const key = email.trim().toLowerCase();
    const workspaceUser = DEMO_EMAIL_TO_USER[key];
    if (!workspaceUser) {
      addToast('Use a demo account below — any password works.', 'error');
      return;
    }
    setUser(workspaceUser);
    setImpersonatedOrgId(null);
    addToast('Signed in — welcome back.', 'success');
    if (workspaceUser.platformRole === 'super_admin') {
      navigate('/platform', { replace: true });
    } else {
      navigate(from.startsWith('/login') ? '/dashboard' : from, { replace: true });
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo');
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white tracking-tight">Log in</h1>
          <p className="mt-3 text-sm text-[#8a8aa8] leading-relaxed">
            Access your AfriTrust workspace.             New here?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Register with your company email
            </Link>
            .
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/[0.08] bg-[#14141c] p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] animate-scale-in"
        >
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b88]">Work email</span>
            <div className="mt-2 relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78]" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white placeholder:text-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                placeholder="you@company.com"
              />
            </div>
          </label>

          <label className="block mt-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b88]">Password</span>
            <div className="mt-2 relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78]" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white placeholder:text-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                placeholder="••••••••"
              />
            </div>
          </label>

          <button
            type="submit"
            className="mt-8 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
          >
            Enter workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0c0c12]/80 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/90 mb-3">Demo roles</p>
          <ul className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {DEMO_LOGIN_HINTS.map(h => (
              <li key={h.email}>
                <button
                  type="button"
                  onClick={() => fillDemo(h.email)}
                  className={cn(
                    'w-full text-left rounded-xl border border-white/[0.06] px-3 py-2.5 transition-colors',
                    'hover:border-violet-500/35 hover:bg-violet-500/5'
                  )}
                >
                  <span className="text-xs font-semibold text-white">{h.label}</span>
                  <span className="block text-[11px] text-[#6b6b88] mt-0.5">{h.desc}</span>
                  <span className="text-[10px] text-indigo-400/90 font-mono mt-1 block">{h.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a5a78]">
          <Link to="/" className="hover:text-[#8a8aa8] transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

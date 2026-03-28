import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore } from '../../store/sessionStore';
import { DEMO_EMAIL_TO_USER, DEMO_LOGIN_HINTS } from '../../mocks/workspaceUsers';
import { cn } from '../../lib/utils';
import { isLiveApi } from '../../lib/apiConfig';
import { ApiError } from '../../lib/apiClient';
import { backendFetchMe, backendLogin, profileToWorkspaceUser } from '../../services/backendAuthService';
import { scheduleProductTourIfNeeded } from '../../store/productTourStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const addToast = useUIStore(s => s.addToast);
  const setUser = useSessionStore(s => s.setUser);
  const setImpersonatedOrgId = useSessionStore(s => s.setImpersonatedOrgId);
  const setAuthTokens = useSessionStore(s => s.setAuthTokens);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => {
    const q = searchParams.get('email');
    if (q) setEmail(q);
  }, [searchParams]);

  useEffect(() => {
    const st = location.state as { inviteAccepted?: boolean } | null;
    if (st?.inviteAccepted) {
      addToast('Account activated — sign in with your email and new password.', 'success');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, addToast]);

  const existing = useSessionStore(s => s.user);
  useEffect(() => {
    if (!existing) return;
    if (existing.platformRole === 'super_admin') navigate('/platform', { replace: true });
    else navigate(from.startsWith('/login') ? '/dashboard' : from, { replace: true });
  }, [existing, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast('Enter email and password to continue.', 'error');
      return;
    }
    if (isLiveApi()) {
      try {
        const tokens = await backendLogin({ email: email.trim(), password });
        setAuthTokens(tokens.access_token, tokens.refresh_token);
        const me = await backendFetchMe();
        const wu = profileToWorkspaceUser(me);
        setUser(wu);
        scheduleProductTourIfNeeded(wu.id);
        setImpersonatedOrgId(null);
        addToast('Signed in — connected to AfriTrust API.', 'success');
        navigate(from.startsWith('/login') ? '/dashboard' : from, { replace: true });
      } catch (err) {
        if (
          err instanceof ApiError &&
          err.status === 401 &&
          err.message.toLowerCase().includes('email not verified')
        ) {
          addToast('Verify your email before signing in.', 'error');
          navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
          return;
        }
        const msg = err instanceof ApiError ? err.message : 'Login failed';
        addToast(msg, 'error');
      }
      return;
    }
    const key = email.trim().toLowerCase();
    const workspaceUser = DEMO_EMAIL_TO_USER[key];
    if (!workspaceUser) {
      addToast('Use a demo account below — any password works.', 'error');
      return;
    }
    setUser(workspaceUser);
    scheduleProductTourIfNeeded(workspaceUser.id);
    setImpersonatedOrgId(null);
    setAuthTokens(null, null);
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
            {isLiveApi()
              ? 'Sign in with the email and password from your AfriTrust account.'
              : 'Access your AfriTrust workspace.'}{' '}
            New here?{' '}
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
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white placeholder:text-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b88] hover:text-[#a8a8c0] p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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

        {!isLiveApi() && (
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
        )}

        <p className="mt-8 text-center text-xs text-[#5a5a78] space-x-3">
          {isLiveApi() && (
            <Link to="/verify-email" className="hover:text-[#8a8aa8] transition-colors">
              Verify email / resend
            </Link>
          )}
          <Link to="/" className="hover:text-[#8a8aa8] transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

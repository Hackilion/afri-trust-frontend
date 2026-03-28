import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react';
import { ApiError } from '../../lib/apiClient';
import { isLiveApi } from '../../lib/apiConfig';
import { backendAcceptInvite, validateBackendRegisterPassword } from '../../services/backendAuthService';
import { cn } from '../../lib/utils';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() ?? '';

  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLiveApi()) {
      setError('Accept invite is only available when the app is pointed at the live AfriTrust API.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isLiveApi()) return;
    if (!token) {
      setError('Missing invite token. Open the full link your admin shared.');
      return;
    }
    const pwErr = validateBackendRegisterPassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    setBusy(true);
    try {
      await backendAcceptInvite({
        token,
        password,
        display_name: displayName.trim() || undefined,
      });
      navigate('/login', { replace: true, state: { inviteAccepted: true } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not complete invite');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white tracking-tight">Join workspace</h1>
          <p className="mt-3 text-sm text-[#8a8aa8] leading-relaxed">
            Set a password to activate your account. You will sign in with your email and this password.
          </p>
        </div>

        {!token && isLiveApi() ? (
          <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            Add <code className="text-amber-100">?token=…</code> from your invitation link.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#14141f] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
          {error ? (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          ) : null}

          <div>
            <label className="text-[12px] font-medium text-[#9a9ab8] block mb-1.5">Display name (optional)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78]" />
              <input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                disabled={!isLiveApi() || busy}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white placeholder:text-[#5a5a78] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="How you appear to teammates"
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#9a9ab8] block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78]" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={!isLiveApi() || busy}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white placeholder:text-[#5a5a78] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="At least 8 characters, upper, lower, digit"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#6a6a88] hover:text-white rounded-lg"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isLiveApi() || busy || !token}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors',
              'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none'
            )}
          >
            {busy ? 'Activating…' : 'Activate account'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-[12px] text-[#6a6a88]">
            Already set up?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

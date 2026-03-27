import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useCompanyOnboardingStore } from '../../store/companyOnboardingStore';
import { DEMO_EMAIL_VERIFICATION_CODE, useRegistrationSessionStore } from '../../store/registrationSessionStore';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore } from '../../store/sessionStore';
import { scheduleProductTourIfNeeded } from '../../store/productTourStore';
import { resolveWorkspaceUserFromEmail } from '../../mocks/workspaceUsers';
import { cn } from '../../lib/utils';
import { isLiveApi } from '../../lib/apiConfig';
import { ApiError } from '../../lib/apiClient';
import {
  backendFetchMe,
  backendLogin,
  backendRegister,
  backendVerifyEmail,
  companyDraftToRegisterBody,
  profileToWorkspaceUser,
  validateBackendRegisterPassword,
} from '../../services/backendAuthService';

const inputClass =
  'w-full rounded-xl border border-white/[0.1] bg-[#0e0e14] px-4 py-3 text-[15px] text-[#f4f4f8] placeholder:text-[#5c5c70] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none focus:ring-2 focus:ring-violet-500/45 focus:border-violet-500/50 transition-shadow';

const labelClass = 'block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b8ba8]';

const primaryCtaClass =
  'w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/50 transition-all hover:from-violet-500 hover:to-indigo-500 hover:brightness-[1.05] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12121a] disabled:cursor-not-allowed disabled:opacity-50';

function RegisterSignupStep({ onContinue }: { onContinue: () => void }) {
  const addToast = useUIStore(s => s.addToast);
  const setDraft = useCompanyOnboardingStore(s => s.setDraft);
  const setStepIndex = useCompanyOnboardingStore(s => s.setStepIndex);

  const [email, setEmail] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      addToast('Enter a valid work email.', 'error');
      return;
    }
    if (isLiveApi()) {
      const pwErr = validateBackendRegisterPassword(password);
      if (pwErr) {
        addToast(pwErr, 'error');
        return;
      }
    } else if (password.length < 8) {
      addToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }
    const orgLabel = tradingName.trim();
    if (isLiveApi() && orgLabel.length < 2) {
      addToast('Enter your organisation or trading name (at least 2 characters).', 'error');
      return;
    }

    if (isLiveApi()) {
      useRegistrationSessionStore.getState().setPendingRegistrationEmail(email.trim());
      useRegistrationSessionStore.getState().setPendingRegistrationPassword(password);
      useRegistrationSessionStore.getState().setEmailVerifyToken(null);
      useRegistrationSessionStore.getState().setEmailVerified(false);
      setDraft({
        leadEmail: email.trim(),
        tradingName: orgLabel,
        legalName: '',
        registrationNumber: '',
        primaryCountryCode: '',
        archetypeId: '',
      });
      setStepIndex(0);
      addToast('Next: create your AfriTrust account.', 'success');
      onContinue();
      return;
    }

    setDraft({
      leadEmail: email.trim(),
      tradingName: orgLabel,
      legalName: '',
      registrationNumber: '',
      primaryCountryCode: '',
      archetypeId: '',
    });
    setStepIndex(0);
    useRegistrationSessionStore.getState().setEmailVerifyToken(null);
    useRegistrationSessionStore.getState().setPendingRegistrationEmail(null);
    useRegistrationSessionStore.getState().setPendingRegistrationPassword(null);
    useRegistrationSessionStore.getState().setEmailVerified(false);
    addToast('We sent a verification code to your email.', 'success');
    onContinue();
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <div className="relative rounded-[1.35rem] overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#16161f] to-[#0c0c12] shadow-[0_32px_100px_-40px_rgba(99,102,241,0.45)]">
        <div
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 0% 0%, rgba(139,92,246,0.2), transparent), radial-gradient(ellipse 50% 40% at 100% 20%, rgba(34,211,238,0.12), transparent)',
          }}
        />
        <div className="relative p-6 sm:p-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/90 mb-4">
              <Sparkles className="w-3 h-3" />
              Sign up
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Create your workspace
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-5">
              <div className="flex items-center gap-2 text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                  <Mail className="w-4 h-4" strokeWidth={2} />
                </span>
                <h2 className="text-sm font-semibold tracking-tight">Account</h2>
              </div>
              <label className="block">
                <span className={labelClass}>Email</span>
                <div className="mt-2 relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78]" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={cn(inputClass, 'pl-11')}
                    placeholder="you@company.com"
                  />
                </div>
              </label>
              <div className="flex items-center gap-2 text-white pt-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                  <Building2 className="w-4 h-4" strokeWidth={2} />
                </span>
                <h2 className="text-sm font-semibold tracking-tight">Organisation</h2>
              </div>
              <label className="block">
                <span className={labelClass}>
                  {isLiveApi() ? 'Trading / company name' : 'Trading or company name'}
                  {isLiveApi() ? ' *' : ''}
                </span>
                <input
                  type="text"
                  autoComplete="organization"
                  value={tradingName}
                  onChange={e => setTradingName(e.target.value)}
                  className={cn(inputClass, 'mt-2')}
                  placeholder="e.g. Acme Payments"
                />
              </label>
              <div className="flex items-center gap-2 text-white pt-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                  <Lock className="w-4 h-4" strokeWidth={2} />
                </span>
                <h2 className="text-sm font-semibold tracking-tight">Password</h2>
              </div>
              <label className="block">
                <span className={labelClass}>Password</span>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={cn(inputClass, 'pl-11 pr-12')}
                    placeholder="SecurePass123!"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b88] hover:text-[#a8a8c0] p-1"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className={labelClass}>Confirm password</span>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a78]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={cn(inputClass, 'pl-11 pr-12')}
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b88] hover:text-[#a8a8c0] p-1"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
            </section>

            <div className="flex flex-col gap-4 border-t border-white/[0.06] pt-6">
              <button type="submit" className={primaryCtaClass}>
                {isLiveApi() ? 'Continue' : 'Create account'}
                <ArrowRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Demo-only: live API uses company onboarding + activate step instead. */
function RegisterVerifyEmailStep({ onVerified }: { onVerified: () => void }) {
  const addToast = useUIStore(s => s.addToast);
  const email = useCompanyOnboardingStore(s => s.draft.leadEmail);
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = code.replace(/\s/g, '');
    if (normalized.length !== 6 || !/^\d+$/.test(normalized)) {
      addToast('Enter the 6-digit code from your email.', 'error');
      return;
    }
    if (normalized !== DEMO_EMAIL_VERIFICATION_CODE) {
      addToast('Invalid code. For this demo use ' + DEMO_EMAIL_VERIFICATION_CODE + '.', 'error');
      return;
    }
    useRegistrationSessionStore.getState().setEmailVerified(true);
    addToast('Email verified — you are signed in.', 'success');
    onVerified();
  };

  const handleResend = () => {
    addToast('Verification email sent again (demo).', 'success');
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <div className="relative rounded-[1.35rem] overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#16161f] to-[#0c0c12] shadow-[0_32px_100px_-40px_rgba(99,102,241,0.45)] p-8 sm:p-10">
        <div
          className="absolute inset-0 opacity-[0.45] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(139,92,246,0.18), transparent), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(34,211,238,0.1), transparent)',
          }}
        />
        <div className="relative">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 mb-6">
            <ShieldCheck className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/90 mb-4">
            Verify email
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">Check your inbox</h1>
          <p className="mt-3 text-sm text-[#9a9ab8] leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="text-violet-300 font-medium break-all">{email || 'your email'}</span>. Enter it below to
            complete sign-up.
          </p>
          <p className="mt-4 text-xs text-[#6b6b88] rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2">
            <strong className="text-[#a8a8c0]">Demo:</strong> use code{' '}
            <code className="text-cyan-400 font-mono">{DEMO_EMAIL_VERIFICATION_CODE}</code>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <label className="block">
              <span className={labelClass}>Verification code</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn(
                  inputClass,
                  'mt-2 text-center text-2xl tracking-[0.4em] font-mono font-semibold tabular-nums sm:text-3xl sm:tracking-[0.45em]'
                )}
                placeholder="••••••"
              />
            </label>
            <div className="flex flex-col gap-3">
              <button type="submit" className={primaryCtaClass}>
                Continue
                <ArrowRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} />
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="w-full rounded-xl border border-white/[0.08] bg-transparent py-3 text-sm font-medium text-[#a8a8c0] transition-colors hover:border-white/[0.14] hover:bg-white/[0.04] hover:text-white"
              >
                Resend code
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function RegisterActivateStep({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const addToast = useUIStore(s => s.addToast);
  const draft = useCompanyOnboardingStore(s => s.draft);
  const [busy, setBusy] = useState(false);
  const [devVerify, setDevVerify] = useState<{
    token: string;
    otp: string | null;
    link: string | null;
  } | null>(null);
  const [otpInput, setOtpInput] = useState('');

  const accountEmail = useRegistrationSessionStore(s => s.pendingRegistrationEmail);
  const orgDisplay = draft.tradingName.trim() || '—';

  const signInAfterVerify = async (email: string, password: string) => {
    const tokens = await backendLogin({ email: email.trim(), password });
    useSessionStore.getState().setAuthTokens(tokens.access_token, tokens.refresh_token);
    const me = await backendFetchMe();
    const wu = profileToWorkspaceUser(me);
    useSessionStore.getState().setUser(wu);
    scheduleProductTourIfNeeded(wu.id);
    useSessionStore.getState().setImpersonatedOrgId(null);
    useRegistrationSessionStore.getState().reset();
    addToast('Welcome — your workspace is ready.', 'success');
    onDone();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = useRegistrationSessionStore.getState().pendingRegistrationPassword;
    const email = useRegistrationSessionStore.getState().pendingRegistrationEmail;
    if (!email?.trim() || !password) {
      addToast('Session expired. Start again from step 1.', 'error');
      navigate('/register', { replace: true });
      return;
    }
    let body;
    try {
      body = companyDraftToRegisterBody(email, password, draft);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Invalid organisation name', 'error');
      return;
    }
    setBusy(true);
    try {
      const reg = await backendRegister(body);
      const verifyToken = reg.email_verify_token?.trim();
      const verifyOtp = reg.email_verify_otp?.trim() ?? '';

      if (!verifyToken) {
        addToast(reg.message || 'Registration response missing verification data.', 'error');
        return;
      }

      setDevVerify({ token: verifyToken, otp: verifyOtp || null, link: reg.email_verify_link?.trim() || null });
      setOtpInput('');
      addToast('Use the verification link or enter the code below, then sign in.', 'info');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not complete registration';
      addToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyWithToken = async () => {
    if (!devVerify) return;
    const password = useRegistrationSessionStore.getState().pendingRegistrationPassword;
    const email = useRegistrationSessionStore.getState().pendingRegistrationEmail;
    if (!email?.trim() || !password) {
      addToast('Session expired. Start again from step 1.', 'error');
      navigate('/register', { replace: true });
      return;
    }
    setBusy(true);
    try {
      await backendVerifyEmail({ token: devVerify.token });
      await signInAfterVerify(email, password);
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Verification failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devVerify) return;
    const digits = otpInput.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) {
      addToast('Enter the 6-digit code.', 'error');
      return;
    }
    const password = useRegistrationSessionStore.getState().pendingRegistrationPassword;
    const email = useRegistrationSessionStore.getState().pendingRegistrationEmail;
    if (!email?.trim() || !password) {
      addToast('Session expired. Start again from step 1.', 'error');
      navigate('/register', { replace: true });
      return;
    }
    setBusy(true);
    try {
      await backendVerifyEmail({ email: email.trim(), otp: digits });
      await signInAfterVerify(email, password);
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Verification failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyOtp = async () => {
    if (!devVerify?.otp) return;
    try {
      await navigator.clipboard.writeText(devVerify.otp);
      addToast('Code copied.', 'success');
    } catch {
      addToast('Could not copy.', 'error');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <div className="relative rounded-[1.35rem] overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#16161f] to-[#0c0c12] shadow-[0_32px_100px_-40px_rgba(99,102,241,0.45)] p-8 sm:p-10">
        <div
          className="absolute inset-0 opacity-[0.45] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 80% 0%, rgba(34,211,238,0.14), transparent), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(139,92,246,0.15), transparent)',
          }}
        />
        <div className="relative">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 mb-6">
            <Rocket className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/90 mb-4">
            Activate
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">Create your API account</h1>
          <p className="mt-3 text-sm text-[#9a9ab8] leading-relaxed">
            We create your organisation on AfriTrust. After you register, use the verification link or 6-digit code from
            the response to confirm your email, then you will be signed in.
          </p>

          <dl className="mt-6 space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0e14] px-4 py-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b6b88] shrink-0">Account email</dt>
              <dd className="text-right font-medium text-white break-all">{accountEmail || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b6b88] shrink-0">Organisation</dt>
              <dd className="text-right font-medium text-white">{orgDisplay}</dd>
            </div>
          </dl>

          {devVerify ? (
            <div className="mt-8 space-y-6 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-300/90 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Verify your email</p>
                  <p className="mt-1 text-xs text-[#9a9ab8] leading-relaxed">
                    Verification is token-based (no email is sent). Use the link, paste the token on the verify page, or
                    enter the code below. Treat these like passwords.
                  </p>
                </div>
              </div>
              {devVerify.otp ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b8ba8]">6-digit code</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 rounded-xl bg-[#0e0e14] border border-white/[0.1] px-4 py-3 text-center text-xl font-mono tracking-[0.35em] text-white">
                      {devVerify.otp}
                    </code>
                    <button
                      type="button"
                      onClick={copyOtp}
                      className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.12] text-[#c8c8e0] hover:bg-white/[0.06]"
                      aria-label="Copy code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null}
              {devVerify.link ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b8ba8]">Verification link</p>
                  <a
                    href={devVerify.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all rounded-xl bg-[#0e0e14] border border-white/[0.1] px-4 py-3 text-xs text-violet-300 hover:text-violet-200"
                  >
                    Open verify page in new tab
                  </a>
                </div>
              ) : null}
              <form onSubmit={handleVerifyWithOtp} className="space-y-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b8ba8]">
                    Or type the code
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpInput}
                    onChange={ev => setOtpInput(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={cn(inputClass, 'mt-2 text-center font-mono tracking-[0.4em]')}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy || otpInput.replace(/\D/g, '').length !== 6}
                  className={primaryCtaClass}
                >
                  {busy ? 'Verifying…' : 'Verify with code and continue'}
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} />
                </button>
              </form>
              <button
                type="button"
                disabled={busy}
                onClick={handleVerifyWithToken}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-6 py-3.5 text-sm font-medium text-[#c8c8e0] hover:bg-white/[0.05] disabled:opacity-50"
              >
                Verify with token (same session)
              </button>
              <p className="text-center text-xs text-[#6b6b88]">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(accountEmail?.trim() ?? '')}&token=${encodeURIComponent(devVerify.token)}`}
                  className="text-violet-400 hover:text-violet-300"
                >
                  Open verify page in app
                </Link>
              </p>
            </div>
          ) : null}

          {!devVerify ? (
            <form onSubmit={handleSubmit} className="mt-8">
              <button type="submit" disabled={busy} className={primaryCtaClass}>
                {busy ? 'Provisioning…' : 'Create AfriTrust account'}
                <ArrowRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} />
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RegistrationStepper({ phase, variant }: { phase: 1 | 2; variant: 'live' | 'demo' }) {
  const steps =
    variant === 'live'
      ? [
          { n: 1 as const, label: 'Account' },
          { n: 2 as const, label: 'Activate' },
        ]
      : [
          { n: 1 as const, label: 'Sign up' },
          { n: 2 as const, label: 'Verify' },
        ];
  return (
    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 rounded-xl border border-white/[0.08] bg-[#14141c] p-1.5 max-w-xl">
      {steps.map(s => {
        const active = phase === s.n;
        const done = phase > s.n;
        return (
          <div
            key={s.n}
            className={cn(
              'flex-1 min-w-[5.5rem] flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors',
              active ? 'bg-violet-600 text-white' : done ? 'text-emerald-400/90' : 'text-[#6b6b88]'
            )}
          >
            {done ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-4 h-4 rounded-full border border-current text-[9px] flex items-center justify-center shrink-0">{s.n}</span>}
            <span className="truncate">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<1 | 2>(1);

  const finishRegistration = () => {
    const emailKey = useCompanyOnboardingStore.getState().draft.leadEmail.trim().toLowerCase();
    const resolved = resolveWorkspaceUserFromEmail(emailKey);
    if (resolved) {
      useSessionStore.getState().setUser(resolved);
      scheduleProductTourIfNeeded(resolved.id);
      useSessionStore.getState().setImpersonatedOrgId(null);
    } else {
      const local = useCompanyOnboardingStore.getState().draft.leadEmail.trim().split('@')[0] || 'User';
      const newUser = {
        id: `u-reg-${Date.now()}`,
        email: useCompanyOnboardingStore.getState().draft.leadEmail.trim(),
        name: local.charAt(0).toUpperCase() + local.slice(1),
        initials: local.slice(0, 2).toUpperCase(),
        orgId: 'org-gh-bank',
        orgRole: 'owner' as const,
      };
      useSessionStore.getState().setUser(newUser);
      scheduleProductTourIfNeeded(newUser.id);
      useSessionStore.getState().setImpersonatedOrgId(null);
    }
    useSessionStore.getState().setAuthTokens(null, null);
    useRegistrationSessionStore.getState().reset();
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-10 text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">Register</h1>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:gap-6">
            <RegistrationStepper phase={phase} variant={isLiveApi() ? 'live' : 'demo'} />
            <Link to="/login" className="text-sm text-violet-400 hover:text-violet-300 text-center sm:text-left shrink-0">
              Already registered? Log in
            </Link>
          </div>
        </div>

        {phase === 1 && <RegisterSignupStep onContinue={() => setPhase(2)} />}
        {phase === 2 && !isLiveApi() && <RegisterVerifyEmailStep onVerified={finishRegistration} />}
        {phase === 2 && isLiveApi() && <RegisterActivateStep onDone={() => navigate('/dashboard')} />}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import CompanyOnboarding from '../CompanyOnboarding';
import { useCompanyOnboardingStore } from '../../store/companyOnboardingStore';
import { DEMO_EMAIL_VERIFICATION_CODE, useRegistrationSessionStore } from '../../store/registrationSessionStore';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const fillDemo = () => {
    setEmail('admin@afritrust-demo.com');
    setPassword('SecurePass123!');
    setConfirmPassword('SecurePass123!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      addToast('Enter a valid work email.', 'error');
      return;
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }

    setDraft({
      leadEmail: email.trim(),
      tradingName: '',
      legalName: '',
      primaryCountryCode: '',
      archetypeId: '',
    });
    setStepIndex(0);
    useRegistrationSessionStore.getState().setEmailVerified(false);
    addToast('We sent a verification code to your email (demo: check the hint below).', 'success');
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/90 mb-4">
                <Sparkles className="w-3 h-3" />
                Sign up
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Create your workspace
              </h1>
              <p className="mt-2 text-sm text-[#9a9ab8] max-w-md leading-relaxed">
                Create your credentials here — organisation, markets, and KYB are collected in the onboarding steps
                that follow email verification.
              </p>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="shrink-0 text-xs font-medium text-cyan-400/90 hover:text-cyan-300 underline-offset-4 hover:underline sm:mt-10"
            >
              Fill demo values
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-5">
              <div className="flex items-center gap-2 text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                  <Lock className="w-4 h-4" strokeWidth={2} />
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
                    placeholder="admin@afritrust-demo.com"
                  />
                </div>
              </label>
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
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={cn(inputClass, 'mt-2')}
                  placeholder="Repeat password"
                />
              </label>
            </section>

            <div className="flex flex-col gap-4 border-t border-white/[0.06] pt-6">
              <p className="text-center text-xs text-[#6b6b88] sm:text-left">
                Next you&apos;ll verify your email, then complete organisation details in onboarding.
              </p>
              <button type="submit" className={primaryCtaClass}>
                Create account
                <ArrowRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

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
    addToast('Email verified — continue to company onboarding.', 'success');
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
            unlock company onboarding.
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
                Create account
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

function RegistrationStepper({ phase }: { phase: 1 | 2 | 3 }) {
  const steps = [
    { n: 1 as const, label: 'Sign up' },
    { n: 2 as const, label: 'Verify' },
    { n: 3 as const, label: 'Onboarding' },
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
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  const finishRegistration = () => {
    useRegistrationSessionStore.getState().reset();
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-10 text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">Register</h1>
          <p className="mt-2 text-sm text-[#9a9ab8]">
            Sign up with email and password, verify your email, then complete organisation onboarding — same look end to end.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:gap-6">
            <RegistrationStepper phase={phase} />
            <Link to="/login" className="text-sm text-violet-400 hover:text-violet-300 text-center sm:text-left shrink-0">
              Already registered? Log in
            </Link>
          </div>
        </div>

        {phase === 1 && <RegisterSignupStep onContinue={() => setPhase(2)} />}
        {phase === 2 && <RegisterVerifyEmailStep onVerified={() => setPhase(3)} />}
        {phase === 3 && (
          <CompanyOnboarding registrationFlow onRegistrationProfileComplete={finishRegistration} />
        )}
      </div>
    </div>
  );
}

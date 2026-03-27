import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Mail } from 'lucide-react';
import CompanyOnboarding from '../CompanyOnboarding';
import { useCompanyOnboardingStore } from '../../store/companyOnboardingStore';
import { useUIStore } from '../../store/uiStore';

function RegisterEmailStep({ onContinue }: { onContinue: () => void }) {
  const addToast = useUIStore(s => s.addToast);
  const setDraft = useCompanyOnboardingStore(s => s.setDraft);
  const setStepIndex = useCompanyOnboardingStore(s => s.setStepIndex);
  const existing = useCompanyOnboardingStore(s => s.draft.leadEmail);
  const [email, setEmail] = useState(existing || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      addToast('Enter a valid company email address.', 'error');
      return;
    }
    setDraft({ leadEmail: trimmed });
    setStepIndex(0);
    addToast('Account linked to this email — continue with company onboarding.', 'success');
    onContinue();
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="rounded-2xl border border-white/[0.08] bg-[#14141c] p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 mb-6">
          <Mail className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-[#a8a8c0] leading-relaxed">
          Start with your <strong className="text-[#d0d0e8]">company work email</strong>. We&apos;ll use it for your
          workspace and pre-fill contact details in the next step.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b8ba8]">Company email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-2 w-full px-4 py-3.5 rounded-xl bg-[#fafafa] border-2 border-[#3a3a50] text-[15px] text-[#0c0c12] placeholder:text-[#5c5c70] focus:outline-none focus:ring-[3px] focus:ring-indigo-500/35 focus:border-indigo-500/80"
              placeholder="you@yourcompany.com"
            />
          </label>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950/40"
          >
            Continue to company onboarding
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<1 | 2>(1);

  return (
    <div className="flex-1 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-10 text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">Register</h1>
          <p className="mt-2 text-sm text-[#a8a8c0]">
            Create an account with your company email, then complete organisation onboarding.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:gap-6">
            <div className="flex rounded-xl border border-white/[0.08] bg-[#14141c] p-1 max-w-md mx-auto sm:mx-0">
              <div
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  phase === 1 ? 'bg-indigo-600 text-white' : 'text-[#6b6b88]'
                }`}
              >
                {phase > 1 ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-white/30 text-[10px] flex items-center justify-center">
                    1
                  </span>
                )}
                Account
              </div>
              <div
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  phase === 2 ? 'bg-indigo-600 text-white' : 'text-[#6b6b88]'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current text-[10px] flex items-center justify-center">
                  2
                </span>
                Company
              </div>
            </div>
            <Link to="/login" className="text-sm text-indigo-400 hover:text-indigo-300 text-center sm:text-left">
              Already registered? Log in
            </Link>
          </div>
        </div>

        {phase === 1 ? (
          <RegisterEmailStep onContinue={() => setPhase(2)} />
        ) : (
          <CompanyOnboarding
            registrationFlow
            onRegistrationProfileComplete={() => navigate('/dashboard')}
          />
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import CompanyOnboarding from '../CompanyOnboarding';
import { useCompanyOnboardingStore } from '../../store/companyOnboardingStore';
import { useUIStore } from '../../store/uiStore';

function RegisterAccountStep() {
  const navigate = useNavigate();
  const addToast = useUIStore(s => s.addToast);
  const leadEmail = useCompanyOnboardingStore(s => s.draft.leadEmail);
  const legalName = useCompanyOnboardingStore(s => s.draft.legalName);
  const [email, setEmail] = useState(leadEmail || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      addToast('Use at least 8 characters for your password.', 'error');
      return;
    }
    if (password !== confirm) {
      addToast('Passwords do not match.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      addToast('Enter a valid email.', 'error');
      return;
    }
    addToast(`Workspace ready for ${legalName || 'your company'}.`, 'success');
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="rounded-2xl border border-white/[0.08] bg-[#14141c] p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]">
        <h1 className="font-display text-2xl font-semibold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-[#8a8aa8] leading-relaxed">
          Company profile is saved. Set the credentials you&apos;ll use to log in to this instance.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b88]">Work email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b88]">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b88]">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0c0c12] border border-white/[0.08] text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Finish & open workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [phase, setPhase] = useState<1 | 2>(1);

  return (
    <div className="flex-1 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-10 text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">Register</h1>
          <p className="mt-2 text-sm text-[#8a8aa8]">
            Company onboarding comes first — then we create your sign-in for this instance.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:gap-6">
            <div className="flex rounded-xl border border-white/[0.08] bg-[#14141c] p-1 max-w-md mx-auto sm:mx-0">
              <div
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  phase === 1 ? 'bg-indigo-600 text-white' : 'text-[#6b6b88]'
                }`}
              >
                {phase > 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-5 h-5 rounded-full border border-white/30 text-[10px] flex items-center justify-center">1</span>}
                Company
              </div>
              <div
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  phase === 2 ? 'bg-indigo-600 text-white' : 'text-[#6b6b88]'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current text-[10px] flex items-center justify-center">2</span>
                Account
              </div>
            </div>
            <Link to="/login" className="text-sm text-indigo-400 hover:text-indigo-300 text-center sm:text-left">
              Already registered? Log in
            </Link>
          </div>
        </div>

        {phase === 1 ? (
          <CompanyOnboarding
            registrationFlow
            onRegistrationProfileComplete={() => setPhase(2)}
          />
        ) : (
          <RegisterAccountStep />
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const addToast = useUIStore(s => s.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast('Enter email and password to continue.', 'error');
      return;
    }
    addToast('Signed in — welcome back.', 'success');
    navigate('/dashboard');
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

        <p className="mt-8 text-center text-xs text-[#5a5a78]">
          <Link to="/" className="hover:text-[#8a8aa8] transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

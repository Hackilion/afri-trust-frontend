import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ProcessDiagram } from './ProcessDiagram';

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(52, 211, 153, 0.12), transparent), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(167, 139, 250, 0.15), transparent)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#0c0c12_100%)] h-32 bottom-0 top-auto pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-200/90 mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Identity for African-scale operations
          </div>

          <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold text-white leading-[1.08] tracking-tight max-w-3xl animate-fade-in">
            One instance.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-violet-200 to-emerald-200/90">
              Company-first onboarding
            </span>
            , then full trust infrastructure.
          </h1>

          <p className="mt-6 text-lg text-[#9a9ab8] max-w-2xl leading-relaxed animate-fade-in">
            Register starts with your organisation profile — markets, KYB, and how you operate — so every later step is
            already in context. Log in anytime to the same workspace.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3 animate-fade-in">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shadow-xl shadow-indigo-950/50 transition-transform hover:translate-y-[-1px]"
            >
              Start with company setup
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3.5 rounded-xl border border-white/[0.12] text-sm font-medium text-[#c8c8e0] hover:bg-white/[0.05] transition-colors"
            >
              Log in to your instance
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative py-20 sm:py-28 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-14 sm:mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-400/90">How it flows</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              From register to live verifications
            </h2>
            <p className="mt-4 text-[#8a8aa8] text-sm sm:text-base leading-relaxed">
              The path is intentional: we capture company reality before accounts and integrations, so compliance and
              product defaults match how you actually work.
            </p>
          </div>
          <ProcessDiagram />
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-white/[0.06] bg-[#08080e]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Ready when your team is</h2>
            <p className="mt-2 text-sm text-[#6b6b88] max-w-md">
              Use the same URL for marketing and operations — landing, login, and the dashboard share one product
              story.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0c0c12] text-sm font-semibold hover:bg-[#e8e8f0] transition-colors"
            >
              Register
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-5 py-3 rounded-xl border border-white/20 text-sm font-medium text-white hover:bg-white/5"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

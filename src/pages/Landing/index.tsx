import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { IlluminatedHero } from '@/components/ui/illuminated-hero';
import { ProcessDiagram } from './ProcessDiagram';

export default function LandingPage() {
  return (
    <>
      <IlluminatedHero
        badge={
          <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-200/90">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            Unified identity for Africa&apos;s digital economy
          </div>
        }
        headlinePrefix="Verify Once. Belong Everywhere."
        highlightText="One Identity."
        headlineSuffix="Trusted Across Africa."
        description={
          <>
            AfriTrust is the unified identity layer for Africa&apos;s digital economy. Help your users skip the paperwork,
            stay compliant with local and international regulations, and onboard in seconds — not days.
          </>
        }
      >
        <Link
          to="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-950/50 transition-transform hover:translate-y-[-1px] hover:bg-indigo-500"
        >
          Create account
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center rounded-xl border border-white/[0.12] px-6 py-3.5 text-sm font-medium text-[#c8c8e0] transition-colors hover:bg-white/[0.05]"
        >
          Log in to your instance
        </Link>
      </IlluminatedHero>

      <section id="how-it-works" className="relative border-t border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 max-w-xl sm:mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-400/90">How it flows</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              From register to live verifications
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#8a8aa8] sm:text-base">
              The path is intentional: a single company email anchors your tenant, then we capture how you operate before
              you wire integrations — so defaults match your markets.
            </p>
          </div>
          <ProcessDiagram />
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-[#08080e]/80 py-16 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Ready when your team is</h2>
            <p className="mt-2 max-w-md text-sm text-[#6b6b88]">
              Use the same URL for marketing and operations — landing, login, and the dashboard share one product story.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0c0c12] transition-colors hover:bg-[#e8e8f0]"
            >
              Register
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

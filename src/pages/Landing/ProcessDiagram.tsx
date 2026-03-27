import { Building2, Plug, Rocket, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    icon: Building2,
    title: 'Company profile',
    blurb: 'Markets, KYB, and operations — tailored to Africa first.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust layer',
    blurb: 'Verification workflows, tiers, and audit-ready logs.',
  },
  {
    icon: Plug,
    title: 'Connect',
    blurb: 'API keys, webhooks, and your existing stack.',
  },
  {
    icon: Rocket,
    title: 'Go live',
    blurb: 'Applicants flow in with compliance you can defend.',
  },
] as const;

export function ProcessDiagram() {
  return (
    <div className="relative w-full max-w-5xl mx-auto px-2">
      {/* Desktop: horizontal pipeline */}
      <div className="hidden lg:block relative py-6">
        <svg
          className="absolute left-[8%] right-[8%] top-[52px] h-12 overflow-visible pointer-events-none"
          aria-hidden
        >
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path
            d="M 0 24 Q 120 8 240 24 T 480 24 T 720 24 T 960 24"
            fill="none"
            stroke="url(#flowGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            className="landing-flow-path"
          />
        </svg>
        <ul className="relative grid grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="flex flex-col items-center text-center"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div
                className={`landing-flow-node relative z-[1] flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.09] to-white/[0.02] shadow-[0_20px_50px_-20px_rgba(99,102,241,0.45)] ${i === 0 ? 'ring-2 ring-indigo-400/40 ring-offset-2 ring-offset-[#0c0c12]' : ''}`}
              >
                <s.icon className="w-9 h-9 text-indigo-300" strokeWidth={1.5} />
                {i === 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-md bg-emerald-500/90 text-[9px] font-bold uppercase tracking-wide text-white">
                    Start
                  </span>
                )}
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-xs text-[#8a8aa8] leading-relaxed max-w-[200px]">{s.blurb}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile / tablet: vertical stack */}
      <ol className="lg:hidden space-y-0 max-w-md mx-auto">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex gap-4">
            {i < STEPS.length - 1 && (
              <span
                className="absolute left-[27px] top-[72px] bottom-[-8px] w-0.5 landing-flow-vline"
                aria-hidden
              />
            )}
            <div
              className={`landing-flow-node shrink-0 flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.05] ${i === 0 ? 'ring-2 ring-indigo-400/35' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <s.icon className="w-6 h-6 text-indigo-300" strokeWidth={1.5} />
            </div>
            <div className="pb-10 pt-1">
              <h3 className="font-display text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-[#8a8aa8] leading-relaxed">{s.blurb}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

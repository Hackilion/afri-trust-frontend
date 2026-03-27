import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Building2,
  ChevronRight,
  Globe2,
  KeyRound,
  Layers,
  Mail,
  Shield,
  Users,
  Webhook,
} from 'lucide-react';
import {
  CHANNELS,
  COMPANY_ARCHETYPES,
  EMPLOYEE_BANDS,
  getCountryByCode,
  VOLUME_BANDS,
} from '../../lib/africanMarkets';
import { onboardingCompletionPercent, isOnboardingStepValid } from '../../lib/companyOnboardingValidation';
import type { CompanyOnboardingDraft } from '../../types/companyOnboarding';
import { cn } from '../../lib/utils';

type Props = {
  draft: CompanyOnboardingDraft;
  currentStep: number;
  onGoToStep: (index: number) => void;
};

function MiniCard({
  icon: Icon,
  title,
  value,
  sub,
  stepIndex,
  onGoToStep,
  done,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  sub?: string;
  stepIndex: number;
  onGoToStep: (i: number) => void;
  done: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onGoToStep(stepIndex)}
      className={cn(
        'group relative flex w-full flex-col rounded-2xl border p-4 text-left transition-all',
        'border-slate-200/90 bg-white shadow-sm hover:border-indigo-300/80 hover:shadow-md hover:shadow-indigo-500/5',
        done && 'ring-1 ring-emerald-500/15 bg-gradient-to-br from-white to-emerald-50/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800'
          )}
        >
          {done ? 'Done' : 'Action'}
        </span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{sub}</p> : null}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:gap-1.5 transition-all">
        Manage
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

export function CompanyManagementPanel({ draft, currentStep, onGoToStep }: Props) {
  const pct = onboardingCompletionPercent(draft);
  const displayName =
    draft.tradingName.trim() || draft.legalName.trim() || draft.leadEmail.split('@')[0] || 'Your workspace';
  const legalDisplay = draft.legalName.trim() || 'Not set';
  const tradingDisplay = draft.tradingName.trim() || '—';
  const primary = getCountryByCode(draft.primaryCountryCode);
  const marketsCount = (draft.primaryCountryCode ? 1 : 0) + draft.additionalCountryCodes.length;
  const archetype = COMPANY_ARCHETYPES.find(a => a.id === draft.archetypeId)?.label ?? 'Not set';
  const employees = EMPLOYEE_BANDS.find(b => b.id === draft.employeeBandId)?.label ?? '—';
  const volume = VOLUME_BANDS.find(v => v.id === draft.volumeBandId)?.label ?? '—';
  const channelLabels = draft.channelIds
    .map(id => CHANNELS.find(c => c.id === id)?.label)
    .filter(Boolean)
    .join(' · ') || '—';
  const contactName =
    [draft.leadFirstName, draft.leadLastName].filter(Boolean).join(' ').trim() || 'Not set';

  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)]">
      <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 px-5 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,rgba(99,102,241,0.08),transparent)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
              <Building2 className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600/90">Company management</p>
              <h2 className="font-display mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {displayName}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600">
                Monitor profile completeness, jump to any section, and keep KYB data aligned before you go live.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 lg:shrink-0">
            <div className="relative h-[88px] w-[88px] shrink-0">
              <svg className="-rotate-90 transform" width="88" height="88" viewBox="0 0 88 88" aria-hidden>
                <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                  cx="44"
                  cy="44"
                  r={r}
                  fill="none"
                  stroke="url(#mgmtGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={offset}
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="mgmtGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold tabular-nums text-slate-900">{pct}%</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Ready</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Current step</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                {['Welcome', 'Organisation', 'Markets', 'Legal', 'Operations', 'Team', 'Review'][currentStep] ?? '—'}
              </p>
              <button
                type="button"
                onClick={() => onGoToStep(currentStep)}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Open editor →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-3">
        <MiniCard
          icon={Layers}
          title="Organisation"
          value={archetype}
          sub={`Team size: ${employees}`}
          stepIndex={1}
          onGoToStep={onGoToStep}
          done={isOnboardingStepValid(1, draft)}
        />
        <MiniCard
          icon={Globe2}
          title="Markets"
          value={primary ? `${primary.name} (${primary.code})` : 'HQ not set'}
          sub={
            marketsCount > 0
              ? `${marketsCount} market${marketsCount !== 1 ? 's' : ''} in footprint`
              : 'Add headquarters'
          }
          stepIndex={2}
          onGoToStep={onGoToStep}
          done={isOnboardingStepValid(2, draft)}
        />
        <MiniCard
          icon={Shield}
          title="Legal & registry"
          value={legalDisplay}
          sub={tradingDisplay !== '—' ? `Trading as: ${tradingDisplay}` : undefined}
          stepIndex={3}
          onGoToStep={onGoToStep}
          done={isOnboardingStepValid(3, draft)}
        />
        <MiniCard
          icon={Activity}
          title="Operations"
          value={volume}
          sub={channelLabels}
          stepIndex={4}
          onGoToStep={onGoToStep}
          done={isOnboardingStepValid(4, draft)}
        />
        <MiniCard
          icon={Users}
          title="Primary contact"
          value={contactName}
          sub={draft.leadEmail || 'Email not set'}
          stepIndex={5}
          onGoToStep={onGoToStep}
          done={isOnboardingStepValid(5, draft)}
        />
        <MiniCard
          icon={Mail}
          title="Review & submit"
          value={isOnboardingStepValid(6, draft) ? 'Terms accepted' : 'Awaiting confirmation'}
          sub="Final check before we route your workspace"
          stepIndex={6}
          onGoToStep={onGoToStep}
          done={isOnboardingStepValid(6, draft)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
        <p className="text-xs font-medium text-slate-500">Workspace integrations</p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/settings/api-keys"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-700"
          >
            <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
            API keys
          </Link>
          <Link
            to="/settings/webhooks"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-700"
          >
            <Webhook className="h-3.5 w-3.5 text-indigo-500" />
            Webhooks
          </Link>
        </div>
      </div>
    </div>
  );
}

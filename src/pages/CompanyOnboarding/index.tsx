import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import {
  AFRICAN_COUNTRIES,
  CHANNELS,
  COMPANY_ARCHETYPES,
  EMPLOYEE_BANDS,
  SUBREGIONS,
  VOLUME_BANDS,
  getCountryByCode,
  type AfricanCountry,
} from '../../lib/africanMarkets';
import { submitCompanyOnboarding } from '../../services/companyOnboardingService';
import { useCompanyOnboardingStore, STEP_COUNT } from '../../store/companyOnboardingStore';
import { useUIStore } from '../../store/uiStore';
import type { CompanyOnboardingDraft } from '../../types/companyOnboarding';
import { cn } from '../../lib/utils';

export type CompanyOnboardingProps = {
  /** When set, successful profile submit calls `onRegistrationProfileComplete` instead of the default success screen. */
  registrationFlow?: boolean;
  onRegistrationProfileComplete?: () => void;
};

/** Inputs aligned with registration / public dark UI */
const OB_FIELD =
  'w-full rounded-xl border border-white/[0.1] bg-[#0e0e14] px-3 py-2.5 text-[15px] leading-snug text-[#f4f4f8] placeholder:text-[#5c5c70] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none focus:ring-2 focus:ring-violet-500/45 focus:border-violet-500/50';

const H1 = 'font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight';
const SUB = 'mt-2 text-sm text-[#9a9ab8]';
const LABEL = 'text-xs font-semibold text-[#8b8ba8] uppercase tracking-wider';

const STEP_META = [
  { title: 'Welcome', subtitle: 'How we tailor AfriTrust to you' },
  { title: 'Organisation', subtitle: 'Sector and scale' },
  { title: 'Markets', subtitle: 'Where you operate' },
  { title: 'Legal entity', subtitle: 'Registry-aligned details' },
  { title: 'Operations', subtitle: 'Volume and channels' },
  { title: 'Team lead', subtitle: 'Primary contact' },
  { title: 'Review', subtitle: 'Confirm and submit' },
] as const;

function stepValid(i: number, d: CompanyOnboardingDraft): boolean {
  switch (i) {
    case 0:
      return true;
    case 1:
      return Boolean(d.archetypeId && d.employeeBandId);
    case 2:
      return Boolean(d.primaryCountryCode);
    case 3:
      return d.legalName.trim().length >= 2 && d.registrationNumber.trim().length >= 2;
    case 4:
      return Boolean(d.volumeBandId) && d.channelIds.length > 0;
    case 5: {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.leadEmail.trim());
      return (
        d.leadFirstName.trim().length >= 1 &&
        d.leadLastName.trim().length >= 1 &&
        emailOk &&
        d.leadPhoneLocal.replace(/\D/g, '').length >= 6
      );
    }
    case 6:
      return d.acceptedTerms;
    default:
      return false;
  }
}

export default function CompanyOnboarding({
  registrationFlow,
  onRegistrationProfileComplete,
}: CompanyOnboardingProps = {}) {
  const addToast = useUIStore(s => s.addToast);
  const shellMin = registrationFlow ? 'min-h-[calc(100vh-10rem)]' : 'min-h-[calc(100vh-8rem)]';
  const draft = useCompanyOnboardingStore(s => s.draft);
  const setDraft = useCompanyOnboardingStore(s => s.setDraft);
  const setStepIndex = useCompanyOnboardingStore(s => s.setStepIndex);
  const reset = useCompanyOnboardingStore(s => s.reset);
  const submitted = useCompanyOnboardingStore(s => s.submitted);
  const markSubmitted = useCompanyOnboardingStore(s => s.markSubmitted);

  const [countryQuery, setCountryQuery] = useState('');
  const [addMarketQuery, setAddMarketQuery] = useState('');

  const step = draft.stepIndex;
  const primary = getCountryByCode(draft.primaryCountryCode);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return AFRICAN_COUNTRIES;
    return AFRICAN_COUNTRIES.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countryQuery]);

  const filteredAddMarkets = useMemo(() => {
    const q = addMarketQuery.trim().toLowerCase();
    const list = AFRICAN_COUNTRIES.filter(
      c => c.code !== draft.primaryCountryCode && !draft.additionalCountryCodes.includes(c.code)
    );
    if (!q) return list;
    return list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [addMarketQuery, draft.primaryCountryCode, draft.additionalCountryCodes]);

  const submitMut = useMutation({
    mutationFn: () => submitCompanyOnboarding(useCompanyOnboardingStore.getState().draft),
    onSuccess: () => {
      if (registrationFlow && onRegistrationProfileComplete) {
        addToast('Company profile complete — opening your workspace.', 'success');
        onRegistrationProfileComplete();
        return;
      }
      markSubmitted();
      addToast('Company profile submitted — our team will reach out shortly.', 'success');
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  });

  const goNext = () => {
    if (!stepValid(step, draft)) {
      addToast('Complete the required fields to continue.', 'error');
      return;
    }
    if (step < STEP_COUNT - 1) setStepIndex(step + 1);
    else submitMut.mutate();
  };

  const goBack = () => {
    if (step > 0) setStepIndex(step - 1);
  };

  const toggleChannel = (id: string) => {
    const next = draft.channelIds.includes(id)
      ? draft.channelIds.filter(x => x !== id)
      : [...draft.channelIds, id];
    setDraft({ channelIds: next });
  };

  const toggleAdditionalCountry = (code: string) => {
    if (draft.additionalCountryCodes.includes(code)) {
      setDraft({ additionalCountryCodes: draft.additionalCountryCodes.filter(c => c !== code) });
    } else {
      setDraft({ additionalCountryCodes: [...draft.additionalCountryCodes, code] });
    }
  };

  const archetypeLabel = COMPANY_ARCHETYPES.find(a => a.id === draft.archetypeId)?.label ?? '—';

  if (submitted && draft.completedAt) {
    return (
      <div
        className={cn(
          'relative rounded-[1.35rem] overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#16161f] to-[#0c0c12] text-[#e8e8f0]',
          shellMin
        )}
      >
        <div
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 0% 0%, rgba(139,92,246,0.2), transparent), radial-gradient(ellipse 50% 40% at 100% 80%, rgba(34,211,238,0.1), transparent)',
          }}
        />
        <div className="relative max-w-lg mx-auto px-6 py-20 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 mb-6">
            <Check className="w-7 h-7" strokeWidth={2} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white">You&apos;re on the list</h1>
          <p className="mt-4 text-sm text-[#9a9ab8] leading-relaxed">
            We received your company profile for <span className="text-violet-300">{draft.legalName}</span>. A solutions
            engineer will contact <span className="text-violet-300">{draft.leadEmail}</span> with next steps for your
            markets.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                reset();
                setCountryQuery('');
                setAddMarketQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-colors shadow-lg shadow-violet-950/40"
            >
              Start another application
            </button>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-white/[0.12] text-sm font-medium text-[#c8c8e0] hover:bg-white/[0.06] transition-colors text-center"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-[1.35rem] overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#16161f] to-[#0c0c12] shadow-[0_32px_100px_-40px_rgba(99,102,241,0.35)]',
        shellMin
      )}
    >
      <div
        className="absolute inset-0 opacity-[0.45] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(139,92,246,0.15), transparent), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(34,211,238,0.08), transparent)',
        }}
      />

      <div className={cn('relative grid lg:grid-cols-[minmax(220px,280px)_1fr]', shellMin)}>
        <aside className="border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#14141c]/80 backdrop-blur-md p-6 lg:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/90 mb-1">AfriTrust</p>
          <h2 className="font-display text-xl font-semibold text-white leading-tight">Company onboarding</h2>
          <p className="text-xs text-[#8b8ba8] mt-2 leading-relaxed">
            One adaptive flow for banks, fintechs, telcos, and growing teams — tuned to African registries and compliance
            norms.
          </p>
          <ol className="mt-8 space-y-0">
            {STEP_META.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s.title} className="relative flex gap-3 pb-6 last:pb-0">
                  {i < STEP_META.length - 1 && (
                    <span
                      className={cn(
                        'absolute left-[15px] top-8 bottom-0 w-px',
                        done ? 'bg-emerald-500/50' : 'bg-white/[0.08]'
                      )}
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors',
                      done
                        ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300'
                        : active
                          ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/40'
                          : 'bg-[#0e0e14] border-white/[0.12] text-[#6b6b88]'
                    )}
                  >
                    {done ? <Check className="w-4 h-4" strokeWidth={2.5} /> : i + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className={cn('text-sm font-semibold', active ? 'text-white' : 'text-[#8b8ba8]')}>{s.title}</p>
                    <p className="text-[11px] text-[#5c5c70] mt-0.5">{s.subtitle}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="flex flex-col p-6 sm:p-10 lg:p-12 bg-[#0c0c12]/40 backdrop-blur-sm">
          <div className="flex-1 max-w-2xl">
            {step === 0 && <StepWelcome />}
            {step === 1 && <StepProfile draft={draft} setDraft={setDraft} />}
            {step === 2 && (
              <StepMarkets
                draft={draft}
                setDraft={setDraft}
                countryQuery={countryQuery}
                setCountryQuery={setCountryQuery}
                filteredCountries={filteredCountries}
                addMarketQuery={addMarketQuery}
                setAddMarketQuery={setAddMarketQuery}
                filteredAddMarkets={filteredAddMarkets}
                toggleAdditionalCountry={toggleAdditionalCountry}
              />
            )}
            {step === 3 && <StepLegal draft={draft} setDraft={setDraft} primary={primary} />}
            {step === 4 && <StepOperations draft={draft} setDraft={setDraft} toggleChannel={toggleChannel} />}
            {step === 5 && <StepTeam draft={draft} setDraft={setDraft} primary={primary} />}
            {step === 6 && (
              <StepReview
                draft={draft}
                archetypeLabel={archetypeLabel}
                primary={primary}
                setDraft={setDraft}
              />
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8b8ba8] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={submitMut.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-violet-950/40"
            >
              {step === STEP_COUNT - 1 ? (submitMut.isPending ? 'Submitting…' : 'Submit application') : 'Continue'}
              {step < STEP_COUNT - 1 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepWelcome() {
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-[1.15]">
        Build your workspace around <span className="text-cyan-400/90">real African markets</span>
      </h1>
      <p className="mt-5 text-[15px] text-[#9a9ab8] leading-relaxed max-w-xl">
        We adapt registry fields, dial codes, and compliance hints to your headquarters and footprint — whether you run a
        pan-African fintech, a national bank, or a single-country social enterprise.
      </p>
      <ul className="mt-8 space-y-4">
        {[
          '54+ African jurisdictions with local KYB field labels',
          'Dynamic company archetypes from telco to NGO',
          'Parallel markets: HQ plus every country you serve',
        ].map(text => (
          <li key={text} className="flex gap-3 text-sm text-[#c8c8e0]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepProfile({
  draft,
  setDraft,
}: {
  draft: CompanyOnboardingDraft;
  setDraft: (p: Partial<CompanyOnboardingDraft>) => void;
}) {
  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className={H1}>Organisation profile</h1>
        <p className={SUB}>Choose the model closest to yours — we tune defaults and guidance.</p>
      </header>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {COMPANY_ARCHETYPES.map(a => (
          <button
            key={a.id}
            type="button"
            onClick={() => setDraft({ archetypeId: a.id })}
            className={cn(
              'text-left rounded-xl border p-4 transition-all',
              draft.archetypeId === a.id
                ? 'border-violet-500/70 bg-violet-500/10 ring-1 ring-violet-400/25 shadow-lg shadow-violet-950/20'
                : 'border-white/[0.1] bg-[#0e0e14] hover:border-white/[0.18]'
            )}
          >
            <p className="text-sm font-semibold text-white">{a.label}</p>
            <p className="text-[11px] text-[#8b8ba8] mt-1 leading-relaxed">{a.description}</p>
          </button>
        ))}
      </div>
      <div>
        <p className={cn(LABEL, 'mb-2')}>Team size</p>
        <div className="flex flex-wrap gap-2">
          {EMPLOYEE_BANDS.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setDraft({ employeeBandId: b.id })}
              className={cn(
                'px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors',
                draft.employeeBandId === b.id
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-[#0e0e14] border-white/[0.1] text-[#c8c8e0] hover:border-violet-500/40'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepMarkets({
  draft,
  setDraft,
  countryQuery,
  setCountryQuery,
  filteredCountries,
  addMarketQuery,
  setAddMarketQuery,
  filteredAddMarkets,
  toggleAdditionalCountry,
}: {
  draft: CompanyOnboardingDraft;
  setDraft: (p: Partial<CompanyOnboardingDraft>) => void;
  countryQuery: string;
  setCountryQuery: (s: string) => void;
  filteredCountries: AfricanCountry[];
  addMarketQuery: string;
  setAddMarketQuery: (s: string) => void;
  filteredAddMarkets: AfricanCountry[];
  toggleAdditionalCountry: (code: string) => void;
}) {
  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className={H1}>Markets & footprint</h1>
        <p className={SUB}>Set your legal headquarters, then add every African market where you onboard customers or partners.</p>
      </header>

      <div>
        <label className={LABEL}>Primary country (HQ)</label>
        <input
          type="search"
          value={countryQuery}
          onChange={e => setCountryQuery(e.target.value)}
          placeholder="Search country…"
          className={cn('mt-2', OB_FIELD)}
        />
        <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0e0e14] divide-y divide-white/[0.06]">
          {filteredCountries.slice(0, 80).map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setDraft({
                  primaryCountryCode: c.code,
                  additionalCountryCodes: draft.additionalCountryCodes.filter(x => x !== c.code),
                });
                setCountryQuery('');
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm flex justify-between gap-2 hover:bg-white/[0.04]',
                draft.primaryCountryCode === c.code ? 'bg-emerald-500/15 font-medium text-emerald-200' : 'text-[#e8e8f0]'
              )}
            >
              <span>{c.name}</span>
              <span className="text-xs text-[#6b6b88]">{c.subregion}</span>
            </button>
          ))}
        </div>
        {draft.primaryCountryCode && (
          <p className="mt-2 text-xs text-emerald-400/90">
            Selected: <strong className="text-emerald-300">{getCountryByCode(draft.primaryCountryCode)?.name}</strong> · dial{' '}
            {getCountryByCode(draft.primaryCountryCode)?.dialCode}
          </p>
        )}
      </div>

      <div>
        <label className={LABEL}>Additional markets</label>
        <p className="text-[11px] text-[#6b6b88] mt-1 mb-2">Optional — select all that apply.</p>
        <input
          type="search"
          value={addMarketQuery}
          onChange={e => setAddMarketQuery(e.target.value)}
          placeholder="Search to add…"
          className={OB_FIELD}
        />
        <div className="mt-2 flex flex-wrap gap-1.5 min-h-[2rem]">
          {draft.additionalCountryCodes.map(code => {
            const c = getCountryByCode(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleAdditionalCountry(code)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 text-white text-xs font-medium"
              >
                {c?.name ?? code}
                <span className="opacity-70">×</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0e0e14]">
          {filteredAddMarkets.slice(0, 40).map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                toggleAdditionalCountry(c.code);
                setAddMarketQuery('');
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#e8e8f0] hover:bg-white/[0.05] flex justify-between border-b border-white/[0.04] last:border-0"
            >
              {c.name}
              <span className="text-[#6b6b88]">{c.code}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.1] bg-[#14141c]/80 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400/90">Coverage by AU subregion</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUBREGIONS.map(sub => {
            const n = AFRICAN_COUNTRIES.filter(
              c =>
                c.subregion === sub &&
                (c.code === draft.primaryCountryCode || draft.additionalCountryCodes.includes(c.code))
            ).length;
            if (!n) return null;
            return (
              <span key={sub} className="px-2.5 py-1 rounded-md bg-[#0e0e14] border border-white/[0.1] text-[11px] text-[#c8c8e0]">
                {sub}: <strong className="text-white">{n}</strong>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepLegal({
  draft,
  setDraft,
  primary,
}: {
  draft: CompanyOnboardingDraft;
  setDraft: (p: Partial<CompanyOnboardingDraft>) => void;
  primary: AfricanCountry | undefined;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className={H1}>Legal entity</h1>
        <p className={SUB}>
          Fields adjust to <strong className="text-white">{primary?.name ?? 'your HQ'}</strong> so your team sees familiar registry language.
        </p>
      </header>

      {primary && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100/90 leading-relaxed">
          <strong className="block text-emerald-300 mb-1">Compliance note</strong>
          {primary.complianceHint}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={cn(LABEL, 'normal-case tracking-normal')}>Legal name</label>
          <input
            value={draft.legalName}
            onChange={e => setDraft({ legalName: e.target.value })}
            className={cn('mt-1', OB_FIELD)}
            placeholder="Registered name as on certificate"
          />
        </div>
        <div>
          <label className={cn(LABEL, 'normal-case tracking-normal')}>Trading name (optional)</label>
          <input
            value={draft.tradingName}
            onChange={e => setDraft({ tradingName: e.target.value })}
            className={cn('mt-1', OB_FIELD)}
            placeholder="Brand customers see"
          />
        </div>
        <div>
          <label className={cn(LABEL, 'normal-case tracking-normal')}>
            {primary?.registrationLabel ?? 'Company registration number'}
          </label>
          <input
            value={draft.registrationNumber}
            onChange={e => setDraft({ registrationNumber: e.target.value })}
            className={cn('mt-1', OB_FIELD)}
            placeholder={primary?.registrationPlaceholder ?? 'Registry identifier'}
          />
        </div>
        <div>
          <label className={cn(LABEL, 'normal-case tracking-normal')}>Regulator / licence ref (optional)</label>
          <input
            value={draft.regulatoryRef}
            onChange={e => setDraft({ regulatoryRef: e.target.value })}
            className={cn('mt-1', OB_FIELD)}
            placeholder="e.g. banking, EMI, or sector licence"
          />
        </div>
      </div>
    </div>
  );
}

function StepOperations({
  draft,
  setDraft,
  toggleChannel,
}: {
  draft: CompanyOnboardingDraft;
  setDraft: (p: Partial<CompanyOnboardingDraft>) => void;
  toggleChannel: (id: string) => void;
}) {
  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className={H1}>Operations</h1>
        <p className={SUB}>Helps us size infrastructure, support, and review timelines.</p>
      </header>
      <div>
        <p className={cn(LABEL, 'mb-2')}>Expected verifications</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {VOLUME_BANDS.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => setDraft({ volumeBandId: v.id })}
              className={cn(
                'rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors',
                draft.volumeBandId === v.id
                  ? 'border-violet-500/70 bg-violet-500/10 text-white ring-1 ring-violet-400/20'
                  : 'border-white/[0.1] bg-[#0e0e14] text-[#c8c8e0] hover:border-white/[0.18]'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className={cn(LABEL, 'mb-2')}>Channels</p>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              type="button"
              onClick={() => toggleChannel(ch.id)}
              className={cn(
                'px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors',
                draft.channelIds.includes(ch.id)
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-[#0e0e14] border-white/[0.1] text-[#c8c8e0] hover:border-violet-500/40'
              )}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={cn(LABEL, 'normal-case tracking-normal')}>Use case notes (optional)</label>
        <textarea
          value={draft.useCaseNotes}
          onChange={e => setDraft({ useCaseNotes: e.target.value })}
          rows={4}
          className={cn('mt-1 resize-none', OB_FIELD)}
          placeholder="e.g. cross-border remittance, agent KYC, student onboarding…"
        />
      </div>
    </div>
  );
}

function StepTeam({
  draft,
  setDraft,
  primary,
}: {
  draft: CompanyOnboardingDraft;
  setDraft: (p: Partial<CompanyOnboardingDraft>) => void;
  primary: AfricanCountry | undefined;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className={H1}>Primary contact</h1>
        <p className={SUB}>We&apos;ll use this for technical and compliance follow-up.</p>
      </header>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={cn(LABEL, 'normal-case tracking-normal')}>First name</label>
          <input
            value={draft.leadFirstName}
            onChange={e => setDraft({ leadFirstName: e.target.value })}
            className={cn('mt-1', OB_FIELD)}
          />
        </div>
        <div>
          <label className={cn(LABEL, 'normal-case tracking-normal')}>Last name</label>
          <input
            value={draft.leadLastName}
            onChange={e => setDraft({ leadLastName: e.target.value })}
            className={cn('mt-1', OB_FIELD)}
          />
        </div>
      </div>
      <div>
        <label className={cn(LABEL, 'normal-case tracking-normal')}>Work email</label>
        <input
          type="email"
          value={draft.leadEmail}
          onChange={e => setDraft({ leadEmail: e.target.value })}
          className={cn('mt-1', OB_FIELD)}
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label className={cn(LABEL, 'normal-case tracking-normal')}>Phone</label>
        <div className="mt-1 flex rounded-xl border border-white/[0.12] bg-[#0e0e14] overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/45 focus-within:border-violet-500/50">
          <span className="px-3 py-2.5 text-[15px] text-[#a8a8c0] bg-[#14141c] border-r border-white/[0.08] font-mono shrink-0">
            {primary?.dialCode ?? '+—'}
          </span>
          <input
            value={draft.leadPhoneLocal}
            onChange={e => setDraft({ leadPhoneLocal: e.target.value })}
            className="flex-1 min-w-0 px-3 py-2.5 text-[15px] text-[#f4f4f8] placeholder:text-[#5c5c70] bg-transparent focus:outline-none"
            placeholder="Local number without country code"
          />
        </div>
      </div>
    </div>
  );
}

function StepReview({
  draft,
  archetypeLabel,
  primary,
  setDraft,
}: {
  draft: CompanyOnboardingDraft;
  archetypeLabel: string;
  primary: AfricanCountry | undefined;
  setDraft: (p: Partial<CompanyOnboardingDraft>) => void;
}) {
  const markets = [draft.primaryCountryCode, ...draft.additionalCountryCodes]
    .map(getCountryByCode)
    .filter(Boolean) as AfricanCountry[];

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className={H1}>Review</h1>
        <p className={SUB}>Confirm details before we route your workspace request.</p>
      </header>
      <dl className="rounded-xl border border-white/[0.1] bg-[#0e0e14] divide-y divide-white/[0.06] text-sm">
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-[#6b6b88]">Archetype</dt>
          <dd className="font-medium text-white text-right">{archetypeLabel}</dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-[#6b6b88]">Team size</dt>
          <dd className="font-medium text-white text-right">
            {EMPLOYEE_BANDS.find(b => b.id === draft.employeeBandId)?.label ?? '—'}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-[#6b6b88] mb-2">Markets</dt>
          <dd className="flex flex-wrap gap-1.5">
            {markets.map(c => (
              <span key={c.code} className="px-2 py-0.5 rounded-md bg-violet-500/15 text-xs text-violet-200 border border-violet-500/20">
                {c.name}
              </span>
            ))}
          </dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-[#6b6b88]">Legal name</dt>
          <dd className="font-medium text-white text-right">{draft.legalName}</dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-[#6b6b88]">{primary?.registrationLabel ?? 'Registration'}</dt>
          <dd className="font-mono text-xs text-[#e8e8f0] text-right break-all">{draft.registrationNumber}</dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-[#6b6b88]">Volume</dt>
          <dd className="text-white text-right">
            {VOLUME_BANDS.find(v => v.id === draft.volumeBandId)?.label ?? '—'}
          </dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-[#6b6b88]">Contact</dt>
          <dd className="text-white text-right">
            {draft.leadFirstName} {draft.leadLastName}
            <br />
            <span className="text-xs text-[#9a9ab8]">{draft.leadEmail}</span>
            <br />
            <span className="text-xs font-mono text-[#9a9ab8]">
              {primary?.dialCode} {draft.leadPhoneLocal}
            </span>
          </dd>
        </div>
      </dl>
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={draft.acceptedTerms}
          onChange={e => setDraft({ acceptedTerms: e.target.checked })}
          className="mt-1 h-4 w-4 shrink-0 rounded border-2 border-white/[0.2] text-violet-500 accent-violet-600 focus:ring-2 focus:ring-violet-500/50"
        />
        <span className="text-xs text-[#9a9ab8] leading-relaxed">
          I confirm the information is accurate to the best of my knowledge and authorise AfriTrust to process this data
          for onboarding and compliance purposes, in line with applicable African and international privacy laws.
        </span>
      </label>
    </div>
  );
}

import { X } from 'lucide-react';
import { useFilterStore } from '../../store/filterStore';
import type {
  ApplicantKind,
  ApplicantStatus,
  AfricanCountry,
  IntakeChannel,
  RiskLevel,
  VerificationTier,
} from '../../types';
import { COUNTRY_FLAGS, COUNTRY_NAMES, STATUS_LABELS } from '../../lib/constants';
import {
  APPLICANT_KIND_LABELS,
  INTAKE_CHANNEL_LABELS,
} from '../../lib/applicantPresentation';
import { cn } from '../../lib/utils';

function MultiToggle<T extends string>({
  options,
  selected,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  selected: T[] | undefined;
  onChange: (val: T[]) => void;
  label: string;
}) {
  const toggle = (v: T) => {
    const cur = selected ?? [];
    onChange(cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all',
              (selected ?? []).includes(o.value)
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'border-slate-200/90 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-800'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const ALL_COUNTRIES = (Object.keys(COUNTRY_NAMES) as AfricanCountry[])
  .map(code => ({
    value: code,
    label: `${COUNTRY_FLAGS[code]} ${COUNTRY_NAMES[code]}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

const KIND_OPTIONS: { value: ApplicantKind; label: string }[] = (
  Object.keys(APPLICANT_KIND_LABELS) as ApplicantKind[]
).map(value => ({ value, label: APPLICANT_KIND_LABELS[value] }));

const CHANNEL_OPTIONS: { value: IntakeChannel; label: string }[] = (
  Object.keys(INTAKE_CHANNEL_LABELS) as IntakeChannel[]
).map(value => ({ value, label: INTAKE_CHANNEL_LABELS[value] }));

export function ApplicantFilters() {
  const { filters, setFilter, resetFilters } = useFilterStore();

  const hasFilters = !!(
    filters.status?.length ||
    filters.country?.length ||
    filters.riskLevel?.length ||
    filters.tier?.length ||
    filters.applicantKind?.length ||
    filters.intakeChannel?.length
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="space-y-4">
        <MultiToggle<ApplicantStatus>
          label="Status"
          options={(
            ['verified', 'pending', 'needs_review', 'rejected', 'incomplete'] as ApplicantStatus[]
          ).map(v => ({ value: v, label: STATUS_LABELS[v] }))}
          selected={filters.status}
          onChange={v => setFilter('status', v.length ? v : undefined)}
        />
        <MultiToggle<AfricanCountry>
          label="Market"
          options={ALL_COUNTRIES}
          selected={filters.country}
          onChange={v => setFilter('country', v.length ? v : undefined)}
        />
        <MultiToggle<ApplicantKind>
          label="Persona"
          options={KIND_OPTIONS}
          selected={filters.applicantKind}
          onChange={v => setFilter('applicantKind', v.length ? v : undefined)}
        />
        <MultiToggle<IntakeChannel>
          label="Channel"
          options={CHANNEL_OPTIONS}
          selected={filters.intakeChannel}
          onChange={v => setFilter('intakeChannel', v.length ? v : undefined)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <MultiToggle<RiskLevel>
            label="Risk"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            selected={filters.riskLevel}
            onChange={v => setFilter('riskLevel', v.length ? v : undefined)}
          />
          <MultiToggle<VerificationTier>
            label="Tier"
            options={[
              { value: 'basic', label: 'Basic' },
              { value: 'standard', label: 'Standard' },
              { value: 'enhanced', label: 'Enhanced' },
            ]}
            selected={filters.tier}
            onChange={v => setFilter('tier', v.length ? v : undefined)}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-rose-600 hover:text-rose-700"
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

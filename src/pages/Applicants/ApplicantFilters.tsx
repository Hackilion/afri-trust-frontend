import { X } from 'lucide-react';
import { useFilterStore } from '../../store/filterStore';
import type { ApplicantStatus, AfricanCountry, RiskLevel, VerificationTier } from '../../types';
import { COUNTRY_FLAGS, COUNTRY_NAMES, STATUS_LABELS } from '../../lib/constants';
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
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{label}</span>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => toggle(o.value)}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all',
            (selected ?? []).includes(o.value)
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-700'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ApplicantFilters() {
  const { filters, setFilter, resetFilters } = useFilterStore();

  const hasFilters = !!(filters.status?.length || filters.country?.length || filters.riskLevel?.length || filters.tier?.length);

  const countries: { value: AfricanCountry; label: string }[] = [
    { value: 'NG', label: `${COUNTRY_FLAGS.NG} ${COUNTRY_NAMES.NG}` },
    { value: 'GH', label: `${COUNTRY_FLAGS.GH} ${COUNTRY_NAMES.GH}` },
    { value: 'KE', label: `${COUNTRY_FLAGS.KE} ${COUNTRY_NAMES.KE}` },
    { value: 'ZA', label: `${COUNTRY_FLAGS.ZA} ${COUNTRY_NAMES.ZA}` },
    { value: 'EG', label: `${COUNTRY_FLAGS.EG} ${COUNTRY_NAMES.EG}` },
    { value: 'UG', label: `${COUNTRY_FLAGS.UG} ${COUNTRY_NAMES.UG}` },
    { value: 'SN', label: `${COUNTRY_FLAGS.SN} ${COUNTRY_NAMES.SN}` },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <MultiToggle<ApplicantStatus>
        label="Status"
        options={['verified', 'pending', 'needs_review', 'rejected', 'incomplete'].map(v => ({ value: v as ApplicantStatus, label: STATUS_LABELS[v as ApplicantStatus] }))}
        selected={filters.status}
        onChange={v => setFilter('status', v.length ? v : undefined)}
      />
      <MultiToggle<AfricanCountry>
        label="Country"
        options={countries}
        selected={filters.country}
        onChange={v => setFilter('country', v.length ? v : undefined)}
      />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MultiToggle<RiskLevel>
          label="Risk"
          options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]}
          selected={filters.riskLevel}
          onChange={v => setFilter('riskLevel', v.length ? v : undefined)}
        />
        <MultiToggle<VerificationTier>
          label="Tier"
          options={[{ value: 'basic', label: 'Basic' }, { value: 'standard', label: 'Standard' }, { value: 'enhanced', label: 'Enhanced' }]}
          selected={filters.tier}
          onChange={v => setFilter('tier', v.length ? v : undefined)}
        />
        {hasFilters && (
          <button onClick={resetFilters} className="flex items-center gap-1 text-[12px] text-red-500 hover:text-red-600 font-medium">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

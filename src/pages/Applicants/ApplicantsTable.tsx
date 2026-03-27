import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ChevronRight,
  Globe2,
  Smartphone,
  Monitor,
  Cable,
  Tablet,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import type { ApplicantListItem, IntakeChannel } from '../../types';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { RiskScorePill } from '../../components/shared/RiskScorePill';
import { CountryFlag } from '../../components/shared/CountryFlag';
import { DOCUMENT_LABELS, TIER_COLORS, TIER_LABELS } from '../../lib/constants';
import { APPLICANT_KIND_SHORT, INTAKE_CHANNEL_LABELS } from '../../lib/applicantPresentation';
import { formatRelativeTime } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { useFilterStore } from '../../store/filterStore';
import { EmptyState } from '../../components/shared/EmptyState';
import { Users } from 'lucide-react';

const CHANNEL_ICONS: Record<IntakeChannel, typeof Smartphone> = {
  mobile_sdk: Smartphone,
  web_portal: Monitor,
  partner_api: Cable,
  agent_tablet: Tablet,
  ussd_flow: Hash,
};

function ProgressRing({ value, size = 44 }: { value: number; size?: number }) {
  const gid = useId().replace(/:/g, '');
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#apRing-${gid})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
        <defs>
          <linearGradient id={`apRing-${gid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-slate-700">
        {value}
      </span>
    </div>
  );
}

function HeaderCell({
  label,
  sortKey,
  current,
  onSort,
}: {
  label: string;
  sortKey?: keyof ApplicantListItem;
  current?: keyof ApplicantListItem;
  onSort?: (key: keyof ApplicantListItem) => void;
}) {
  const isActive = sortKey === current;
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400',
        sortKey && 'cursor-pointer select-none hover:text-indigo-600'
      )}
      onClick={() => sortKey && onSort?.(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey && <ArrowUpDown className={cn('h-3 w-3', isActive ? 'text-indigo-500' : 'text-slate-300')} />}
      </span>
    </th>
  );
}

interface Props {
  applicants: ApplicantListItem[];
  isLoading: boolean;
}

export function ApplicantsTable({ applicants, isLoading }: Props) {
  const navigate = useNavigate();
  const { filters, setFilter } = useFilterStore();

  const handleSort = (key: keyof ApplicantListItem) => {
    if (filters.sortBy === key) {
      setFilter('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFilter('sortBy', key);
      setFilter('sortDirection', 'desc');
    }
  };

  if (!isLoading && applicants.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <EmptyState
          icon={Users}
          title="No applicants match"
          description="Try clearing filters or broadening your search — identities across every channel land here."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90">
              <HeaderCell label="Applicant" sortKey="lastName" current={filters.sortBy} onSort={handleSort} />
              <HeaderCell label="Persona" sortKey="applicantKind" current={filters.sortBy} onSort={handleSort} />
              <HeaderCell label="Jurisdiction" />
              <HeaderCell label="Channel" sortKey="intakeChannel" current={filters.sortBy} onSort={handleSort} />
              <HeaderCell label="Documents" sortKey="verificationProgress" current={filters.sortBy} onSort={handleSort} />
              <HeaderCell label="Tier" sortKey="tier" current={filters.sortBy} onSort={handleSort} />
              <HeaderCell label="Status" sortKey="status" current={filters.sortBy} onSort={handleSort} />
              <HeaderCell label="Risk" sortKey="riskScore" current={filters.sortBy} onSort={handleSort} />
              <HeaderCell label="Activity" sortKey="updatedAt" current={filters.sortBy} onSort={handleSort} />
              <th className="w-10 px-2" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {[...Array(10)].map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              : applicants.map(a => {
                  const ChIcon = CHANNEL_ICONS[a.intakeChannel];
                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/applicants/${a.id}`)}
                      className="group cursor-pointer border-b border-slate-100/90 transition-colors hover:bg-indigo-50/[0.35]"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-500/20">
                            {a.firstName[0]}
                            {a.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-slate-900 group-hover:text-indigo-700">
                              {a.firstName} {a.lastName}
                            </p>
                            <p className="truncate font-mono text-[11px] text-slate-400">{a.id}</p>
                            <p className="truncate text-[11px] text-slate-500">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                          {APPLICANT_KIND_SHORT[a.applicantKind]}
                        </span>
                        {a.tags?.length ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {a.tags.slice(0, 2).map(t => (
                              <span
                                key={t}
                                className="inline-flex max-w-[140px] items-center gap-0.5 truncate rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800"
                              >
                                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                {t.replace(/-/g, ' ')}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-[12px] text-slate-700">
                            <CountryFlag country={a.nationality} showName className="text-[12px]" />
                          </div>
                          {a.crossBorder ? (
                            <div className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                              <Globe2 className="h-3 w-3" />
                              Lives in{' '}
                              <CountryFlag country={a.residenceCountry} showName className="text-[10px]" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Same as nationality</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <ChIcon className="h-4 w-4" strokeWidth={2} />
                          </span>
                          <span className="text-[11px] font-medium leading-tight text-slate-600">
                            {INTAKE_CHANNEL_LABELS[a.intakeChannel]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <ProgressRing value={a.verificationProgress} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-800">
                              {a.documentsVerified}/{a.documentsTotal} verified
                            </p>
                            <p className="truncate text-[10px] text-slate-500">
                              {DOCUMENT_LABELS[a.primaryDocumentType]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={cn(
                            'inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide',
                            TIER_COLORS[a.tier]
                          )}
                        >
                          {TIER_LABELS[a.tier]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <RiskScorePill score={a.riskScore} level={a.riskLevel} showLabel />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="whitespace-nowrap text-[11px] font-medium text-slate-600">
                          {formatRelativeTime(a.updatedAt)}
                        </p>
                        <p className="text-[10px] text-slate-400">Submitted {formatRelativeTime(a.submittedAt)}</p>
                      </td>
                      <td className="px-2 py-3.5 align-middle">
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-indigo-500" />
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowUpDown } from 'lucide-react';
import type { ApplicantListItem } from '../../types';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { RiskScorePill } from '../../components/shared/RiskScorePill';
import { CountryFlag } from '../../components/shared/CountryFlag';
import { DOCUMENT_LABELS, TIER_COLORS, TIER_LABELS } from '../../lib/constants';
import { formatDate } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { useFilterStore } from '../../store/filterStore';
import { EmptyState } from '../../components/shared/EmptyState';
import { Users } from 'lucide-react';

function HeaderCell({ label, sortKey, current, onSort }: {
  label: string;
  sortKey?: string;
  current?: string;
  direction?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}) {
  const isActive = sortKey === current;
  return (
    <th
      className={cn('text-left px-3 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap', sortKey && 'cursor-pointer hover:text-gray-600')}
      onClick={() => sortKey && onSort?.(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey && <ArrowUpDown className={cn('w-3 h-3', isActive ? 'text-indigo-500' : 'text-gray-300')} />}
      </div>
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

  const handleSort = (key: string) => {
    if (filters.sortBy === key) {
      setFilter('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFilter('sortBy', key as keyof ApplicantListItem);
      setFilter('sortDirection', 'desc');
    }
  };

  if (!isLoading && applicants.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <EmptyState icon={Users} title="No applicants found" description="Try adjusting your filters or search query." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-50 bg-gray-50/50">
            <tr>
              <HeaderCell label="Applicant" sortKey="firstName" current={filters.sortBy} direction={filters.sortDirection} onSort={handleSort} />
              <HeaderCell label="Country" />
              <HeaderCell label="Document" />
              <HeaderCell label="Tier" />
              <HeaderCell label="Status" sortKey="status" current={filters.sortBy} direction={filters.sortDirection} onSort={handleSort} />
              <HeaderCell label="Risk" sortKey="riskScore" current={filters.sortBy} direction={filters.sortDirection} onSort={handleSort} />
              <HeaderCell label="Submitted" sortKey="submittedAt" current={filters.sortBy} direction={filters.sortDirection} onSort={handleSort} />
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-3 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                  ))}
                </tr>
              ))
              : applicants.map(a => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/applicants/${a.id}`)}
                  className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                >
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-[11px] font-bold text-indigo-700 shrink-0">
                        {a.firstName[0]}{a.lastName[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{a.firstName} {a.lastName}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{a.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <CountryFlag country={a.nationality} showName className="text-[13px]" />
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-[12px] text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                      {DOCUMENT_LABELS[a.primaryDocumentType]}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-md', TIER_COLORS[a.tier])}>
                      {TIER_LABELS[a.tier]}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-3 py-3.5">
                    <RiskScorePill score={a.riskScore} level={a.riskLevel} showLabel />
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-[12px] text-gray-500 whitespace-nowrap">{formatDate(a.submittedAt)}</span>
                  </td>
                  <td className="px-3 py-3.5 pr-4">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

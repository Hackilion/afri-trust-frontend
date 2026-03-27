import { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import { useApplicants } from '../../hooks/useApplicants';
import { useFilterStore } from '../../store/filterStore';
import { ApplicantFilters } from './ApplicantFilters';
import { ApplicantsTable } from './ApplicantsTable';
import { PageHeader } from '../../components/shared/PageHeader';

function Pagination({ page, totalPages, total, pageSize, onPage, onPageSize }: {
  page: number; totalPages: number; total: number; pageSize: number;
  onPage: (n: number) => void; onPageSize: (n: number) => void;
}) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (i === 0) return 1;
    if (i === 6) return totalPages;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-gray-500">Rows per page</span>
        <select
          value={pageSize}
          onChange={e => onPageSize(Number(e.target.value))}
          className="text-[12px] border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
        >
          {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-[12px] text-gray-400">{total} total</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="px-2 py-1 rounded-lg text-[12px] font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Prev</button>
        {pages.map((p, i) => (
          <button
            key={`${p}-${i}`}
            onClick={() => typeof p === 'number' && onPage(p)}
            className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 rounded-lg text-[12px] font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next</button>
      </div>
    </div>
  );
}

export default function Applicants() {
  const [searchInput, setSearchInput] = useState('');
  const { filters, setFilter, setPage } = useFilterStore();
  const { data, isLoading } = useApplicants();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setFilter('search', searchInput || undefined), 300);
    return () => clearTimeout(timer);
  }, [searchInput, setFilter]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Applicants"
        subtitle={data ? `${data.total} applicants found` : 'Loading...'}
        action={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or applicant ID..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white"
        />
      </div>

      <ApplicantFilters />

      <div className="space-y-0">
        <ApplicantsTable applicants={data?.data ?? []} isLoading={isLoading} />
        {data && data.totalPages > 1 && (
          <div className="bg-white rounded-b-xl border-x border-b border-gray-100 -mt-px">
            <Pagination
              page={filters.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={filters.pageSize}
              onPage={setPage}
              onPageSize={n => setFilter('pageSize', n)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

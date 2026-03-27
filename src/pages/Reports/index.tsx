import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileStack, Filter } from 'lucide-react';
import { useFunnelStats, useDocumentReportStats } from '../../hooks/useDashboardStats';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { cn } from '../../lib/utils';

const PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
] as const;

function formatDocType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function Reports() {
  const [days, setDays] = useState<number>(30);
  const { data: funnel, isLoading: funnelLoading } = useFunnelStats(days);
  const { data: docs, isLoading: docsLoading } = useDocumentReportStats();

  const f = funnel?.funnel;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 hover:text-indigo-700 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to dashboard
          </Link>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Reports</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Verification funnel and document biometrics from your live workspace data.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          {PERIODS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setDays(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all',
                days === p.value ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Verification funnel</h3>
        {funnelLoading || !f ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Sessions', value: f.created },
                { label: 'Started', value: f.started },
                { label: 'Completed', value: f.completed },
                { label: 'Approved', value: f.approved },
                { label: 'Rejected', value: f.rejected },
                { label: 'Drop-off', value: `${f.drop_off_rate}%`, sub: 'before completion' },
              ].map(card => (
                <div
                  key={card.label}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
                  {'sub' in card && card.sub ? (
                    <p className="text-[10px] text-gray-400 mt-1">{card.sub}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                <FileStack className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-gray-900">Progress by step</span>
                <span className="text-[11px] text-gray-400">· last {funnel.period_days} days</span>
              </div>
              <StepBreakdownTable rows={funnel.by_step ?? []} />
            </div>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Documents & biometrics</h3>
        {docsLoading || !docs ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Document types</p>
              <p className="text-2xl font-bold text-gray-900">{docs.total_documents}</p>
              <p className="text-[11px] text-gray-400 mb-4">total uploads linked to verifications</p>
              <ul className="space-y-2">
                {Object.entries(docs.by_document_type)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <li key={type} className="flex items-center justify-between text-[13px]">
                      <span className="text-gray-700">{formatDocType(type)}</span>
                      <span className="font-semibold tabular-nums text-gray-900">{count}</span>
                    </li>
                  ))}
              </ul>
              {Object.keys(docs.by_document_type).length === 0 ? (
                <p className="text-sm text-gray-400">No documents yet.</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-4">Biometric checks</p>
              <div className="space-y-4">
                {Object.entries(docs.biometrics).map(([check, row]) => (
                  <div key={check} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-gray-800">{formatDocType(check)}</span>
                      <span className="text-[11px] text-gray-400">
                        avg score {row.avg_score != null ? row.avg_score.toFixed(3) : '—'}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-[12px]">
                      <span className="text-emerald-600 font-semibold">Passed {row.passed}</span>
                      <span className="text-red-500 font-semibold">Failed {row.failed}</span>
                      <span className="text-gray-400">Total {row.total}</span>
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(docs.biometrics).length === 0 ? (
                <p className="text-sm text-gray-400">No biometric results yet.</p>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StepBreakdownTable({ rows }: { rows: Array<Record<string, string | number | undefined | null>> }) {
  if (!rows.length) {
    return <p className="px-4 py-8 text-sm text-gray-400 text-center">No step-level data for this period.</p>;
  }

  const skip = new Set(['step_order', 'tier_name']);
  const statusKeys = [...new Set(rows.flatMap(r => Object.keys(r).filter(k => !skip.has(k))))].sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-4 py-2.5 font-semibold text-gray-600">Step</th>
            <th className="px-4 py-2.5 font-semibold text-gray-600">Tier</th>
            {statusKeys.map(k => (
              <th key={k} className="px-4 py-2.5 font-semibold text-gray-600 capitalize">
                {k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows
            .slice()
            .sort((a, b) => Number(a.step_order ?? 0) - Number(b.step_order ?? 0))
            .map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-medium text-gray-900 tabular-nums">{String(row.step_order ?? '—')}</td>
                <td className="px-4 py-2.5 text-gray-700">{String(row.tier_name ?? '—')}</td>
                {statusKeys.map(k => (
                  <td key={k} className="px-4 py-2.5 tabular-nums text-gray-800">
                    {row[k] != null && row[k] !== '' ? String(row[k]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

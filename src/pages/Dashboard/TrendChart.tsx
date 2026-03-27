import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTrendData } from '../../hooks/useDashboardStats';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { cn } from '../../lib/utils';

const RANGES = [
  { label: '7D', value: 7 as const },
  { label: '30D', value: 30 as const },
  { label: '90D', value: 90 as const },
];

function formatDate(dateStr: string, range: number) {
  const d = new Date(dateStr);
  if (range <= 7) return d.toLocaleDateString('en', { weekday: 'short' });
  if (range <= 30) return d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('en', { month: 'short' });
}

export function TrendChart() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const { data, isLoading } = useTrendData(range);

  const chartData = data?.map(d => ({
    ...d,
    date: formatDate(d.date, range),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Verification Trends</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">Submissions vs verifications over time</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn('px-3 py-1 rounded-md text-[12px] font-semibold transition-all', range === r.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {[{ color: '#6366f1', label: 'Submitted' }, { color: '#10b981', label: 'Verified' }, { color: '#f59e0b', label: 'Rejected' }].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span className="text-[11px] text-gray-500 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-24" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradVerified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f0f0f6" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}
            />
            <Area type="monotone" dataKey="submitted" stroke="#6366f1" strokeWidth={2} fill="url(#gradSubmitted)" dot={false} name="Submitted" />
            <Area type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} fill="url(#gradVerified)" dot={false} name="Verified" />
            <Area type="monotone" dataKey="rejected" stroke="#f59e0b" strokeWidth={1.5} fill="none" dot={false} name="Rejected" strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

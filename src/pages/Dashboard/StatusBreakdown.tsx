import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardKpis } from '../../types';
import { STATUS_LABELS } from '../../lib/constants';

const STATUS_CHART_COLORS: Record<string, string> = {
  verified: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
  needs_review: '#6366f1',
  incomplete: '#9ca3af',
};

interface Props { kpis?: DashboardKpis }

export function StatusBreakdown({ kpis }: Props) {
  if (!kpis) return null;

  const data = [
    { key: 'verified', value: kpis.verified },
    { key: 'pending', value: kpis.pending },
    { key: 'needs_review', value: kpis.needsReview },
    { key: 'rejected', value: kpis.rejected },
  ];

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Status Breakdown</h3>
      <p className="text-[12px] text-gray-400 mb-4">{total} total applications</p>

      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} strokeWidth={0}>
            {data.map(entry => (
              <Cell key={entry.key} fill={STATUS_CHART_COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
            formatter={(_value, _name, props) => {
              const key = (props as { payload?: { key?: string } }).payload?.key ?? '';
              return [_value, STATUS_LABELS[key as keyof typeof STATUS_LABELS] ?? _name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-3">
        {data.map(d => (
          <div key={d.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_CHART_COLORS[d.key] }} />
              <span className="text-[12px] text-gray-600">{STATUS_LABELS[d.key as keyof typeof STATUS_LABELS]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-gray-900">{d.value}</span>
              <span className="text-[11px] text-gray-400">{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

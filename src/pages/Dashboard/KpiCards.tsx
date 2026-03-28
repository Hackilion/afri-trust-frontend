import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { DashboardKpis } from '../../types';
import { cn } from '../../lib/utils';
import { SkeletonCard } from '../../components/shared/LoadingSpinner';

interface KpiCardProps {
  label: string;
  value: number | string;
  delta?: number;
  icon: React.ReactNode;
  accent: string;
}

function KpiCard({ label, value, delta, icon, accent }: KpiCardProps) {
  const isPositive = delta !== undefined && delta >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accent)}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">{value}</span>
        {delta !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-[12px] font-semibold mb-0.5', isPositive ? 'text-emerald-600' : 'text-red-500')}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      {delta !== undefined && <p className="text-[11px] text-gray-400 mt-1">vs last week (submissions)</p>}
    </div>
  );
}

interface Props { kpis?: DashboardKpis; isLoading: boolean }

export function KpiCards({ kpis, isLoading }: Props) {
  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
  if (!kpis) return null;

  const { weekOverWeekGrowth } = kpis;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Total Applicants" value={kpis.totalApplicants} delta={weekOverWeekGrowth} icon={<Users className="w-4 h-4 text-indigo-600" />} accent="bg-indigo-50" />
      <KpiCard label="Verified" value={kpis.verified} icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} accent="bg-emerald-50" />
      <KpiCard label="Pending Review" value={kpis.pending + kpis.needsReview} icon={<Clock className="w-4 h-4 text-amber-600" />} accent="bg-amber-50" />
      <KpiCard label="Rejected" value={kpis.rejected} icon={<XCircle className="w-4 h-4 text-red-500" />} accent="bg-red-50" />
    </div>
  );
}

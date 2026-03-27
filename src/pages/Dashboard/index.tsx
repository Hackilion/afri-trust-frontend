import { useDashboardKpis } from '../../hooks/useDashboardStats';
import { KpiCards } from './KpiCards';
import { TrendChart } from './TrendChart';
import { StatusBreakdown } from './StatusBreakdown';
import { ActivityFeed } from './ActivityFeed';
import { formatPercent } from '../../lib/formatters';

export default function Dashboard() {
  const { data: kpis, isLoading } = useDashboardKpis();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Good morning, Sarah 👋</h2>
        <p className="text-sm text-gray-500 mt-1">
          {kpis && `${kpis.pending + kpis.needsReview} applications need your attention · ${formatPercent(kpis.approvalRate)} approval rate`}
        </p>
      </div>

      <KpiCards kpis={kpis} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrendChart />
        </div>
        <div>
          <StatusBreakdown kpis={kpis} />
        </div>
      </div>

      <ActivityFeed />
    </div>
  );
}

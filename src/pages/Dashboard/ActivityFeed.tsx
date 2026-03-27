import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, FileText, UserPlus, Clock } from 'lucide-react';
import { useActivityFeed } from '../../hooks/useDashboardStats';
import { COUNTRY_FLAGS } from '../../lib/constants';
import { formatRelativeTime } from '../../lib/formatters';
import type { TimelineEventType } from '../../types';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

function EventIcon({ type }: { type: TimelineEventType }) {
  const props = { className: 'w-3.5 h-3.5' };
  if (type === 'approved') return <CheckCircle {...props} className="w-3.5 h-3.5 text-emerald-500" />;
  if (type === 'rejected') return <XCircle {...props} className="w-3.5 h-3.5 text-red-500" />;
  if (type === 'status_changed') return <AlertCircle {...props} className="w-3.5 h-3.5 text-amber-500" />;
  if (type === 'submitted') return <UserPlus {...props} className="w-3.5 h-3.5 text-indigo-500" />;
  if (type === 'document_uploaded') return <FileText {...props} className="w-3.5 h-3.5 text-blue-500" />;
  return <Clock {...props} className="w-3.5 h-3.5 text-gray-400" />;
}

export function ActivityFeed() {
  const { data, isLoading } = useActivityFeed();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        <Link to="/applicants" className="text-[12px] text-indigo-600 font-medium hover:text-indigo-700">
          View all →
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-8" />
      ) : (
        <div className="space-y-0 divide-y divide-gray-50">
          {data?.map(item => (
            <Link key={item.id} to={`/applicants/${item.applicantId}`} className="flex items-start gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors group">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                <EventIcon type={item.eventType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">{item.applicantName}</span>
                  <span className="text-base">{COUNTRY_FLAGS[item.country]}</span>
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5 truncate">{item.description}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 mt-0.5 tabular-nums">{formatRelativeTime(item.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { cn } from '../../lib/utils';
import type { SessionStatus } from '../../types';

const config: Record<SessionStatus, { label: string; classes: string }> = {
  created: { label: 'Created', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  awaiting_review: { label: 'Awaiting Review', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200' },
};

interface SessionStatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const { label, classes } = config[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', classes, className)}>
      {label}
    </span>
  );
}

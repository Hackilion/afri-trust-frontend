import { cn } from '../../lib/utils';
import type { WorkflowStatus } from '../../types';

const config: Record<WorkflowStatus, { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  published: { label: 'Published', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { label: 'Archived', classes: 'bg-orange-50 text-orange-700 border-orange-200' },
};

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

export function WorkflowStatusBadge({ status, className }: WorkflowStatusBadgeProps) {
  const { label, classes } = config[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', classes, className)}>
      {label}
    </span>
  );
}

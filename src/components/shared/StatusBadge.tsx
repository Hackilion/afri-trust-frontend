import { cn } from '../../lib/utils';
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/constants';
import type { ApplicantStatus } from '../../types';

export function StatusBadge({ status }: { status: ApplicantStatus }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border', STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

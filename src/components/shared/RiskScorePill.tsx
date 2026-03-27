import { cn } from '../../lib/utils';
import { RISK_COLORS } from '../../lib/constants';
import type { RiskLevel } from '../../types';

interface Props { score: number; level: RiskLevel; showLabel?: boolean }

export function RiskScorePill({ score, level, showLabel = false }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold', RISK_COLORS[level])}>
      <span className="font-mono">{score}</span>
      {showLabel && <span className="capitalize">{level}</span>}
    </span>
  );
}

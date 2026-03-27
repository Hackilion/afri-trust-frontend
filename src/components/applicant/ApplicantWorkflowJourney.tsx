import { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Layers,
} from 'lucide-react';
import type { WorkflowJourney, WorkflowJourneyStep, JourneyPhase } from '../../lib/applicantWorkflowJourney';
import { cn } from '../../lib/utils';
import { formatDateTime } from '../../lib/formatters';
import { SessionStatusBadge } from '../shared/SessionStatusBadge';

function phaseRing(phase: JourneyPhase): string {
  if (phase === 'complete') return 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]';
  if (phase === 'current') return 'border-indigo-500 bg-white text-indigo-700 shadow-[0_0_0_3px_rgba(99,102,241,0.2)]';
  if (phase === 'failed') return 'border-red-400 bg-red-50 text-red-700 shadow-[0_0_0_3px_rgba(248,113,113,0.15)]';
  return 'border-slate-200 bg-slate-50 text-slate-400';
}

function railColor(phase: JourneyPhase): string {
  if (phase === 'complete') return 'bg-emerald-200';
  if (phase === 'failed') return 'bg-red-200';
  if (phase === 'current') return 'bg-indigo-200';
  return 'bg-slate-100';
}

function checkPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'passed' || s === 'verified')
    return 'text-emerald-800 bg-emerald-50 border-emerald-200/80';
  if (s === 'failed' || s === 'rejected') return 'text-red-800 bg-red-50 border-red-200/80';
  if (s === 'pending' || s === 'in_progress' || s === 'running')
    return 'text-amber-900 bg-amber-50 border-amber-200/80';
  return 'text-slate-600 bg-slate-50 border-slate-200/80';
}

function formatCheckStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === 'not_applicable' || s === 'n/a') return 'N/A';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function StepMarker({ step }: { step: WorkflowJourneyStep }) {
  return (
    <div
      className={cn(
        'relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors',
        phaseRing(step.phase)
      )}
      aria-hidden
    >
      {step.phase === 'complete' ? (
        <Check className="h-4 w-4 stroke-[2.5]" />
      ) : step.phase === 'failed' ? (
        <AlertCircle className="h-4 w-4 stroke-[2.5]" />
      ) : (
        step.order
      )}
    </div>
  );
}

function JourneyStepCard({
  step,
  isLast,
  expanded,
  onToggle,
}: {
  step: WorkflowJourneyStep;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const checks = step.checks ?? [];
  const summary =
    checks.length > 0
      ? `${checks.length} item${checks.length === 1 ? '' : 's'} · ${checks.filter(c => ['passed', 'verified'].includes(c.status.toLowerCase())).length} ok`
      : null;

  return (
    <div className="flex items-stretch gap-3 sm:gap-4">
      <div className="flex w-9 shrink-0 flex-col items-center">
        <StepMarker step={step} />
        {!isLast && (
          <div
            className={cn('mt-1 w-0.5 flex-1 min-h-[28px] rounded-full', railColor(step.phase))}
            aria-hidden
          />
        )}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-7')}>
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 transition-shadow',
            step.phase === 'current' && 'border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 to-white shadow-sm ring-1 ring-indigo-100/80',
            step.phase === 'complete' && 'border-slate-100 bg-white',
            step.phase === 'upcoming' && 'border-slate-100/90 bg-slate-50/40',
            step.phase === 'failed' && 'border-red-100 bg-red-50/30 ring-1 ring-red-100/60'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Step {step.order}
              </p>
              <h4 className="mt-0.5 text-[15px] font-semibold tracking-tight text-slate-900">
                {step.title}
              </h4>
              {step.subtitle && (
                <p className="mt-0.5 text-[12px] text-slate-500">{step.subtitle}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                {step.startedAt && (
                  <span>
                    Started <span className="font-medium text-slate-600">{formatDateTime(step.startedAt)}</span>
                  </span>
                )}
                {step.completedAt && (
                  <span>
                    Completed <span className="font-medium text-slate-600">{formatDateTime(step.completedAt)}</span>
                  </span>
                )}
              </div>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                step.phase === 'complete' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                step.phase === 'current' && 'border-indigo-200 bg-indigo-50 text-indigo-800',
                step.phase === 'upcoming' && 'border-slate-200 bg-white text-slate-500',
                step.phase === 'failed' && 'border-red-200 bg-red-50 text-red-800'
              )}
            >
              {step.phase === 'complete' && 'Done'}
              {step.phase === 'current' && 'In progress'}
              {step.phase === 'upcoming' && 'Upcoming'}
              {step.phase === 'failed' && 'Blocked'}
            </span>
          </div>

          {checks.length > 0 && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-left text-[12px] text-slate-600 transition-colors hover:bg-slate-100/90"
            >
              <span className="font-medium text-slate-700">{summary}</span>
              {expanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              )}
            </button>
          )}

          {expanded && checks.length > 0 && (
            <ul className="mt-2 space-y-2 border-t border-slate-100/80 pt-3">
              {checks.map(c => (
                <li
                  key={c.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white px-3 py-2 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-800">{c.label}</p>
                    {c.detail && <p className="text-[11px] text-red-600 mt-0.5">{c.detail}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.score !== undefined && (
                      <span className="font-mono text-[10px] text-slate-400">{c.score}%</span>
                    )}
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                        checkPillClass(c.status)
                      )}
                    >
                      {formatCheckStatus(c.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function ApplicantWorkflowJourney({ journey }: { journey: WorkflowJourney }) {
  const [open, setOpen] = useState<Set<string>>(() => {
    return new Set(
      journey.steps.filter(s => s.phase === 'current' || s.phase === 'failed').map(s => s.key)
    );
  });

  const progressPct = journey.totalSteps
    ? Math.min(100, Math.round((journey.completedSteps / journey.totalSteps) * 100))
    : 0;

  const currentStep = journey.steps.find(s => s.phase === 'current' || s.phase === 'failed');

  const toggle = (key: string) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/25 shadow-sm">
      <div className="border-b border-slate-100/90 bg-white/60 px-4 py-4 sm:px-5 sm:py-5 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <GitBranch className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Verification journey
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                    journey.source === 'verification_session'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-slate-100 text-slate-600'
                  )}
                >
                  <Layers className="h-3 w-3" />
                  {journey.source === 'verification_session' ? 'Live workflow session' : 'Inferred from status'}
                </span>
              </div>
              <p className="mt-1.5 text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl">
                {journey.headline}
              </p>
              {journey.subline && (
                <p className="mt-1 text-[13px] text-slate-600">{journey.subline}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
                <span className="font-medium text-slate-700">{journey.workflowName}</span>
                {journey.workflowVersion != null && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>v{journey.workflowVersion}</span>
                  </>
                )}
                {journey.sessionId && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-[11px] text-slate-500">{journey.sessionId}</span>
                  </>
                )}
                {journey.sessionStatus && (
                  <span className="ml-1">
                    <SessionStatusBadge status={journey.sessionStatus} />
                  </span>
                )}
              </div>
              {journey.reviewedBy && (
                <p className="mt-2 text-[12px] text-slate-500">
                  Reviewed by <span className="font-medium text-slate-700">{journey.reviewedBy}</span>
                </p>
              )}
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-52">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[12px] font-bold tabular-nums text-slate-800">{progressPct}%</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {journey.completedSteps} of {journey.totalSteps} steps complete
              {currentStep && (
                <>
                  {' '}
                  · Now: <span className="font-medium text-slate-700">{currentStep.title}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {journey.steps.map((step, i) => (
          <JourneyStepCard
            key={step.key}
            step={step}
            isLast={i === journey.steps.length - 1}
            expanded={open.has(step.key)}
            onToggle={() => toggle(step.key)}
          />
        ))}
      </div>
    </section>
  );
}

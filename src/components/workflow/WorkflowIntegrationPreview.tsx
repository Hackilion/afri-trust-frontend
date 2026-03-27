import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Eye,
  FileUp,
  Fingerprint,
  FormInput,
  Globe,
  Layers,
  Monitor,
  Palette,
  Shield,
  Smartphone,
  Sparkles,
  Tablet,
  UserRound,
  Webhook,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Workflow, WorkflowStep, WorkflowStepType } from '../../types';
import { getPreviewJourney } from '../../lib/workflowPreviewOrder';
import { cn } from '../../lib/utils';

export type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

type Branding = {
  companyName: string;
  primaryColor: string;
  logoUrl: string;
  supportEmail: string;
};

const STORAGE_PREFIX = 'afritrust-wf-integration-preview:';

/** Matches canvas node titles in `WorkflowFlowCanvas`. */
const STEP_CANVAS_TITLE: Record<WorkflowStepType, string> = {
  document_upload: 'Document Upload',
  liveness_check: 'Liveness Check',
  data_form: 'Data Form',
  aml_screen: 'AML Screen',
  manual_review: 'Manual Review',
  webhook: 'Webhook',
  custom: 'Custom',
};

function loadBranding(workflowId: string): Partial<Branding> | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + workflowId);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Branding>;
  } catch {
    return null;
  }
}

function saveBranding(workflowId: string, b: Branding) {
  try {
    localStorage.setItem(STORAGE_PREFIX + workflowId, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

function defaultBranding(workflow: Workflow): Branding {
  const tag = workflow.tags?.[0]?.trim();
  return {
    companyName: tag ? `${tag.charAt(0).toUpperCase() + tag.slice(1)} · ${workflow.name}` : workflow.name,
    primaryColor: '#4f46e5',
    logoUrl: '',
    supportEmail: 'support@yourcompany.com',
  };
}

const STEP_VISUAL: Record<
  WorkflowStepType,
  { sub: string; icon: LucideIcon }
> = {
  document_upload: {
    sub: 'Upload a government-issued ID. Files are encrypted in transit and at rest.',
    icon: FileUp,
  },
  liveness_check: {
    sub: 'Quick selfie to confirm you’re present. Usually under 30 seconds.',
    icon: Fingerprint,
  },
  data_form: {
    sub: 'A few questions so we can route you to the right verification level.',
    icon: FormInput,
  },
  aml_screen: {
    sub: 'Automated sanctions, PEP, and watchlist checks for compliance.',
    icon: Shield,
  },
  manual_review: {
    sub: 'Our team may review edge cases. You’ll be notified by email.',
    icon: UserRound,
  },
  webhook: {
    sub: 'Secure handoff to your bank or partner system.',
    icon: Webhook,
  },
  custom: {
    sub: 'Custom checks defined in your integration.',
    icon: Sparkles,
  },
}

/** Same headline rules as the builder canvas, plus optional override label for all types in preview. */
function applicantHeadline(step: WorkflowStep): string {
  const base = STEP_CANVAS_TITLE[step.stepType];
  if (step.stepType === 'custom' || step.stepType === 'webhook') {
    return step.label?.trim() || base;
  }
  return step.label?.trim() || base;
}

function stepDisplay(step: WorkflowStep) {
  const v = STEP_VISUAL[step.stepType];
  return {
    title: applicantHeadline(step),
    sub: v.sub,
    icon: v.icon,
  };
}

function workflowStructureKey(workflow: Workflow): string {
  const steps = workflow.steps.map(s => [
    s.nodeId,
    s.order,
    s.stepType,
    s.label ?? '',
    s.tierProfileId ?? '',
    s.integrationKey ?? '',
  ]);
  const edges = (workflow.edges ?? []).map(e => [e.source, e.target, e.id]);
  return JSON.stringify({ steps, edges });
}

function isValidUrl(s: string) {
  if (!s.trim()) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function BrandLogo({
  name,
  logoUrl,
  color,
}: {
  name: string;
  logoUrl: string;
  color: string;
}) {
  const [broken, setBroken] = useState(false);
  const initials =
    name
      .split(/\s+/)
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AT';

  const showImg = isValidUrl(logoUrl) && !broken;

  return (
    <div className="flex items-center gap-3 min-w-0">
      {showImg ? (
        <img
          src={logoUrl}
          alt=""
          className="h-11 w-11 rounded-2xl object-contain bg-white ring-1 ring-black/[0.06]"
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-900">{name}</p>
        <p className="text-[12px] text-zinc-500">Verification · AfriTrust</p>
      </div>
    </div>
  );
}

function PreviewChrome({
  device,
  children,
  embedPath,
  workflowName,
}: {
  device: PreviewDevice;
  children: React.ReactNode;
  embedPath: string;
  workflowName: string;
}) {
  const urlBarInner = (
    <>
      <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[10px] text-zinc-500 leading-tight">{embedPath}</p>
        <p className="truncate text-[10px] font-medium text-zinc-600 mt-0.5">{workflowName}</p>
      </div>
    </>
  );

  if (device === 'desktop') {
    return (
      <div className="rounded-2xl bg-zinc-200/60 p-1.5 shadow-inner ring-1 ring-zinc-300/40">
        <div className="rounded-[10px] bg-white shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-900/5 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/95 px-3 py-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ec6a5e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f4bf4f]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#61c554]" />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-zinc-200/80 min-w-0">
              {urlBarInner}
            </div>
          </div>
          <div className="bg-zinc-50/30 min-h-[300px] max-h-[min(52vh,440px)] overflow-auto">{children}</div>
        </div>
      </div>
    );
  }

  const bar = (
    <div className="flex items-center gap-2 border-b border-zinc-100/90 bg-zinc-50/80 px-3 py-2">{urlBarInner}</div>
  );

  if (device === 'tablet') {
    return (
      <div className="mx-auto w-full max-w-[420px] rounded-[1.35rem] border-[8px] border-zinc-800 bg-zinc-900 p-0.5 shadow-2xl shadow-zinc-900/25">
        <div className="overflow-hidden rounded-[0.85rem] bg-black">
          <div className="flex h-5 items-center justify-center bg-zinc-950">
            <span className="h-1 w-9 rounded-full bg-zinc-700" />
          </div>
          <div className="border-x border-black bg-white min-h-[320px] max-h-[min(50vh,400px)] overflow-auto">
            {bar}
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[2.25rem] border-[8px] border-zinc-900 bg-zinc-950 p-px shadow-2xl shadow-zinc-900/30">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-black">
        <div className="absolute left-1/2 top-2 z-10 h-6 w-[92px] -translate-x-1/2 rounded-full bg-black ring-1 ring-zinc-800" />
        <div className="pt-10 bg-white min-h-[440px] max-h-[min(60vh,560px)] overflow-auto flex flex-col">
          {bar}
          <div className="flex-1">{children}</div>
          <div className="h-1 w-28 mx-auto mb-2.5 rounded-full bg-zinc-200" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function PreviewContent({
  workflow,
  brand,
  device,
  activeIndex,
  orderedSteps,
  waves,
  hasParallelWaves,
}: {
  workflow: Workflow;
  brand: Branding;
  device: PreviewDevice;
  activeIndex: number;
  orderedSteps: WorkflowStep[];
  waves: WorkflowStep[][];
  hasParallelWaves: boolean;
}) {
  const total = Math.max(orderedSteps.length, 1);
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(orderedSteps.length - 1, 0));
  const current = orderedSteps[safeIndex];
  const pct = orderedSteps.length === 0 ? 0 : ((safeIndex + 1) / total) * 100;

  const fallbackVisual = {
    title: 'Get started',
    sub: 'Your verification flow will appear here once you add steps.',
    icon: FormInput,
  };
  const { title, sub, icon: Icon } = current ? stepDisplay(current) : fallbackVisual;

  const currentWave = current ? waves.find(w => w.some(s => s.nodeId === current.nodeId)) : null;
  const parallelPeers =
    currentWave && currentWave.length > 1 ? currentWave.filter(s => s.nodeId !== current?.nodeId) : [];

  const tierLabel = current?.tierProfile?.name ?? current?.tierProfileId;

  const pad = device === 'mobile' ? 'px-4 py-5' : device === 'tablet' ? 'px-5 py-6' : 'px-7 py-8';

  return (
    <div className={cn(pad, 'space-y-5')} style={{ ['--preview-primary' as string]: brand.primaryColor }}>
      <BrandLogo name={brand.companyName} logoUrl={brand.logoUrl} color={brand.primaryColor} />

      {orderedSteps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/80 px-5 py-8 text-center">
          <p className="text-sm font-semibold tracking-tight text-zinc-800">No steps in this workflow</p>
          <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
            Add and connect steps on the <span className="font-medium text-zinc-700">Workflow</span> tab — the preview
            updates from your graph automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
              <span>
                Step {safeIndex + 1} of {orderedSteps.length}
              </span>
              <span className="tabular-nums">{Math.round(pct)}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: brand.primaryColor }}
              />
            </div>
          </div>

          {hasParallelWaves && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50/90 px-3 py-2 text-[11px] text-amber-950 ring-1 ring-amber-200/60">
              <Layers className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-700" />
              <span>
                Branches run as <span className="font-semibold">parallel waves</span> where multiple steps share a stage —
                applicants may see them together or in any order within that stage.
              </span>
            </p>
          )}

          <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-900/[0.06] shadow-sm space-y-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${brand.primaryColor}18`,
                color: brand.primaryColor,
              }}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900 leading-snug">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">{sub}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {current && !current.required && (
                <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                  Optional
                </span>
              )}
              {tierLabel && (
                <span className="rounded-lg bg-zinc-900/[0.04] px-2 py-0.5 text-[10px] font-semibold text-zinc-700 ring-1 ring-zinc-900/5">
                  Tier · {tierLabel}
                </span>
              )}
              {current?.checks && current.checks.length > 0 && (
                <span className="rounded-lg bg-zinc-900/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                  {current.checks.length} check{current.checks.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {parallelPeers.length > 0 && (
              <div className="rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-100">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Same stage</p>
                <p className="mt-1 text-xs text-zinc-700">
                  Together with:{' '}
                  {parallelPeers.map(p => applicantHeadline(p)).join(' · ')}
                </p>
              </div>
            )}

            {(current?.stepType === 'webhook' || current?.stepType === 'custom') && current.integrationKey && (
              <p className="rounded-lg bg-zinc-50 px-2.5 py-2 font-mono text-[10px] text-zinc-500 ring-1 ring-zinc-100">
                {current.integrationKey}
              </p>
            )}

            <button
              type="button"
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-[transform,opacity] hover:opacity-95 active:scale-[0.99]"
              style={{
                backgroundColor: brand.primaryColor,
                boxShadow: `0 12px 28px -10px ${brand.primaryColor}aa`,
              }}
            >
              Continue
              <ChevronRight className="inline-block ml-1 h-4 w-4 align-text-bottom opacity-90" />
            </button>
            <p className="text-center text-[11px] text-zinc-400">
              Help · <span className="font-medium text-zinc-600">{brand.supportEmail}</span>
            </p>
          </div>

          <div className="rounded-xl bg-white/60 px-3 py-3 ring-1 ring-zinc-900/[0.05]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Flow from graph</p>
            <ol className="space-y-1">
              {waves.map((wave, wi) => (
                <li key={wi} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px]">
                  <span className="font-mono text-zinc-400 tabular-nums w-5 shrink-0">{wi + 1}</span>
                  {wave.length === 1 ? (
                    <span className="font-medium text-zinc-800">{stepDisplay(wave[0]).title}</span>
                  ) : (
                    <span className="text-zinc-700">
                      <span className="inline-flex items-center gap-1 font-medium text-violet-700">
                        <Layers className="h-3 w-3" />
                        Parallel
                      </span>
                      : {wave.map(s => stepDisplay(s).title).join(' · ')}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {workflow.description?.trim() && orderedSteps.length > 0 && (
        <p className="text-[11px] leading-relaxed text-zinc-500 line-clamp-3">{workflow.description}</p>
      )}
    </div>
  );
}

type Props = {
  workflow: Workflow;
  variant?: 'collapsible' | 'tab';
};

export function WorkflowIntegrationPreview({ workflow, variant = 'collapsible' }: Props) {
  const isTab = variant === 'tab';
  const [open, setOpen] = useState(true);
  const [device, setDevice] = useState<PreviewDevice>('mobile');
  const [activeIndex, setActiveIndex] = useState(0);
  const [brand, setBrand] = useState<Branding>(() => ({
    ...defaultBranding(workflow),
    ...loadBranding(workflow.id),
  }));

  const journey = useMemo(() => getPreviewJourney(workflow), [workflow]);
  const { steps: orderedSteps, waves, hasParallelWaves, graphInvalid, unreachable } = journey;

  const structureKey = useMemo(() => workflowStructureKey(workflow), [workflow]);

  useEffect(() => {
    const stored = loadBranding(workflow.id);
    setBrand({ ...defaultBranding(workflow), ...stored });
  }, [workflow.id]);

  useEffect(() => {
    setActiveIndex(0);
  }, [structureKey]);

  useEffect(() => {
    setActiveIndex(i => Math.min(i, Math.max(0, orderedSteps.length - 1)));
  }, [orderedSteps.length]);

  const persist = useCallback(
    (next: Branding) => {
      setBrand(next);
      saveBranding(workflow.id, next);
    },
    [workflow.id]
  );

  const embedPath = `https://verify.afritrust.io/embed/${workflow.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`;

  const devices: { id: PreviewDevice; icon: LucideIcon; label: string }[] = [
    { id: 'mobile', icon: Smartphone, label: 'Phone' },
    { id: 'tablet', icon: Tablet, label: 'Tablet' },
    { id: 'desktop', icon: Monitor, label: 'Desktop' },
  ];

  const showBody = isTab || open;

  return (
    <section
      className={cn(
        'rounded-2xl border overflow-hidden shadow-sm',
        isTab ? 'border-zinc-200/90 bg-zinc-50/50' : 'border-indigo-200/50 bg-gradient-to-b from-zinc-50/80 to-white'
      )}
    >
      {isTab ? (
        <div className="flex flex-col gap-1 border-b border-zinc-200/80 bg-white px-4 py-3.5 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
              <Eye className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Live preview</h2>
              <p className="text-[12px] text-zinc-500 truncate">
                Mirrors <span className="font-medium text-zinc-700">{workflow.name}</span> · graph order & parallel stages
              </p>
            </div>
          </div>
          {(graphInvalid || unreachable.length > 0) && (
            <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {graphInvalid ? 'Invalid graph — showing order fallback' : `${unreachable.length} unreachable step(s)`}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5 border-b border-zinc-200/80 bg-white/90 hover:bg-white transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
              <Eye className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Integration preview</h2>
              <p className="text-[11px] text-zinc-500 truncate">Synced with workflow graph · {workflow.name}</p>
            </div>
          </div>
          <ChevronRight className={cn('h-5 w-5 text-zinc-400 transition-transform shrink-0', open && 'rotate-90')} />
        </button>
      )}

      {showBody && (
        <div
          className={cn(
            'p-4 sm:p-6 grid gap-6',
            isTab
              ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,380px)]'
              : 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]'
          )}
        >
          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Viewport</span>
              <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-zinc-100/90 ring-1 ring-zinc-200/60">
                {devices.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDevice(id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                      device === id
                        ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80'
                        : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <PreviewChrome device={device} embedPath={embedPath} workflowName={workflow.name}>
              <PreviewContent
                workflow={workflow}
                brand={brand}
                device={device}
                activeIndex={activeIndex}
                orderedSteps={orderedSteps}
                waves={waves}
                hasParallelWaves={hasParallelWaves}
              />
            </PreviewChrome>

            {orderedSteps.length > 0 && (
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200/60">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Jump to step · same order as graph
                </p>
                <div className="flex flex-wrap items-stretch gap-1">
                  {orderedSteps.map((s, i) => {
                    const { title } = stepDisplay(s);
                    const done = i < activeIndex;
                    return (
                      <div key={s.nodeId} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveIndex(i)}
                          className={cn(
                            'rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-all max-w-[160px] sm:max-w-[200px] border',
                            i === activeIndex
                              ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                              : done
                                ? 'border-emerald-200/80 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-50'
                                : 'border-zinc-100 bg-zinc-50/80 text-zinc-600 hover:bg-zinc-100'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md text-[10px] font-bold tabular-nums mr-1.5 align-middle',
                              i === activeIndex ? 'bg-white/15' : done ? 'bg-emerald-200/60 text-emerald-900' : 'bg-zinc-200/80'
                            )}
                          >
                            {done ? '✓' : i + 1}
                          </span>
                          <span className="line-clamp-2 align-middle">{title}</span>
                        </button>
                        {i < orderedSteps.length - 1 && (
                          <span className="text-zinc-300 text-xs font-light hidden sm:inline" aria-hidden>
                            →
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-sm h-fit">
            <div className="flex items-center gap-2 text-zinc-800">
              <Palette className="h-4 w-4 text-zinc-500" strokeWidth={2} />
              <p className="text-xs font-semibold tracking-tight">Branding</p>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Stored locally per workflow. Production uses your workspace theme or SDK.
            </p>
            <label className="block">
              <span className="text-[10px] font-medium text-zinc-500">Company name</span>
              <input
                value={brand.companyName}
                onChange={e => persist({ ...brand, companyName: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-medium text-zinc-500">Primary color</span>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="color"
                  value={brand.primaryColor}
                  onChange={e => persist({ ...brand, primaryColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded-xl border border-zinc-200 bg-white p-1"
                />
                <input
                  value={brand.primaryColor}
                  onChange={e => persist({ ...brand, primaryColor: e.target.value })}
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[10px] font-medium text-zinc-500">Logo URL</span>
              <input
                value={brand.logoUrl}
                onChange={e => persist({ ...brand, logoUrl: e.target.value })}
                placeholder="https://…"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-medium text-zinc-500">Support email</span>
              <input
                type="email"
                value={brand.supportEmail}
                onChange={e => persist({ ...brand, supportEmail: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}

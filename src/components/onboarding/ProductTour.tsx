import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { useSessionStore } from '../../store/sessionStore';
import { useProductTourStore, TOUR_PENDING_KEY } from '../../store/productTourStore';
import { buildTourSteps } from '../../lib/productTourSteps';
import { cn } from '../../lib/utils';

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 10;
const TOOLTIP_W = 340;

export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSessionStore(s => s.user);
  const { can, isSuperAdmin } = useSession();
  const markTourFinishedForUser = useProductTourStore(s => s.markTourFinishedForUser);
  const isTourCompleteForUser = useProductTourStore(s => s.isTourCompleteForUser);
  const tourReplayNonce = useProductTourStore(s => s.tourReplayNonce);

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const steps = useMemo(() => buildTourSteps({ isSuperAdmin, can }), [isSuperAdmin, can]);

  useEffect(() => {
    if (!user) {
      setOpen(false);
      return;
    }
    if (tourReplayNonce > 0) {
      setStepIndex(0);
      setOpen(true);
      return;
    }
    let pendingId: string | null = null;
    try {
      pendingId = sessionStorage.getItem(TOUR_PENDING_KEY);
    } catch {
      pendingId = null;
    }
    if (!pendingId || pendingId !== user.id || isTourCompleteForUser(user.id)) return;
    setStepIndex(0);
    setOpen(true);
  }, [user, tourReplayNonce, isTourCompleteForUser]);

  const closeTour = useCallback(
    (finished: boolean) => {
      if (user && finished) {
        markTourFinishedForUser(user.id);
        try {
          sessionStorage.removeItem(TOUR_PENDING_KEY);
        } catch {
          /* ignore */
        }
      }
      setOpen(false);
      setSpotlight(null);
    },
    [user, markTourFinishedForUser]
  );

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const isFirst = stepIndex === 0;

  useLayoutEffect(() => {
    if (!open || !step) return;

    if (step.navigateTo && location.pathname !== step.navigateTo) {
      navigate(step.navigateTo);
    }
  }, [open, step, location.pathname, navigate]);

  useEffect(() => {
    if (!open || !step) return;

    let raf = 0;
    const update = () => {
      if (!step.target) {
        setSpotlight(null);
        setTooltipPos({
          top: Math.max(24, (window.innerHeight - 280) / 2),
          left: Math.max(16, (window.innerWidth - TOOLTIP_W) / 2),
        });
        return;
      }

      const el = document.querySelector(step.target) as HTMLElement | null;
      if (!el) {
        setSpotlight(null);
        setTooltipPos({
          top: Math.max(24, (window.innerHeight - 280) / 2),
          left: Math.max(16, (window.innerWidth - TOOLTIP_W) / 2),
        });
        return;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width < 4 && rect.height < 4) {
        setSpotlight(null);
        setTooltipPos({
          top: Math.max(24, (window.innerHeight - 280) / 2),
          left: Math.max(16, (window.innerWidth - TOOLTIP_W) / 2),
        });
        return;
      }
      const pad = PADDING;
      setSpotlight({
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      });

      const place = step.placement ?? 'bottom';
      const margin = 16;
      let top = rect.bottom + margin;
      let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;

      if (place === 'top') {
        top = rect.top - margin - 200;
      } else if (place === 'right') {
        top = rect.top + rect.height / 2 - 100;
        left = rect.right + margin;
      } else if (place === 'left') {
        top = rect.top + rect.height / 2 - 100;
        left = rect.left - TOOLTIP_W - margin;
      }

      left = Math.min(Math.max(12, left), window.innerWidth - TOOLTIP_W - 12);
      top = Math.min(Math.max(12, top), window.innerHeight - 220);

      setTooltipPos({ top, left });
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    schedule();
    const t = window.setTimeout(schedule, 320);

    const ro = new ResizeObserver(schedule);
    const obsEl = step.target ? document.querySelector(step.target) : null;
    if (obsEl) ro.observe(obsEl as Element);

    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [open, step, stepIndex, location.pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !step || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] font-sans" role="presentation">
      <div className="absolute inset-0 bg-[#0a0a12]/65 backdrop-blur-[2px] motion-safe:animate-[tour-fade-in_0.35s_ease-out]" />

      {spotlight && (
        <div
          className="pointer-events-none absolute motion-safe:animate-[tour-spot_0.45s_cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: 14,
            boxShadow: '0 0 0 9999px rgba(10,10,18,0.72), 0 0 0 2px rgba(129,140,248,0.85), 0 12px 40px -8px rgba(99,102,241,0.45)',
          }}
        />
      )}

      <div
        className={cn(
          'absolute w-[min(100vw-1.5rem,340px)] rounded-2xl border border-white/10 bg-gradient-to-br from-[#14141f] via-[#101018] to-[#0c0c14] p-5 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)]',
          'motion-safe:animate-[tour-card-in_0.45s_cubic-bezier(0.22,1,0.36,1)]'
        )}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-tour-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-300/90">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/25">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200/70">
              Step {stepIndex + 1} / {steps.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => closeTour(true)}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 id="product-tour-title" className="mt-3 font-display text-lg font-semibold tracking-tight text-white">
          {step.title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{step.body}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {steps.map((_, i) => (
            <span
              key={steps[i].id}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                i === stepIndex ? 'w-6 bg-indigo-400' : i < stepIndex ? 'w-1.5 bg-emerald-500/60' : 'w-1.5 bg-zinc-700'
              )}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => closeTour(true)}
            className="text-[12px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors sm:px-1"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex(i => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-semibold text-zinc-200 hover:bg-white/[0.08] transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) closeTour(true);
                else setStepIndex(i => Math.min(steps.length - 1, i + 1));
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-[12px] font-semibold text-white shadow-lg shadow-indigo-950/40 hover:from-indigo-400 hover:to-violet-500 transition-all"
            >
              {isLast ? 'Done' : 'Next'}
              {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

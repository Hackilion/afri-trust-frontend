import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type IlluminatedHeroProps = {
  className?: string;
  /** e.g. pill with icon + label */
  badge?: ReactNode;
  /** Line before the glowing phrase */
  headlinePrefix: string;
  /** Shown with SVG glow filter + gradient pseudo */
  highlightText: string;
  /** Text after the highlight (same heading block) */
  headlineSuffix: string;
  description: ReactNode;
  /** CTAs (links, buttons) */
  children?: ReactNode;
};

/**
 * shadcn-style placement: reusable UI primitive under `src/components/ui`.
 * Uses global keyframes `.illuminated-hero` helpers in `src/index.css`.
 */
export function IlluminatedHero({
  className,
  badge,
  headlinePrefix,
  highlightText,
  headlineSuffix,
  description,
  children,
}: IlluminatedHeroProps) {
  const rawId = useId();
  const filterId = `illuminated-glow-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div
      className={cn(
        'illuminated-hero relative flex w-full min-h-[85vh] flex-col flex-wrap items-center justify-center overflow-hidden bg-black px-4 py-16 text-white',
        'text-[length:clamp(0.875rem,2.2vw,1.125rem)] [--factor:min(1000px,100vh)] [--size:min(var(--factor),100vw)]',
        className
      )}
    >
      <div className="bg pointer-events-none absolute inset-0 flex h-full w-full max-w-[44em] justify-center">
        <div className="shadow-bgt absolute size-full translate-y-[-70%] scale-[1.2] rounded-[100em] opacity-60" />
        <div className="shadow-bgb absolute size-full translate-y-[70%] scale-[1.2] rounded-[100em] opacity-60" />
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        {badge ? <div className="mb-8">{badge}</div> : null}

        <h1
          className="font-display text-[clamp(1.85rem,5.2vw,3.65rem)] font-semibold leading-[1.12] tracking-tight"
          aria-label={`${headlinePrefix} ${highlightText} ${headlineSuffix}`}
        >
          <span className="block">{headlinePrefix}</span>
          <span className="block mt-1">
            <span
              className={cn(
                'relative inline-block text-[#fffaf6]',
                'before:absolute before:animate-[onloadopacity_1s_ease-out_forwards] before:opacity-0 before:content-[attr(data-text)]',
                'before:bg-[linear-gradient(0deg,#dfe5ee_0%,#fffaf6_50%)] before:bg-clip-text before:text-transparent'
              )}
              style={{ filter: `url(#${filterId})` }}
              data-text={highlightText}
            >
              {highlightText}
            </span>
          </span>
          <span className="mt-2 block text-[clamp(1.1rem,3.2vw,1.65rem)] font-medium text-[#c5c5d8]">
            {headlineSuffix}
          </span>
        </h1>

        <div className="mt-10 max-w-2xl bg-gradient-to-t from-[#86868b] to-[#bdc2c9] bg-clip-text text-center text-lg font-medium text-transparent sm:text-xl">
          {description}
        </div>

        {children ? <div className="mt-10 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
      </div>

      <svg
        className="pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden"
        width="1440"
        height="300"
        viewBox="0 0 1440 300"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="-50%"
            y="-200%"
            width="200%"
            height="500%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur4" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="19" result="blur19" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur9" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur30" />
            <feColorMatrix
              in="blur4"
              result="color-0-blur"
              type="matrix"
              values="1 0 0 0 0
                      0 0.9803921568627451 0 0 0
                      0 0 0.9647058823529412 0 0
                      0 0 0 0.8 0"
            />
            <feOffset in="color-0-blur" result="layer-0-offsetted" dx="0" dy="0" />
            <feColorMatrix
              in="blur19"
              result="color-1-blur"
              type="matrix"
              values="0.8156862745098039 0 0 0 0
                      0 0.49411764705882355 0 0 0
                      0 0 0.2627450980392157 0 0
                      0 0 0 1 0"
            />
            <feOffset in="color-1-blur" result="layer-1-offsetted" dx="0" dy="2" />
            <feColorMatrix
              in="blur9"
              result="color-2-blur"
              type="matrix"
              values="1 0 0 0 0
                      0 0.6666666666666666 0 0 0
                      0 0 0.36470588235294116 0 0
                      0 0 0 0.65 0"
            />
            <feOffset in="color-2-blur" result="layer-2-offsetted" dx="0" dy="2" />
            <feColorMatrix
              in="blur30"
              result="color-3-blur"
              type="matrix"
              values="1 0 0 0 0
                      0 0.611764705882353 0 0 0
                      0 0 0.39215686274509803 0 0
                      0 0 0 1 0"
            />
            <feOffset in="color-3-blur" result="layer-3-offsetted" dx="0" dy="2" />
            <feColorMatrix
              in="blur30"
              result="color-4-blur"
              type="matrix"
              values="0.4549019607843137 0 0 0 0
                      0 0.16470588235294117 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
            />
            <feOffset in="color-4-blur" result="layer-4-offsetted" dx="0" dy="16" />
            <feColorMatrix
              in="blur30"
              result="color-5-blur"
              type="matrix"
              values="0.4235294117647059 0 0 0 0
                      0 0.19607843137254902 0 0 0
                      0 0 0.11372549019607843 0 0
                      0 0 0 1 0"
            />
            <feOffset in="color-5-blur" result="layer-5-offsetted" dx="0" dy="64" />
            <feColorMatrix
              in="blur30"
              result="color-6-blur"
              type="matrix"
              values="0.21176470588235294 0 0 0 0
                      0 0.10980392156862745 0 0 0
                      0 0 0.07450980392156863 0 0
                      0 0 0 1 0"
            />
            <feOffset in="color-6-blur" result="layer-6-offsetted" dx="0" dy="64" />
            <feColorMatrix
              in="blur30"
              result="color-7-blur"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.68 0"
            />
            <feOffset in="color-7-blur" result="layer-7-offsetted" dx="0" dy="64" />
            <feMerge>
              <feMergeNode in="layer-0-offsetted" />
              <feMergeNode in="layer-1-offsetted" />
              <feMergeNode in="layer-2-offsetted" />
              <feMergeNode in="layer-3-offsetted" />
              <feMergeNode in="layer-4-offsetted" />
              <feMergeNode in="layer-5-offsetted" />
              <feMergeNode in="layer-6-offsetted" />
              <feMergeNode in="layer-7-offsetted" />
              <feMergeNode in="layer-0-offsetted" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0c0c12] to-transparent" />
    </div>
  );
}

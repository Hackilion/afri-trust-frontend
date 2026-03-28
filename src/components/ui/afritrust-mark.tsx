import { useId } from 'react';

import { cn } from '../../lib/utils';

type AfriTrustMarkProps = {
  className?: string;
  /** Larger hero orb (Assistant); compact for sidebar / headers */
  variant?: 'hero' | 'icon';
};

/**
 * AfriTrust product mark — indigo/violet gradient orb with subtle texture.
 * Safe to mount multiple times on the page (unique SVG ids via `useId`).
 */
export function AfriTrustMark({ className, variant = 'icon' }: AfriTrustMarkProps) {
  const uid = useId().replace(/:/g, '');
  const p = `atm-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 200 200"
      className={cn(variant === 'hero' ? 'h-full w-full' : 'h-full w-full', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${p}-brand-surface`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="45%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id={`${p}-shine`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <filter
          id={`${p}-blur`}
          width="385"
          height="410"
          x="-75"
          y="-104"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="40" />
        </filter>
        <filter
          id={`${p}-noise`}
          width="100%"
          height="100%"
          x="0%"
          y="0%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence baseFrequency="0.55" numOctaves="3" result="noise" seed="4" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0.35 0 0 0 0.42
                    0 0.32 0 0 0.36
                    0 0 0.38 0 0.48
                    0 0 0 0.14 0"
            result="grain"
          />
          <feBlend in="grain" in2="SourceGraphic" mode="soft-light" />
        </filter>
        <clipPath id={`${p}-clip`}>
          <path fill="#fff" d="M0 0H200V200H0z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${p}-clip)`}>
        <mask
          id={`${p}-mask`}
          style={{ maskType: 'alpha' }}
          width="200"
          height="200"
          x="0"
          y="0"
          maskUnits="userSpaceOnUse"
        >
          <path
            fill="#fff"
            fillRule="evenodd"
            d="M100 150c27.614 0 50-22.386 50-50s-22.386-50-50-50-50 22.386-50 50 22.386 50 50 50zm0 50c55.228 0 100-44.772 100-100S155.228 0 100 0 0 44.772 0 100s44.772 100 100 100z"
            clipRule="evenodd"
          />
        </mask>

        <g mask={`url(#${p}-mask)`}>
          <path fill="#f8fafc" d="M200 0H0v200h200V0z" />
          <path
            fill={`url(#${p}-brand-surface)`}
            fillOpacity={0.92}
            d="M200 0H0v200h200V0z"
          />
          <path fill={`url(#${p}-shine)`} d="M200 0H0v200h200V0z" />
          <g filter={`url(#${p}-blur)`} className="assistant-orb-gradient-spin">
            <path fill="#6366f1" d="M110 32H18v68h92V32z" />
            <path fill="#5b21b6" d="M188-24H15v98h173v-98z" />
            <path fill="#4f46e5" d="M175 70H5v156h170V70z" />
            <path fill="#3b82f6" d="M230 51H100v103h130V51z" />
          </g>
        </g>

        <g mask={`url(#${p}-mask)`} style={{ mixBlendMode: 'multiply' }} opacity={0.35}>
          <path
            fill={`url(#${p}-brand-surface)`}
            d="M200 0H0v200h200V0z"
            filter={`url(#${p}-noise)`}
          />
        </g>

        {/* Letter mark — reads as “A” at any size */}
        <g mask={`url(#${p}-mask)`}>
          <text
            x="100"
            y="124"
            textAnchor="middle"
            fill="white"
            fillOpacity={0.92}
            className="font-display"
            style={{
              fontSize: variant === 'hero' ? 72 : 68,
              fontWeight: 700,
              letterSpacing: '-0.05em',
            }}
          >
            A
          </text>
        </g>
      </g>
    </svg>
  );
}

/** Assistant hero: spaced orb above headline */
export function AssistantOrbLogo({ className = '' }: { className?: string }) {
  return (
    <div className={cn('mb-8 h-20 w-20', className)}>
      <AfriTrustMark variant="hero" />
    </div>
  );
}

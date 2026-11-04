import React from 'react';

export interface AegisBrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'mark';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { icon: 28, text: 'text-sm', sub: 'text-[8px]', gap: 'gap-2' },
  md: { icon: 36, text: 'text-base', sub: 'text-[9px]', gap: 'gap-2.5' },
  lg: { icon: 44, text: 'text-xl', sub: 'text-[10px]', gap: 'gap-3' },
  xl: { icon: 56, text: 'text-2xl', sub: 'text-xs', gap: 'gap-3.5' }
};

export const AegisBrandLogo: React.FC<AegisBrandLogoProps> = ({
  size = 'md',
  variant = 'compact',
  showTagline = false,
  className = '',
  onClick
}) => {
  const currentSize = SIZE_MAP[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${currentSize.gap} ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* ─── SOVEREIGN SHIELD VECTOR ICON ─── */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{ width: currentSize.icon, height: currentSize.icon }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_12px_rgba(6,182,212,0.35)]"
        >
          <defs>
            <linearGradient id="shield-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#22D3EE" />
              <stop offset="50%" stop-color="#3B82F6" />
              <stop offset="100%" stop-color="#8B5CF6" />
            </linearGradient>
            <linearGradient id="shield-core" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="60%" stop-color="#38BDF8" />
              <stop offset="100%" stop-color="#0284C7" />
            </linearGradient>
          </defs>

          {/* Outer Sovereign Shield */}
          <path
            d="M 50 6 L 88 22 C 88 54 74 78 50 94 C 26 78 12 54 12 22 Z"
            fill="#090D1A"
            stroke="url(#shield-stroke)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Protective Mantle */}
          <path
            d="M 50 13 L 81 27 C 81 52 69 73 50 86 C 31 73 19 52 19 27 Z"
            fill="#0F172A"
            fillOpacity="0.85"
            stroke="url(#shield-stroke)"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />

          {/* Left Facet Shade */}
          <path
            d="M 50 13 L 19 27 C 19 52 31 73 50 86 Z"
            fill="#0284C7"
            fillOpacity="0.14"
          />

          {/* Ascending Alpha Chevron */}
          <path
            d="M 50 24 L 72 64 L 61 64 L 50 42 L 39 64 L 28 64 Z"
            fill="url(#shield-stroke)"
          />

          {/* Quantum Verification Prism */}
          <path
            d="M 50 34 L 60 49 L 50 64 L 40 49 Z"
            fill="url(#shield-core)"
          />
          <circle cx="50" cy="49" r="3" fill="#FFFFFF" />
        </svg>
      </div>

      {/* ─── TYPOGRAPHY WORDMARK ─── */}
      {variant !== 'mark' && (
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-tight ${currentSize.text} flex items-center gap-1.5`}>
            <span className="text-white">AEGIS</span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              GLOBAL
            </span>
          </div>

          {(variant === 'full' || showTagline) && (
            <span className={`text-slate-400 font-bold uppercase tracking-wider mt-0.5 ${currentSize.sub}`}>
              Cognitive Infrastructure
            </span>
          )}
        </div>
      )}
    </div>
  );
};


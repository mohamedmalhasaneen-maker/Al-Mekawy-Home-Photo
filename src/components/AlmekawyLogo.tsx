import React from 'react';

interface AlmekawyLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'transparent';
}

export const AlmekawyLogo: React.FC<AlmekawyLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  variant = 'transparent',
}) => {
  // Determine dimensions based on size
  const dimensions = {
    sm: { box: 'w-10 h-10 p-1', icon: 'w-8 h-8', textTitle: 'text-sm', textSub: 'text-[7px]' },
    md: { box: 'w-12 h-12 p-1.5', icon: 'w-9 h-9', textTitle: 'text-base', textSub: 'text-[9px]' },
    lg: { box: 'w-16 h-16 p-2', icon: 'w-12 h-12', textTitle: 'text-xl', textSub: 'text-xs' },
    xl: { box: 'w-32 h-32 p-4', icon: 'w-24 h-24', textTitle: 'text-3xl', textSub: 'text-sm' },
  }[size];

  // Colors based on variant
  // Variant 'dark' matches the rich deep navy of the original logo (#061224)
  const bgStyle = {
    dark: 'bg-[#061224] rounded-xl border border-slate-800 shadow-lg',
    light: 'bg-slate-50 rounded-xl border border-slate-200',
    transparent: '',
  }[variant];

  return (
    <div className={`flex items-center gap-3 ${className}`} id="almekawy-logo-container">
      {/* Golden Icon Symbol inside Navy Box */}
      <div className={`flex items-center justify-center ${bgStyle} ${dimensions.box}`} id="almekawy-logo-symbol-box">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${dimensions.icon} filter drop-shadow-[0_2px_4px_rgba(191,149,63,0.3)]`}
          id="almekawy-logo-svg"
        >
          <defs>
            <linearGradient id="almekawyGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bf953f" />
              <stop offset="25%" stopColor="#fcf6ba" />
              <stop offset="50%" stopColor="#b38728" />
              <stop offset="75%" stopColor="#fbf5b7" />
              <stop offset="100%" stopColor="#aa771c" />
            </linearGradient>
          </defs>

          {/* Outer Border: open at bottom */}
          <path
            d="M 16 88 V 12 H 84 V 88"
            stroke="url(#almekawyGoldGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Inner House Pentagram */}
          <path
            d="M 28 82 V 48 L 50 24 L 72 48 V 82 Z"
            stroke="url(#almekawyGoldGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Window inside the house */}
          <path
            d="M 40 82 V 58 A 10 10 0 0 1 60 58 V 82 Z"
            stroke="url(#almekawyGoldGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Window dividing lines */}
          <path
            d="M 40 68 H 60 M 50 48 V 82"
            stroke="url(#almekawyGoldGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Text Styling matching the elegant serif branding */}
      {showText && (
        <div className="flex flex-col text-right font-serif" id="almekawy-logo-text-box">
          <h1 className="font-extrabold tracking-wider leading-none text-[#b38728] flex items-center gap-1" id="almekawy-logo-title">
            <span className={`${dimensions.textTitle} bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#aa771c] bg-clip-text text-transparent`}>
              ALMEKAWY
            </span>
          </h1>
          <p className={`font-semibold tracking-[0.25em] text-[#bf953f]/80 leading-none ${dimensions.textSub} mt-1`} id="almekawy-logo-sub">
            HOME
          </p>
        </div>
      )}
    </div>
  );
};

import React, { memo } from 'react';

/**
 * High-performance, lightweight decorative falling autumn leaves
 * Tones: muted brown, faded rust, subtle dark red, muted golden-brown
 * Lightweight CSS transforms, hardware-accelerated, pointer-events: none
 */
const FallingLeaves: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-85"
    >
      {/* Leaf 1: Muted Rust Maple Leaf (Left-Center) */}
      <div
        className="absolute animate-leaf-fall-1"
        style={{
          left: '7%',
          top: '-15%',
          animationDelay: '0s',
          animationDuration: '12s',
        }}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-[#9a4436] opacity-80 transform -rotate-12"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2c-.3 1.2-1.1 2.2-2.1 2.8-.8.5-1.8.6-2.7.4.4 1 .3 2.2-.3 3.1-.6.9-1.6 1.4-2.6 1.5.8.9 1.1 2.1.8 3.3-.3 1.1-1.1 2.1-2.1 2.7 1.2.3 2.2 1.1 2.8 2.1.5.8.6 1.8.4 2.7 1-.4 2.2-.3 3.1.3.9.6 1.4 1.6 1.5 2.6.9-.8 2.1-1.1 3.3-.8 1.1.3 2.1 1.1 2.7 2.1.3-1.2 1.1-2.2 2.1-2.8.8-.5 1.8-.6 2.7-.4-.4-1-.3-2.2.3-3.1.6-.9 1.6-1.4 2.6-1.5-.8-.9-1.1-2.1-.8-3.3.3-1.1 1.1-2.1 2.1-2.7-1.2-.3-2.2-1.1-2.8-2.1-.5-.8-.6-1.8-.4-2.7-1 .4-2.2.3-3.1-.3-.9-.6-1.4-1.6-1.5-2.6-.9.8-2.1 1.1-3.3.8-1.1-.3-2.1-1.1-2.7-2.1z" />
          <path
            d="M12 2v20M8 8l4 4 4-4M6 14l6 2 6-2"
            stroke="#63261c"
            strokeWidth="0.75"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Leaf 2: Muted Golden-Brown Oak Leaf (Right-Top) */}
      <div
        className="absolute animate-leaf-fall-2"
        style={{
          left: '82%',
          top: '-18%',
          animationDelay: '2.5s',
          animationDuration: '14.5s',
        }}
      >
        <svg
          className="w-4 h-5 sm:w-5 sm:h-6 text-[#ad782b] opacity-70 transform rotate-45"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C9.5 4.5 9 7 9.5 9.5 8 9.5 6.5 10.5 6 12c1 1.5 1 3 0 4.5 1.5.5 2.5 2 2.5 3.5 1.5-1 3.5-.5 5 0 .5-1.5 2-2.5 3.5-2.5-1-1.5-1-3 0-4.5-.5-1.5-2-2.5-3.5-2.5.5-2.5 0-5-2.5-7.5z" />
          <path
            d="M12 2v20M9.5 9.5L12 11l2.5-1.5M7 14.5L12 16l5-1.5"
            stroke="#704b16"
            strokeWidth="0.75"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Leaf 3: Subtle Dark Wine/Red Botanical Leaf (Center-Left) */}
      <div
        className="absolute animate-leaf-fall-3"
        style={{
          left: '28%',
          top: '-12%',
          animationDelay: '5s',
          animationDuration: '15.5s',
        }}
      >
        <svg
          className="w-3.5 h-4.5 sm:w-4.5 sm:h-5.5 text-[#732932] opacity-75 transform rotate-18"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3C7 6 6 11 8 16c1.5 3.5 4 5.5 4 5.5s2.5-2 4-5.5c2-5 1-10-4-13.5z" />
          <path
            d="M12 3v18.5M9.5 10L12 12l2.5-2M9 14.5L12 16l3-1.5"
            stroke="#47141b"
            strokeWidth="0.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Leaf 4: Faded Terracotta / Rust Leaf (Right-Center) */}
      <div
        className="absolute animate-leaf-fall-1"
        style={{
          left: '65%',
          top: '-14%',
          animationDelay: '7.5s',
          animationDuration: '13.5s',
        }}
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 text-[#b25740] opacity-65 transform -rotate-30"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2c-.4 1.5-1.3 2.7-2.6 3.4-1 .6-2.2.7-3.3.5.5 1.2.4 2.7-.4 3.8-.7 1.1-2 1.7-3.2 1.8 1 1.1 1.4 2.6 1 4.1-.4 1.4-1.4 2.6-2.6 3.3 1.5.4 2.7 1.4 3.4 2.6.6 1 .7 2.2.5 3.3 1.2-.5 2.7-.4 3.8.4 1.1.7 1.7 2 1.8 3.2 1.1-1 2.6-1.4 4.1-1 1.4.4 2.6 1.4 3.3 2.6.4-1.5 1.4-2.7 2.6-3.4 1-.6 2.2-.7 3.3-.5-.5-1.2-.4-2.7.4-3.8.7-1.1 2-1.7 3.2-1.8-1-1.1-1.4-2.6-1-4.1.4-1.4 1.4-2.6 2.6-3.3-1.5-.4-2.7-1.4-3.4-2.6-.6-1-.7-2.2-.5-3.3-1.2.5-2.7.4-3.8-.4-1.1-.7-1.7-2-1.8-3.2-1.1 1-2.6 1.4-4.1 1-1.4-.4-2.6-1.4-3.3-2.6z" />
          <path
            d="M12 2v20M8 8l4 4 4-4"
            stroke="#752e1e"
            strokeWidth="0.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Leaf 5: Muted Warm Sepia Leaf (Center-Right drift) */}
      <div
        className="absolute animate-leaf-fall-2"
        style={{
          left: '46%',
          top: '-16%',
          animationDelay: '10s',
          animationDuration: '16s',
        }}
      >
        <svg
          className="w-3.5 h-4 sm:w-4.5 sm:h-5 text-[#8c5737] opacity-70 transform rotate-60"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C8 5 7 10 9 15c1.2 3 3.5 5 3.5 5s2.3-2 3.5-5c2-5 1-10-3-13z" />
          <path
            d="M12 2v18M10 9l2 2 2-2M9.5 13.5l2.5 2 2.5-2"
            stroke="#54311c"
            strokeWidth="0.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
};

export const HeroBrandWordmark: React.FC = memo(() => {
  return (
    <div className="relative w-full max-w-2xl my-2.5 select-none" role="banner">
      {/* SVG Ink Bleed Filter for authentic organic brush dynamics */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="ink-bleed-texture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.0"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="0.25" result="blurred" />
            <feMerge>
              <feMergeNode in="displaced" />
              <feMergeNode in="SourceGraphic" opacity="0.9" />
            </feMerge>
          </filter>

          <linearGradient id="deep-ink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#08080a" />
            <stop offset="30%" stopColor="#111116" />
            <stop offset="70%" stopColor="#0a0a0d" />
            <stop offset="100%" stopColor="#18181f" />
          </linearGradient>
        </defs>
      </svg>

      {/* Archival Dossier Document Parchment Backing Card */}
      <div className="relative rounded-sm bg-gradient-to-b from-[#faf6ee] via-[#f4ede1] to-[#ebe2d0] border border-[#d6c7ae] shadow-lg shadow-black/35 p-4 sm:p-6 sm:py-5 overflow-hidden transition-all group">
        {/* Subtle Archival Deckle Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#b89f78]/70 to-transparent" />
        
        {/* Background Archival Seal / Stamp Watermark */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border border-[#d6c7ae]/60 pointer-events-none opacity-40" />
        <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full border border-[#d6c7ae]/40 pointer-events-none opacity-30" />
        
        {/* Archival Catalog Number Stamp */}
        <div className="absolute top-2.5 right-3.5 hidden sm:flex items-center gap-1.5 opacity-60 font-mono text-[9px] uppercase tracking-widest text-[#786c57] select-none pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9a4436]" />
          <span>INVESTIGATIVE ARCHIVE // CODEX NO. 01</span>
        </div>

        {/* Decorative Falling Leaves in Restrained Autumn Tones */}
        <FallingLeaves />

        {/* Content Container: Primary Calligraphy Wordmark + Understated Subtitle */}
        <div className="relative z-10 flex flex-col items-center sm:items-start">
          {/* Main Hand-Painted Black Brush-Calligraphy Wordmark */}
          <div className="relative py-1 w-full max-w-lg">
            <svg
              viewBox="0 0 540 100"
              className="w-full h-auto max-h-24 sm:max-h-28 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
              style={{ filter: 'url(#ink-bleed-texture)' }}
              aria-label="TheLegendsWiki"
              role="img"
            >
              {/* Hand-brushed ink underlay stroke */}
              <path
                d="M16 88 Q 140 93, 270 89 T 524 85"
                stroke="#121318"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.28"
              />
              <path
                d="M32 90 Q 200 95, 390 91 T 512 87"
                stroke="#9a4436"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.22"
              />

              {/* Hand-painted Calligraphy Glyphs */}
              <text
                x="8"
                y="72"
                className="font-handwritten font-bold tracking-tight"
                style={{
                  fontFamily: '"Caveat", "Brush Script MT", cursive, serif',
                  fontSize: '84px',
                  fontWeight: 700,
                  letterSpacing: '-1.5px',
                  fill: 'url(#deep-ink-gradient)',
                }}
              >
                TheLegends
                <tspan
                  style={{
                    fontFamily: '"Caveat", "Brush Script MT", cursive, serif',
                    fontWeight: 700,
                    fill: '#08080a',
                  }}
                >
                  Wiki
                </tspan>
              </text>

              {/* Organic ink splatter nuance */}
              <circle cx="516" cy="36" r="1.4" fill="#08080a" opacity="0.65" />
              <circle cx="526" cy="42" r="0.9" fill="#08080a" opacity="0.5" />
              <circle cx="24" cy="20" r="1.1" fill="#08080a" opacity="0.55" />
              <circle cx="272" cy="85" r="1.2" fill="#08080a" opacity="0.45" />
            </svg>
          </div>

          {/* Secondary Tagline: The Open Knowledge Project */}
          <div className="flex items-center gap-2.5 mt-0.5 sm:pl-2">
            <span className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent via-[#8c7b64] to-transparent opacity-60" />
            <h2 className="text-[11px] sm:text-xs font-serif uppercase tracking-[0.24em] font-medium text-[#5c5243] drop-shadow-xs">
              The Open Knowledge Project
            </h2>
            <span className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent via-[#8c7b64] to-transparent opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
});

HeroBrandWordmark.displayName = 'HeroBrandWordmark';

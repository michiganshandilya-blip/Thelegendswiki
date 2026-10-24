import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Unlock } from 'lucide-react';

interface DossierProgressIndicatorProps {
  articleTitle?: string;
  classificationLevel?: string;
}

export const DossierProgressIndicator: React.FC<DossierProgressIndicatorProps> = ({
  articleTitle,
  classificationLevel = 'CONFIDENTIAL // DECLASSIFIED',
}) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const currentScroll = window.scrollY;
            const progress = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
            setScrollProgress(progress);
          } else {
            setScrollProgress(0);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const getStatusLabel = () => {
    if (scrollProgress >= 98) {
      return 'STATUS: 100% UNREDACTED';
    }
    if (scrollProgress >= 66) {
      return `DECLASSIFYING: ${Math.round(scrollProgress)}% PROCESSED`;
    }
    if (scrollProgress >= 33) {
      return `ANALYZING EVIDENCE: ${Math.round(scrollProgress)}%`;
    }
    return `DECLASSIFYING DOSSIER: ${Math.round(scrollProgress)}%`;
  };

  const getStatusColor = () => {
    if (scrollProgress >= 98) return 'text-emerald-700 border-emerald-300 bg-emerald-50';
    if (scrollProgress >= 50) return 'text-amber-800 border-amber-300 bg-amber-50';
    return 'text-slate-700 border-slate-300 bg-slate-50';
  };

  const progressStripContent = (
    <div
      role="progressbar"
      aria-valuenow={Math.round(scrollProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Dossier reading progress: ${Math.round(scrollProgress)}%`}
      className="fixed top-14 left-0 right-0 z-30 w-full bg-white border-b border-slate-200 shadow-xs transition-all duration-150 select-none no-print overflow-hidden"
    >
      {/* Top Laser / Bar Track */}
      <div className="relative h-1 w-full bg-slate-100 overflow-hidden">
        {/* Fill Bar with stamp-style gradient */}
        <div
          className={`h-full transition-all duration-75 ease-out ${
            scrollProgress >= 98
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              : scrollProgress >= 50
              ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700'
              : 'bg-gradient-to-r from-slate-700 to-amber-800'
          }`}
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Scanning Glint Head */}
        {scrollProgress > 0 && scrollProgress < 98 && (
          <div
            className="absolute top-0 bottom-0 w-3 bg-white/80 blur-[1px] -translate-x-full transition-all duration-75 pointer-events-none"
            style={{ left: `${scrollProgress}%` }}
          />
        )}
      </div>

      {/* Subtle Archival Meta Strip */}
      <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-between text-[11px] font-mono">
        {/* Left: Clearance & Document Progression Status */}
        <div className="flex items-center gap-2 text-slate-600">
          <div className="flex items-center gap-1">
            {scrollProgress >= 98 ? (
              <Unlock size={12} className="text-emerald-600 animate-pulse" />
            ) : (
              <Lock size={12} className="text-amber-700" />
            )}
            <span className="font-semibold tracking-wider text-slate-800 uppercase hidden sm:inline">
              DOSSIER PROGRESS
            </span>
          </div>

          <span className="text-slate-300">|</span>

          {/* Dynamic Status Badge */}
          <span
            className={`px-1.5 py-0.5 rounded-xs border text-[10px] tracking-wide font-bold transition-colors ${getStatusColor()}`}
          >
            {getStatusLabel()}
          </span>

          {/* Progress Percent Bar Pill for Mobile */}
          <span className="text-slate-500 font-mono text-[10px] sm:hidden">
            {Math.round(scrollProgress)}%
          </span>
        </div>

        {/* Right: Security Marker */}
        <div className="flex items-center gap-2 text-slate-500 text-[10px]">
          {articleTitle && (
            <span className="hidden md:inline truncate max-w-xs text-slate-600 italic">
              "{articleTitle}"
            </span>
          )}
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xs font-mono font-bold tracking-widest uppercase">
            {scrollProgress >= 98 ? 'UNREDACTED' : 'RESTRICTED'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* In-flow spacer preventing any layout shift or content clipping */}
      <div className="h-9 w-full shrink-0 no-print" aria-hidden="true" />

      {/* Permanently fixed dossier progress strip attached directly to document body */}
      {mounted && typeof document !== 'undefined'
        ? createPortal(progressStripContent, document.body)
        : null}
    </>
  );
};

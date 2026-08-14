import React from 'react';
import { ArticleInfobox as InfoboxType } from '../../types';
import { Info } from 'lucide-react';

interface ArticleInfoboxProps {
  infobox: InfoboxType;
  className?: string;
}

export const ArticleInfobox: React.FC<ArticleInfoboxProps> = ({
  infobox,
  className = '',
}) => {
  const getTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'person':
        return 'bg-sky-950/80 text-sky-300 border-sky-800/60';
      case 'place':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'science':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'event':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'technology':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60';
      case 'organization':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60';
      default:
        return 'bg-[#141c2e] text-slate-300 border-[#1e293b]';
    }
  };

  return (
    <aside
      id="article-infobox-container"
      aria-label={`${infobox.title} Quick Reference Facts`}
      className={`w-full bg-[#0e1422] border border-[#1e293b] rounded-sm overflow-hidden text-xs font-sans ${className}`}
    >
      {/* Infobox Header */}
      <div className="bg-[#141c2e] border-b border-[#1e293b] p-3 text-center">
        {infobox.articleType && (
          <span
            className={`inline-block text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm border mb-1.5 ${getTypeBadgeColor(
              infobox.articleType
            )}`}
          >
            {infobox.articleType}
          </span>
        )}
        <h2 className="font-display text-base font-bold text-slate-100 leading-snug">
          {infobox.title}
        </h2>
        {infobox.subtitle && (
          <p className="text-[11px] text-slate-400 font-medium italic mt-0.5">
            {infobox.subtitle}
          </p>
        )}
      </div>

      {/* Infobox Media / Image with Caption & Credit */}
      {infobox.image && (
        <figure className="p-3 pb-2 bg-[#0e1422] border-b border-[#1e293b] text-center m-0">
          <div className="bg-[#141c2e] border border-[#1e293b] rounded-sm overflow-hidden flex items-center justify-center max-h-56">
            <img
              src={infobox.image}
              alt={infobox.imageAlt || infobox.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover max-h-56 opacity-90"
            />
          </div>
          {(infobox.imageCaption || infobox.imageCredit) && (
            <figcaption className="mt-2 text-[11px] text-slate-400 leading-tight">
              {infobox.imageCaption && <span>{infobox.imageCaption}</span>}
              {infobox.imageCredit && (
                <span className="block text-[10px] text-slate-500 mt-0.5 font-mono">
                  Source: {infobox.imageCredit}
                </span>
              )}
            </figcaption>
          )}
        </figure>
      )}

      {/* Dynamic Key-Value Details */}
      <div className="divide-y divide-[#1e293b]">
        <div className="bg-[#141c2e]/60 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
          <Info size={11} className="text-sky-400" />
          <span>Quick Overview</span>
        </div>

        {infobox.details.map((detail, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row py-2 px-3 hover:bg-[#141c2e] transition-colors gap-1 sm:gap-2 leading-relaxed"
          >
            <div className="sm:w-1/3 font-semibold text-slate-400 shrink-0 text-[11px]">
              {detail.label}
            </div>
            <div className="sm:w-2/3 text-slate-200 text-[11px] break-words">
              {detail.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer Note */}
      <div className="p-2 bg-[#141c2e]/40 border-t border-[#1e293b] text-[10px] text-slate-500 text-center font-mono">
        TheLegendsWiki Structured Fact Sheet
      </div>
    </aside>
  );
};


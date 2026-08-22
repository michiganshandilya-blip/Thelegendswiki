import React from 'react';
import { ArticleInfobox as InfoboxType } from '../../types';
import { OptimizedImage } from '../common/OptimizedImage';
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
        return 'bg-blue-50 text-[#3366cc] border-blue-200';
      case 'place':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'science':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'event':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'technology':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'organization':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-[#f8f9fa] text-[#54595d] border-[#eaecf0]';
    }
  };

  return (
    <aside
      id="article-infobox-container"
      aria-label={`${infobox.title} Quick Reference Facts`}
      className={`w-full bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm overflow-hidden text-xs font-sans shadow-xs ${className}`}
    >
      {/* Infobox Header */}
      <div className="bg-[#eaecf0] border-b border-[#a2a9b1] p-2.5 text-center">
        {infobox.articleType && (
          <span
            className={`inline-block text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm border mb-1 ${getTypeBadgeColor(
              infobox.articleType
            )}`}
          >
            {infobox.articleType}
          </span>
        )}
        <h2 className="font-serif text-base font-bold text-[#101418] leading-snug">
          {infobox.title}
        </h2>
        {infobox.subtitle && (
          <p className="text-[11px] text-[#54595d] font-medium italic mt-0.5">
            {infobox.subtitle}
          </p>
        )}
      </div>

      {/* Infobox Media / Image with Caption & Credit */}
      {infobox.image && (
        <figure className="p-2.5 pb-2 bg-[#ffffff] border-b border-[#eaecf0] text-center m-0">
          <div className="bg-[#f8f9fa] border border-[#eaecf0] rounded-xs overflow-hidden flex items-center justify-center max-h-56">
            <OptimizedImage
              src={infobox.image}
              alt={infobox.imageAlt || infobox.title}
              containerClassName="w-full max-h-56"
              className="w-full h-auto object-cover max-h-56"
            />
          </div>
          {(infobox.imageCaption || infobox.imageCredit) && (
            <figcaption className="mt-1.5 text-[11px] text-[#54595d] leading-tight">
              {infobox.imageCaption && <span>{infobox.imageCaption}</span>}
              {infobox.imageCredit && (
                <span className="block text-[10px] text-[#72777d] mt-0.5 font-mono">
                  Source: {infobox.imageCredit}
                </span>
              )}
            </figcaption>
          )}
        </figure>
      )}

      {/* Dynamic Key-Value Details */}
      <div className="divide-y divide-[#eaecf0] bg-[#ffffff]">
        <div className="bg-[#f8f9fa] px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#54595d] flex items-center gap-1">
          <Info size={11} className="text-[#3366cc]" />
          <span>Quick Overview</span>
        </div>

        {infobox.details.map((detail, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row py-1.5 px-3 hover:bg-[#f8f9fa] transition-colors gap-1 sm:gap-2 leading-relaxed"
          >
            <div className="sm:w-1/3 font-semibold text-[#54595d] shrink-0 text-[11px]">
              {detail.label}
            </div>
            <div className="sm:w-2/3 text-[#101418] text-[11px] break-words">
              {detail.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer Note */}
      <div className="p-2 bg-[#f8f9fa] border-t border-[#eaecf0] text-[10px] text-[#72777d] text-center font-mono">
        TheLegendsWiki Structured Fact Sheet
      </div>
    </aside>
  );
};

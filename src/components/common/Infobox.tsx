import React from 'react';
import { ArticleInfobox } from '../../types';

interface InfoboxProps {
  infobox: ArticleInfobox;
  className?: string;
}

export const Infobox: React.FC<InfoboxProps> = ({ infobox, className = '' }) => {
  return (
    <aside
      aria-label="Summary Infobox"
      className={`w-full md:w-72 lg:w-80 bg-[#0e1422] border border-slate-800 rounded-sm text-xs text-slate-300 shrink-0 md:float-right md:ml-6 md:mb-6 mb-6 overflow-hidden shadow-xl shadow-black/40 ${className}`}
    >
      <div className="bg-[#141c2e] border-b border-slate-800 px-3.5 py-2.5 text-center">
        <h4 className="font-display text-sm font-bold text-slate-100">
          {infobox.title}
        </h4>
        {infobox.subtitle && (
          <p className="text-[11px] text-sky-400 font-mono italic mt-0.5">
            {infobox.subtitle}
          </p>
        )}
      </div>

      {infobox.image && (
        <div className="p-3 bg-[#080c14] border-b border-slate-800 text-center">
          <img
            src={infobox.image}
            alt={infobox.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-48 object-cover rounded-sm mx-auto border border-slate-800"
          />
          {infobox.imageCaption && (
            <p className="text-[11px] text-slate-400 italic mt-1.5 leading-snug">
              {infobox.imageCaption}
            </p>
          )}
        </div>
      )}

      <div className="divide-y divide-slate-800/80 bg-[#0e1422]">
        {infobox.details.map((detail, idx) => (
          <div key={idx} className="grid grid-cols-12 px-3 py-2 hover:bg-[#141c2e]/60 transition-colors">
            <span className="col-span-5 font-medium text-slate-400 pr-2 text-[11px]">
              {detail.label}
            </span>
            <span className="col-span-7 text-slate-200 break-words text-xs font-mono">
              {detail.value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
};

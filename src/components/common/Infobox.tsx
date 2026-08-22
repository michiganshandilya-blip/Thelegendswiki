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
      className={`w-full md:w-72 lg:w-80 bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm text-xs font-sans shrink-0 md:float-right md:ml-6 md:mb-6 mb-6 overflow-hidden shadow-xs ${className}`}
    >
      <div className="bg-[#eaecf0] border-b border-[#a2a9b1] px-3.5 py-2.5 text-center">
        <h4 className="font-serif text-sm font-bold text-[#101418]">
          {infobox.title}
        </h4>
        {infobox.subtitle && (
          <p className="text-[11px] text-[#54595d] font-sans italic mt-0.5">
            {infobox.subtitle}
          </p>
        )}
      </div>

      {infobox.image && (
        <div className="p-3 bg-[#ffffff] border-b border-[#eaecf0] text-center">
          <img
            src={infobox.image}
            alt={infobox.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-48 object-cover rounded-sm mx-auto border border-[#eaecf0]"
          />
          {infobox.imageCaption && (
            <p className="text-[11px] text-[#54595d] italic mt-1.5 leading-snug">
              {infobox.imageCaption}
            </p>
          )}
        </div>
      )}

      <div className="divide-y divide-[#eaecf0] bg-[#ffffff]">
        {infobox.details.map((detail, idx) => (
          <div key={idx} className="grid grid-cols-12 px-3 py-2 hover:bg-[#f8f9fa] transition-colors">
            <span className="col-span-5 font-medium text-[#54595d] pr-2 text-[11px]">
              {detail.label}
            </span>
            <span className="col-span-7 text-[#101418] break-words text-xs">
              {detail.value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
};

import React from 'react';
import { ArticleCitation } from '../../types';
import { BookOpen, ExternalLink } from 'lucide-react';

interface ReferenceListProps {
  citations: ArticleCitation[];
  className?: string;
}

export const ReferenceList: React.FC<ReferenceListProps> = ({
  citations,
  className = '',
}) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <section
      id="references"
      aria-label="References and Sources"
      className={`pt-6 border-t border-[#1e293b] space-y-4 scroll-mt-20 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-sky-400" />
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100">
            References & Citations
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {citations.length} indexed source{citations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-[#0e1422] border border-[#1e293b] rounded-sm p-4 text-xs">
        <ol className="list-decimal pl-5 space-y-2.5 text-slate-300 marker:text-slate-500 marker:font-mono">
          {citations.map((citation) => (
            <li key={citation.id} id={`ref-${citation.id}`} className="leading-relaxed pl-1">
              <span className="font-medium text-slate-200">
                {citation.author ? `${citation.author}. ` : ''}
              </span>
              <cite className="italic text-slate-100 font-sans">
                "{citation.title}"
              </cite>
              {citation.publisher && (
                <span className="text-slate-400">, {citation.publisher}</span>
              )}
              {(citation.year || citation.date) && (
                <span className="text-slate-500 font-mono ml-1">
                  ({citation.date || citation.year})
                </span>
              )}
              {citation.text && !citation.author && !citation.publisher && (
                <span className="text-slate-400">{citation.text}</span>
              )}
              {citation.url && (
                <span className="ml-1.5 inline-flex items-center text-sky-400 hover:text-sky-300 hover:underline">
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[11px]"
                  >
                    [Source]
                    <ExternalLink size={10} className="inline ml-0.5" />
                  </a>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <p className="text-[11px] text-slate-500 italic font-sans">
        * Demonstration bibliographic citations curated for structural validation.
      </p>
    </section>
  );
};


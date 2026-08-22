import React from 'react';
import { ArticleCitation } from '../../types';
import { BookOpen, ExternalLink, ArrowUp, Bookmark } from 'lucide-react';

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

  const handleBackToTop = (citationId: number) => {
    // Attempt to find any citation anchor matching this id or fallback to top of article
    const anchor =
      document.querySelector(`[id*="cite_ref-"][id$="-${citationId}"]`) ||
      document.getElementById('article-lead') ||
      document.getElementById('article-content');

    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      anchor.classList.add('bg-blue-100', 'transition-colors');
      setTimeout(() => {
        anchor.classList.remove('bg-blue-100');
      }, 1500);
    }
  };

  return (
    <section
      id="references"
      aria-label="References and Sources"
      className={`pt-6 border-t border-[#eaecf0] space-y-3.5 scroll-mt-20 ${className}`}
    >
      {/* Section Title Bar */}
      <div className="flex items-center justify-between border-b border-[#a2a9b1] pb-1.5">
        <div className="flex items-center gap-2">
          <BookOpen size={17} className="text-[#3366cc]" />
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#101418]">
            References &amp; Academic Citations
          </h2>
        </div>
        <span className="text-[11px] text-[#72777d] font-mono bg-[#f8f9fa] border border-[#cbd5e1] px-2 py-0.5 rounded-xs">
          {citations.length} Indexed Source{citations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Numbered Reference List Container */}
      <div className="bg-[#f8f9fa] border border-[#eaecf0] rounded-sm p-4 sm:p-5 text-xs">
        <ol className="list-decimal pl-5 space-y-3 text-[#202122] marker:text-[#72777d] marker:font-mono">
          {citations.map((citation, idx) => {
            const displayId = citation.id || idx + 1;

            return (
              <li
                key={citation.id || idx}
                id={`ref-${displayId}`}
                className="leading-relaxed pl-1.5 transition-colors p-1.5 rounded-xs scroll-mt-24 group hover:bg-blue-50/40"
              >
                <div className="flex items-start gap-1.5">
                  {/* Jump back caret button */}
                  <button
                    type="button"
                    onClick={() => handleBackToTop(displayId)}
                    title={`Jump back to text citation [${displayId}]`}
                    aria-label={`Jump back to reference ${displayId} in article body`}
                    className="text-[#3366cc] hover:text-[#2557bb] hover:underline font-mono text-[11px] font-bold shrink-0 mt-0.5 cursor-pointer"
                  >
                    ^
                  </button>

                  <div className="flex-1 font-sans text-xs text-[#202122]">
                    {/* Author */}
                    {citation.author && (
                      <span className="font-medium text-[#101418]">
                        {citation.author}{' '}
                      </span>
                    )}

                    {/* Year / Date */}
                    {(citation.year || citation.date) && (
                      <span className="text-[#54595d] font-mono mr-1">
                        ({citation.date || citation.year}).{' '}
                      </span>
                    )}

                    {/* Title */}
                    <cite className="italic font-serif text-[#101418]">
                      "{citation.title}"
                    </cite>

                    {/* Publisher / Journal */}
                    {citation.publisher && (
                      <span className="text-[#54595d]">
                        . {citation.publisher}
                      </span>
                    )}

                    {/* Pages */}
                    {citation.pages && (
                      <span className="text-[#54595d]">
                        , pp. {citation.pages}
                      </span>
                    )}

                    {/* DOI / ISBN */}
                    {citation.doi && (
                      <span className="text-[#72777d] font-mono ml-1.5 text-[11px]">
                        DOI:{' '}
                        <a
                          href={`https://doi.org/${citation.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3366cc] hover:underline"
                        >
                          {citation.doi}
                        </a>
                      </span>
                    )}
                    {citation.isbn && (
                      <span className="text-[#72777d] font-mono ml-1.5 text-[11px]">
                        ISBN: {citation.isbn}
                      </span>
                    )}

                    {/* Raw Text Fallback */}
                    {citation.text && !citation.author && !citation.publisher && (
                      <span className="text-[#54595d] ml-1">{citation.text}</span>
                    )}

                    {/* Access Date */}
                    {citation.accessDate && (
                      <span className="text-[10px] text-[#72777d] font-mono ml-1.5">
                        Retrieved {citation.accessDate}.
                      </span>
                    )}

                    {/* External Link */}
                    {citation.url && (
                      <span className="ml-2 inline-flex items-center">
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#3366cc] hover:text-[#2557bb] hover:underline text-[11px] font-mono"
                          title="Open external source repository in new tab"
                        >
                          <span>[source]</span>
                          <ExternalLink size={10} className="inline" />
                        </a>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

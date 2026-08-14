import React, { useState, useEffect } from 'react';
import { ArticleSection } from '../../types';
import { ListOrdered, ChevronDown, ChevronUp } from 'lucide-react';

interface TableOfContentsProps {
  sections: ArticleSection[];
  hasReferences?: boolean;
  hasRelated?: boolean;
  className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  sections,
  hasReferences = true,
  hasRelated = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const allIds = [
        ...sections.map((s) => s.id),
        ...(hasReferences ? ['references'] : []),
        ...(hasRelated ? ['related-articles'] : []),
      ];

      const scrollPosition = window.scrollY + 120;

      for (let i = allIds.length - 1; i >= 0; i--) {
        const id = allIds[i];
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top) {
            setActiveSectionId(id);
            return;
          }
        }
      }
      if (window.scrollY < 200) {
        setActiveSectionId('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, hasReferences, hasRelated]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -75; // Account for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSectionId(id);
    }
  };

  if (sections.length === 0) return null;

  return (
    <nav
      id="article-table-of-contents"
      aria-label="Table of contents"
      className={`bg-[#0e1422] border border-[#1e293b] rounded-sm p-3.5 sm:p-4 text-xs ${className}`}
    >
      <div className="flex items-center justify-between font-bold text-slate-200 pb-2 border-b border-[#1e293b]">
        <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-slate-100">
          <ListOrdered size={15} className="text-sky-400" />
          Contents
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-slate-100 inline-flex items-center gap-1 font-sans text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse table of contents' : 'Expand table of contents'}
        >
          <span className="text-[11px] font-medium">{isOpen ? 'Hide' : 'Show'}</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isOpen && (
        <ol className="mt-3 space-y-1.5 pl-4 list-decimal text-slate-400 marker:text-slate-500 marker:font-mono">
          {sections.map((section) => {
            const isActive = activeSectionId === section.id;
            return (
              <li key={section.id} className="leading-snug">
                <a
                  href={`#${section.id}`}
                  onClick={(e) => scrollToSection(e, section.id)}
                  className={`block py-0.5 hover:text-sky-400 hover:underline transition-colors ${
                    isActive ? 'font-bold text-sky-400' : 'text-slate-300'
                  }`}
                >
                  {section.title}
                </a>

                {/* Subsections if available */}
                {section.subsections && section.subsections.length > 0 && (
                  <ol className="mt-1 space-y-1 pl-4 list-[decimal] text-slate-400 marker:text-slate-600">
                    {section.subsections.map((sub) => {
                      const isSubActive = activeSectionId === sub.id;
                      return (
                        <li key={sub.id}>
                          <a
                            href={`#${sub.id}`}
                            onClick={(e) => scrollToSection(e, sub.id)}
                            className={`block py-0.5 hover:text-sky-400 hover:underline transition-colors ${
                              isSubActive ? 'font-bold text-sky-400' : 'text-slate-400'
                            }`}
                          >
                            {sub.title}
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </li>
            );
          })}

          {hasReferences && (
            <li className="leading-snug pt-1 border-t border-[#1e293b] mt-2">
              <a
                href="#references"
                onClick={(e) => scrollToSection(e, 'references')}
                className={`block py-0.5 hover:text-sky-400 hover:underline transition-colors ${
                  activeSectionId === 'references' ? 'font-bold text-sky-400' : 'text-slate-300'
                }`}
              >
                References & Citations
              </a>
            </li>
          )}

          {hasRelated && (
            <li className="leading-snug">
              <a
                href="#related-articles"
                onClick={(e) => scrollToSection(e, 'related-articles')}
                className={`block py-0.5 hover:text-sky-400 hover:underline transition-colors ${
                  activeSectionId === 'related-articles' ? 'font-bold text-sky-400' : 'text-slate-300'
                }`}
              >
                Related Articles
              </a>
            </li>
          )}
        </ol>
      )}
    </nav>
  );
};


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
      className={`bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm p-3.5 text-xs inline-block min-w-[240px] max-w-md ${className}`}
    >
      <div className="flex items-center justify-between font-bold text-[#101418] pb-1.5 border-b border-[#eaecf0]">
        <span className="inline-flex items-center gap-1.5 font-serif text-sm font-bold text-[#101418]">
          <ListOrdered size={14} className="text-[#3366cc]" />
          Contents
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#3366cc] hover:underline inline-flex items-center gap-1 font-sans text-xs px-1 cursor-pointer"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse table of contents' : 'Expand table of contents'}
        >
          <span className="text-[11px] font-medium">[{isOpen ? 'hide' : 'show'}]</span>
        </button>
      </div>

      {isOpen && (
        <ol className="mt-2.5 space-y-1 pl-4 list-decimal text-[#3366cc] marker:text-[#54595d] marker:font-mono">
          {sections.map((section) => {
            const isActive = activeSectionId === section.id;
            return (
              <li key={section.id} className="leading-snug">
                <a
                  href={`#${section.id}`}
                  onClick={(e) => scrollToSection(e, section.id)}
                  className={`hover:underline transition-colors ${
                    isActive ? 'font-bold text-[#101418]' : 'text-[#3366cc]'
                  }`}
                >
                  {section.title}
                </a>

                {/* Subsections if available */}
                {section.subsections && section.subsections.length > 0 && (
                  <ol className="mt-1 space-y-1 pl-4 list-decimal text-[#3366cc] marker:text-[#72777d]">
                    {section.subsections.map((sub) => {
                      const isSubActive = activeSectionId === sub.id;
                      return (
                        <li key={sub.id}>
                          <a
                            href={`#${sub.id}`}
                            onClick={(e) => scrollToSection(e, sub.id)}
                            className={`hover:underline transition-colors ${
                              isSubActive ? 'font-bold text-[#101418]' : 'text-[#3366cc]'
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
            <li className="leading-snug pt-1 border-t border-[#eaecf0] mt-1.5">
              <a
                href="#references"
                onClick={(e) => scrollToSection(e, 'references')}
                className={`hover:underline transition-colors ${
                  activeSectionId === 'references' ? 'font-bold text-[#101418]' : 'text-[#3366cc]'
                }`}
              >
                References &amp; Citations
              </a>
            </li>
          )}

          {hasRelated && (
            <li className="leading-snug">
              <a
                href="#related-articles"
                onClick={(e) => scrollToSection(e, 'related-articles')}
                className={`hover:underline transition-colors ${
                  activeSectionId === 'related-articles' ? 'font-bold text-[#101418]' : 'text-[#3366cc]'
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

import React, { useState } from 'react';
import { ArticleCitation } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { useArticles } from '../../data/dataProvider';
import { ExternalLink, BookOpen, Clock, FileText } from 'lucide-react';

interface InlineCitationTextProps {
  text: string;
  citations?: ArticleCitation[];
  paragraphId?: string;
  className?: string;
  currentArticleSlug?: string;
}

export const InlineCitationText: React.FC<InlineCitationTextProps> = ({
  text,
  citations = [],
  paragraphId = 'p',
  className = '',
  currentArticleSlug = '',
}) => {
  const { navigate } = useRouter();
  const { articles: allArticles } = useArticles();
  const [activeCitationPopover, setActiveCitationPopover] = useState<number | null>(null);
  const [hoveredWikiSlug, setHoveredWikiSlug] = useState<string | null>(null);

  if (!text) return null;

  // Known cross-linking dictionary from published articles
  const availableArticles = (allArticles || []).filter(
    (a) => a.slug !== currentArticleSlug && a.status === 'published'
  );

  // 1. Process citations first: split text by citation regex [1], [2], [1, 2], [1-3]
  const citationRegex = /\[(\d+(?:\s*,\s*\d+|\s*-\s*\d+)*)\]/g;

  // Helper to render text with internal wiki links
  const renderTextWithInternalLinks = (rawSegment: string, segmentKeyPrefix: string): React.ReactNode[] => {
    if (!rawSegment || availableArticles.length === 0) {
      return [rawSegment];
    }

    // Build regex for explicit wikilinks [[slug|Label]] or [[slug]]
    // and matched article titles
    const explicitLinkRegex = /\[\[([a-zA-Z0-9_-]+)(?:\|([^\]]+))?\]\]/g;

    const nodes: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    // First check explicit markdown wikilinks [[slug|Label]]
    const explicitMatches: { start: number; end: number; slug: string; label: string }[] = [];
    while ((match = explicitLinkRegex.exec(rawSegment)) !== null) {
      const slug = match[1];
      const label = match[2] || slug.replace(/-/g, ' ');
      explicitMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        slug,
        label,
      });
    }

    if (explicitMatches.length > 0) {
      explicitMatches.forEach((m, idx) => {
        if (m.start > lastIdx) {
          nodes.push(rawSegment.substring(lastIdx, m.start));
        }
        nodes.push(renderWikiLink(m.slug, m.label, `${segmentKeyPrefix}-wikilink-${idx}`));
        lastIdx = m.end;
      });
      if (lastIdx < rawSegment.length) {
        nodes.push(rawSegment.substring(lastIdx));
      }
      return nodes;
    }

    // Auto-link known article names if present in text (link first match per paragraph)
    let processedSegment = rawSegment;
    for (const art of availableArticles) {
      const escapedTitle = art.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match whole words
      const titleRegex = new RegExp(`\\b(${escapedTitle})\\b`, 'i');
      const titleMatch = titleRegex.exec(processedSegment);
      if (titleMatch && titleMatch.index !== undefined) {
        const start = titleMatch.index;
        const matchedText = titleMatch[0];
        const end = start + matchedText.length;

        const before = processedSegment.substring(0, start);
        const after = processedSegment.substring(end);

        return [
          before,
          renderWikiLink(art.slug, matchedText, `${segmentKeyPrefix}-autolink-${art.slug}`),
          ...renderTextWithInternalLinks(after, `${segmentKeyPrefix}-after-${art.slug}`),
        ];
      }
    }

    return [rawSegment];
  };

  // Helper to render internal Wiki link with rich hover preview
  const renderWikiLink = (slug: string, label: string, key: string) => {
    const targetArticle = availableArticles.find((a) => a.slug === slug);

    return (
      <span
        key={key}
        className="relative inline-block"
        onMouseEnter={() => setHoveredWikiSlug(slug)}
        onMouseLeave={() => setHoveredWikiSlug(null)}
      >
        <a
          href={`/wiki/${slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/wiki/${slug}`);
          }}
          className="text-[#3366cc] hover:text-[#1d4ed8] hover:underline font-medium transition-colors cursor-pointer"
          title={`Read encyclopedia entry: ${label}`}
        >
          {label}
        </a>

        {/* Rich Hover Preview Card */}
        {hoveredWikiSlug === slug && targetArticle && (
          <span
            role="tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-2xl z-50 text-left font-sans text-xs text-[#202122] pointer-events-none animate-in fade-in zoom-in-95 duration-100 block"
          >
            {targetArticle.image && (
              <span className="block w-full h-24 mb-2 bg-[#f8f9fa] border border-[#eaecf0] rounded-xs overflow-hidden">
                <img
                  src={targetArticle.image}
                  alt={targetArticle.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </span>
            )}

            <span className="flex items-center justify-between gap-1 text-[10px] uppercase font-bold text-[#3366cc] tracking-wider mb-1">
              <span>{targetArticle.category}</span>
              <span className="font-mono text-[#72777d] flex items-center gap-0.5 normal-case">
                <Clock size={10} />
                {targetArticle.readingTimeMinutes}m read
              </span>
            </span>

            <span className="block font-serif font-bold text-sm text-[#101418] mb-1 leading-snug">
              {targetArticle.title}
            </span>

            <span className="block text-[11px] text-[#54595d] line-clamp-2 leading-relaxed">
              {targetArticle.summary}
            </span>

            <span className="mt-2 pt-1.5 border-t border-[#eaecf0] flex items-center justify-between text-[10px] text-[#3366cc] font-medium font-mono">
              <span className="flex items-center gap-1">
                <FileText size={10} />
                TheLegendsWiki entry
              </span>
              <span>Click to view &rarr;</span>
            </span>
          </span>
        )}
      </span>
    );
  };

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let matchCount = 0;

  while ((match = citationRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    const refNumbersStr = match[1];

    // Push text before citation (with internal link parsing)
    if (matchStart > lastIndex) {
      const textBefore = text.substring(lastIndex, matchStart);
      parts.push(...renderTextWithInternalLinks(textBefore, `${paragraphId}-seg-${matchCount}`));
    }

    // Parse comma-separated or hyphenated reference numbers
    const refNums: number[] = [];
    if (refNumbersStr.includes(',')) {
      refNumbersStr.split(',').forEach((s) => {
        const parsed = parseInt(s.trim(), 10);
        if (!isNaN(parsed)) refNums.push(parsed);
      });
    } else if (refNumbersStr.includes('-')) {
      const [startStr, endStr] = refNumbersStr.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end) && start <= end && end - start <= 10) {
        for (let i = start; i <= end; i++) {
          refNums.push(i);
        }
      } else {
        const parsed = parseInt(startStr.trim(), 10);
        if (!isNaN(parsed)) refNums.push(parsed);
      }
    } else {
      const parsed = parseInt(refNumbersStr.trim(), 10);
      if (!isNaN(parsed)) refNums.push(parsed);
    }

    matchCount++;
    const anchorBaseId = `cite_ref-${paragraphId}-${matchCount}`;

    // Render interactive superscript tags
    parts.push(
      <sup
        key={`citation-${paragraphId}-${matchStart}`}
        className="citation-sup select-none inline-block ml-0.5"
      >
        {refNums.map((refNum, numIdx) => {
          const citation =
            citations.find((c) => c.id === refNum) ||
            (refNum <= citations.length ? citations[refNum - 1] : null);

          const handleCitationClick = (e: React.MouseEvent) => {
            e.preventDefault();
            const targetElement = document.getElementById(`ref-${refNum}`);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              targetElement.classList.add('bg-amber-100', 'ring-2', 'ring-amber-400', 'transition-all', 'duration-300');
              setTimeout(() => {
                targetElement.classList.remove('bg-amber-100', 'ring-2', 'ring-amber-400');
              }, 2200);
            }
          };

          return (
            <span
              key={numIdx}
              className="relative inline-block"
              onMouseEnter={() => setActiveCitationPopover(refNum)}
              onMouseLeave={() => setActiveCitationPopover(null)}
            >
              <a
                href={`#ref-${refNum}`}
                id={`${anchorBaseId}-${refNum}`}
                onClick={handleCitationClick}
                className="text-[#3366cc] hover:text-[#1d4ed8] hover:underline font-mono text-[11px] font-semibold px-0.5 py-0.2 focus:outline-hidden"
                aria-label={`Jump to reference ${refNum}`}
                title={citation ? `${citation.title}` : `Reference ${refNum}`}
              >
                [{refNum}]
              </a>

              {/* Hover Popover Preview */}
              {activeCitationPopover === refNum && citation && (
                <span
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-xl z-40 text-left font-sans text-xs text-[#202122] pointer-events-none animate-in fade-in zoom-in-95 duration-100"
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#3366cc] font-bold pb-1 border-b border-[#eaecf0] mb-1.5">
                    <BookOpen size={11} />
                    <span>Citation [{refNum}]</span>
                    {citation.citationType && (
                      <span className="capitalize text-[#72777d]">({citation.citationType})</span>
                    )}
                  </span>

                  {citation.author && (
                    <span className="block font-medium text-[#101418] mb-0.5">
                      {citation.author}
                    </span>
                  )}

                  <span className="block italic text-[#101418] font-serif mb-1 leading-snug">
                    "{citation.title}"
                  </span>

                  {(citation.publisher || citation.year || citation.date) && (
                    <span className="block text-[11px] text-[#54595d]">
                      {citation.publisher ? `${citation.publisher}` : ''}
                      {citation.year || citation.date ? ` (${citation.year || citation.date})` : ''}
                      {citation.pages ? `, pp. ${citation.pages}` : ''}
                    </span>
                  )}

                  {citation.doi && (
                    <span className="block text-[10px] font-mono text-[#72777d] mt-1">
                      DOI: {citation.doi}
                    </span>
                  )}

                  {citation.url && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#3366cc] font-mono">
                      <span>Online Source Verified</span>
                      <ExternalLink size={10} />
                    </span>
                  )}
                </span>
              )}
            </span>
          );
        })}
      </sup>
    );

    lastIndex = matchEnd;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    const textRemaining = text.substring(lastIndex);
    parts.push(...renderTextWithInternalLinks(textRemaining, `${paragraphId}-seg-end`));
  }

  return <span className={className}>{parts}</span>;
};

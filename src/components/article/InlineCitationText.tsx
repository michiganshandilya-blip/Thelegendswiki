import React, { useState, useRef } from 'react';
import { ArticleCitation } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { useArticles } from '../../data/dataProvider';
import { ExternalLink, BookOpen, Clock, FileText, Link2 } from 'lucide-react';

interface InlineCitationTextProps {
  text: string;
  citations?: ArticleCitation[];
  paragraphId?: string;
  className?: string;
  currentArticleSlug?: string;
}

/**
 * Validates and sanitizes a URL to ensure it uses safe web protocols (http/https).
 * Rejects dangerous schemes like javascript:, data:, and vbscript:.
 */
export function sanitizeSafeUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();

  // Explicitly disallow dangerous schemes
  if (/^(?:javascript|data|vbscript|file):/i.test(trimmed)) {
    return null;
  }

  // Only permit valid http:// and https:// URLs
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch {
      return null;
    }
  }

  return null;
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
  const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!text) return null;

  // Known cross-linking dictionary from published articles
  const availableArticles = (allArticles || []).filter(
    (a) => a.slug !== currentArticleSlug && a.status === 'published'
  );

  const handlePopoverMouseEnter = (refNum: number) => {
    if (popoverTimeoutRef.current) {
      clearTimeout(popoverTimeoutRef.current);
      popoverTimeoutRef.current = null;
    }
    setActiveCitationPopover(refNum);
  };

  const handlePopoverMouseLeave = () => {
    popoverTimeoutRef.current = setTimeout(() => {
      setActiveCitationPopover(null);
    }, 250);
  };

  // Helper to render bold and italic markdown within plain text segments
  const renderTextFormatting = (rawText: string, keyPrefix: string): React.ReactNode[] => {
    if (!rawText) return [];

    // Parse bold **text** and italic *text*
    const formatRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
    const result: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = formatRegex.exec(rawText)) !== null) {
      if (match.index > lastIdx) {
        result.push(rawText.substring(lastIdx, match.index));
      }

      if (match[1]) {
        // Bold
        result.push(
          <strong key={`${keyPrefix}-b-${idx}`} className="font-bold text-[#101418]">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // Italic
        result.push(
          <em key={`${keyPrefix}-i-${idx}`} className="italic">
            {match[4]}
          </em>
        );
      }

      lastIdx = match.index + match[0].length;
      idx++;
    }

    if (lastIdx < rawText.length) {
      result.push(rawText.substring(lastIdx));
    }

    return result.length > 0 ? result : [rawText];
  };

  // Helper to render internal Wiki links with hover card
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

  /**
   * Master Tokenizer:
   * 1. Citations: [1], [2], [1, 2], [1-3]
   * 2. Markdown Links: [Link Title](https://example.com/...)
   * 3. Wikilinks: [[slug|label]]
   * 4. Raw URLs: https://... or http://...
   */
  const masterRegex =
    /(\[(\d+(?:\s*,\s*\d+|\s*-\s*\d+)*)\])|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\[\[([a-zA-Z0-9_-]+)(?:\|([^\]]+))?\]\])|((https?:\/\/[^\s<>"'`]+))/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let matchIdx = 0;

  while ((match = masterRegex.exec(text)) !== null) {
    // 1. Text before match
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      elements.push(
        ...renderTextFormatting(textBefore, `${paragraphId}-pre-${matchIdx}`)
      );
    }

    // 2. Determine match type
    if (match[1]) {
      // CITATION: [1] or [1, 2]
      const refNumbersStr = match[2];
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
          for (let i = start; i <= end; i++) refNums.push(i);
        } else {
          const parsed = parseInt(startStr.trim(), 10);
          if (!isNaN(parsed)) refNums.push(parsed);
        }
      } else {
        const parsed = parseInt(refNumbersStr.trim(), 10);
        if (!isNaN(parsed)) refNums.push(parsed);
      }

      elements.push(
        <sup
          key={`cite-${paragraphId}-${match.index}`}
          className="citation-sup select-none inline-block ml-0.5"
        >
          {refNums.map((refNum, rIdx) => {
            const citation =
              citations.find((c) => c.id === refNum) ||
              (refNum <= citations.length ? citations[refNum - 1] : null);

            const safeCitationUrl = citation?.url ? sanitizeSafeUrl(citation.url) : null;

            const handleCitationClick = (e: React.MouseEvent) => {
              e.preventDefault();
              // If citation has a real external URL, open it directly in a new tab
              if (safeCitationUrl) {
                window.open(safeCitationUrl, '_blank', 'noopener,noreferrer');
              }

              // Also highlight reference entry at bottom of article
              const targetElement = document.getElementById(`ref-${refNum}`);
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetElement.classList.add(
                  'bg-amber-100',
                  'ring-2',
                  'ring-amber-400',
                  'transition-all',
                  'duration-300'
                );
                setTimeout(() => {
                  targetElement.classList.remove('bg-amber-100', 'ring-2', 'ring-amber-400');
                }, 2200);
              }
            };

            return (
              <span
                key={rIdx}
                className="relative inline-block"
                onMouseEnter={() => handlePopoverMouseEnter(refNum)}
                onMouseLeave={handlePopoverMouseLeave}
              >
                <a
                  href={safeCitationUrl || `#ref-${refNum}`}
                  id={`cite_ref-${paragraphId}-${matchIdx}-${refNum}`}
                  onClick={handleCitationClick}
                  className="text-[#3366cc] hover:text-[#1d4ed8] hover:underline font-mono text-[11px] font-semibold px-0.5 py-0.2 focus:outline-hidden cursor-pointer"
                  aria-label={`Source reference ${refNum}: ${citation?.title || 'Open citation'}`}
                  title={
                    safeCitationUrl
                      ? `Click to open verified source: ${citation?.title || safeCitationUrl}`
                      : citation?.title || `Reference [${refNum}]`
                  }
                >
                  [{refNum}]
                </a>

                {/* Accessible Hover Popover Card */}
                {activeCitationPopover === refNum && citation && (
                  <span
                    role="tooltip"
                    onMouseEnter={() => handlePopoverMouseEnter(refNum)}
                    onMouseLeave={handlePopoverMouseLeave}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-2xl z-50 text-left font-sans text-xs text-[#202122] block animate-in fade-in zoom-in-95 duration-100"
                  >
                    <span className="flex items-center justify-between gap-1 text-[10px] font-mono text-[#3366cc] font-bold pb-1.5 border-b border-[#eaecf0] mb-2">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={12} />
                        <span>Citation Source [{refNum}]</span>
                      </span>
                      {citation.citationType && (
                        <span className="capitalize text-[#72777d] font-normal">
                          ({citation.citationType.replace('_', ' ')})
                        </span>
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
                      <span className="block text-[11px] text-[#54595d] mb-1">
                        {citation.publisher ? `${citation.publisher}` : ''}
                        {citation.year || citation.date
                          ? ` (${citation.year || citation.date})`
                          : ''}
                        {citation.pages ? `, pp. ${citation.pages}` : ''}
                      </span>
                    )}

                    {citation.doi && (
                      <span className="block text-[10px] font-mono text-[#72777d]">
                        DOI: {citation.doi}
                      </span>
                    )}

                    {/* Direct clickable source button */}
                    {safeCitationUrl && (
                      <span className="mt-2.5 pt-2 border-t border-[#eaecf0] block">
                        <a
                          href={safeCitationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-between w-full px-2.5 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-2xs text-[11px] font-mono font-medium transition-colors"
                        >
                          <span className="truncate mr-2">Open Genuine Source Document</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                      </span>
                    )}
                  </span>
                )}
              </span>
            );
          })}
        </sup>
      );
    } else if (match[3]) {
      // MARKDOWN HYPERLINK: [Label](https://...)
      const label = match[4];
      const rawUrl = match[5];
      const safeUrl = sanitizeSafeUrl(rawUrl);

      if (safeUrl) {
        elements.push(
          <a
            key={`mdlink-${paragraphId}-${match.index}`}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3366cc] hover:text-[#1d4ed8] hover:underline font-medium inline-flex items-center gap-0.5 break-all cursor-pointer"
            title={`Open source link: ${safeUrl}`}
          >
            <span>{label}</span>
            <ExternalLink size={11} className="inline shrink-0 opacity-80" />
          </a>
        );
      } else {
        // Fallback: render label without unsafe link
        elements.push(label);
      }
    } else if (match[6]) {
      // WIKILINK: [[slug|label]]
      const slug = match[7];
      const label = match[8] || slug.replace(/-/g, ' ');
      elements.push(renderWikiLink(slug, label, `wikilink-${paragraphId}-${match.index}`));
    } else if (match[9]) {
      // RAW PASTED URL: https://... or http://...
      let rawUrl = match[9];
      let trailingPunct = '';

      // Strip trailing punctuation from sentence boundaries
      while (/[.,!?;:)\]]$/.test(rawUrl)) {
        trailingPunct = rawUrl.slice(-1) + trailingPunct;
        rawUrl = rawUrl.slice(0, -1);
      }

      const safeUrl = sanitizeSafeUrl(rawUrl);

      if (safeUrl) {
        elements.push(
          <a
            key={`rawurl-${paragraphId}-${match.index}`}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3366cc] hover:text-[#1d4ed8] hover:underline font-mono text-[0.92em] inline-flex items-center gap-0.5 break-all cursor-pointer"
            title={`Open external link: ${safeUrl}`}
          >
            <span>{safeUrl}</span>
            <ExternalLink size={10} className="inline shrink-0 opacity-80" />
          </a>
        );
      } else {
        elements.push(rawUrl);
      }

      if (trailingPunct) {
        elements.push(trailingPunct);
      }
    }

    lastIndex = match.index + match[0].length;
    matchIdx++;
  }

  // 3. Trailing text after last match
  if (lastIndex < text.length) {
    const trailingText = text.substring(lastIndex);
    elements.push(
      ...renderTextFormatting(trailingText, `${paragraphId}-tail`)
    );
  }

  return <span className={className}>{elements}</span>;
};

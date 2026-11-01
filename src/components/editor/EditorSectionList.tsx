import React, { useState, useEffect } from 'react';
import { ArticleSection, ArticleImageFigure, ArticleCitation } from '../../types';
import { EditorToolbar } from './EditorToolbar';
import { ImageUploaderModal } from '../common/ImageUploaderModal';
import { validateImageAlt } from '../../lib/validation';
import {
  ORIGINAL_FOUR_SECTIONS,
  DossierSectionDefinition,
  mapToStandardDossierSections,
} from '../../lib/dossierStructure';
import { InlineCitationText, sanitizeSafeUrl } from '../article/InlineCitationText';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  LayoutList,
  Check,
  Link2,
  ExternalLink,
  Eye,
  Edit3,
  BookOpen,
  BookmarkPlus,
  Info,
} from 'lucide-react';

interface EditorSectionListProps {
  sections: ArticleSection[];
  citations?: ArticleCitation[];
  categorySlug?: string;
  categoryName?: string;
  errors?: Record<string, string>;
  onChange: (sections: ArticleSection[]) => void;
  onCitationsChange?: (citations: ArticleCitation[]) => void;
  onOpenAiWritingTools?: (sectionIndex: number) => void;
}

export const EditorSectionList: React.FC<EditorSectionListProps> = ({
  sections,
  citations = [],
  categorySlug = 'behind-financial-markets',
  categoryName = 'Behind Financial Markets',
  errors = {},
  onChange,
  onCitationsChange,
  onOpenAiWritingTools,
}) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [activeFigureSectionIndex, setActiveFigureSectionIndex] = useState<number | null>(null);
  const [sectionViewTabs, setSectionViewTabs] = useState<Record<string, 'write' | 'preview'>>({});
  const [citationNotification, setCitationNotification] = useState<{ sectionId: string; message: string } | null>(null);

  // Ensure sections array always aligns with the 4 original sections
  useEffect(() => {
    if (!sections || sections.length !== 4) {
      const normalized = mapToStandardDossierSections(sections);
      onChange(normalized);
    }
  }, [sections, onChange]);

  // Safe accessor to guarantee we always have 4 sections
  const safeSections: ArticleSection[] =
    sections && sections.length === 4
      ? sections
      : mapToStandardDossierSections(sections);

  // Update Section Content text
  const handleContentChange = (index: number, text: string) => {
    const copy = [...safeSections];
    copy[index] = {
      ...copy[index],
      content: [text],
    };
    onChange(copy);
  };

  // Insert markdown tag helper at cursor / append
  const handleInsertMarkdownToSection = (
    index: number,
    prefix: string,
    suffix: string = '',
    placeholder: string = ''
  ) => {
    const section = safeSections[index];
    const rawContent = (section?.content || []).join('\n\n');
    const newContent = `${rawContent}${rawContent ? '\n\n' : ''}${prefix}${placeholder}${suffix}`;
    handleContentChange(index, newContent);
  };

  // Smart paste handler on the section textarea
  const handleTextareaPaste = (
    index: number,
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const trimmed = pastedText.trim();
    // Check if the pasted string is a URL (starts with http:// or https://)
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
      const safeUrl = sanitizeSafeUrl(trimmed);
      if (!safeUrl) return;

      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const section = safeSections[index];
      const rawContent = (section?.content || []).join('\n\n');

      // If user highlighted text, automatically wrap as [highlighted text](safeUrl)
      if (start !== end && start >= 0 && end <= rawContent.length) {
        e.preventDefault();
        const selectedText = rawContent.substring(start, end);
        const replacement = `[${selectedText}](${safeUrl})`;
        const updated = rawContent.substring(0, start) + replacement + rawContent.substring(end);
        handleContentChange(index, updated);

        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + replacement.length;
        }, 0);
        return;
      }
    }
  };

  // Helper to extract links and citations from section content
  const extractLinksAndCitations = (text: string) => {
    const links: Array<{ type: 'markdown' | 'bare'; url: string; label?: string; safeUrl: string | null }> = [];
    const seenUrls = new Set<string>();

    // 1. Markdown links: [label](url)
    const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let mdMatch: RegExpExecArray | null;
    while ((mdMatch = mdRegex.exec(text)) !== null) {
      const label = mdMatch[1];
      const url = mdMatch[2];
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        links.push({
          type: 'markdown',
          url,
          label,
          safeUrl: sanitizeSafeUrl(url),
        });
      }
    }

    // 2. Bare URLs: https://... or http://...
    const rawRegex = /(https?:\/\/[^\s<>"'`]+)/g;
    let rawMatch: RegExpExecArray | null;
    while ((rawMatch = rawRegex.exec(text)) !== null) {
      let url = rawMatch[1];
      while (/[.,!?;:)\]]$/.test(url)) {
        url = url.slice(0, -1);
      }
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        links.push({
          type: 'bare',
          url,
          safeUrl: sanitizeSafeUrl(url),
        });
      }
    }

    // 3. Citations: [1], [2]
    const citeRegex = /\[(\d+)\]/g;
    const citationIds = new Set<number>();
    let citeMatch: RegExpExecArray | null;
    while ((citeMatch = citeRegex.exec(text)) !== null) {
      citationIds.add(parseInt(citeMatch[1], 10));
    }

    return {
      links,
      citationIds: Array.from(citationIds).sort((a, b) => a - b),
    };
  };

  // Attach a recognized URL directly as an article citation/reference
  const handleAttachUrlAsCitation = (
    sectionId: string,
    url: string,
    suggestedTitle?: string
  ) => {
    if (!onCitationsChange) return;

    const safeUrl = sanitizeSafeUrl(url);
    if (!safeUrl) return;

    // Check if URL is already in citations
    const existing = citations.find(
      (c) => c.url && c.url.trim().toLowerCase() === safeUrl.toLowerCase()
    );

    if (existing) {
      setCitationNotification({
        sectionId,
        message: `Already attached as Citation [${existing.id}]! Insert [${existing.id}] in text to cite.`,
      });
      setTimeout(() => setCitationNotification(null), 4000);
      return existing.id;
    }

    let hostname = '';
    try {
      hostname = new URL(safeUrl).hostname.replace(/^www\./, '');
    } catch {
      hostname = 'External Web Source';
    }

    const nextId = citations.length > 0 ? Math.max(...citations.map((c) => c.id || 0)) + 1 : 1;
    const newCitation: ArticleCitation = {
      id: nextId,
      title: suggestedTitle || `Document from ${hostname}`,
      author: '',
      publisher: hostname,
      url: safeUrl,
      year: new Date().getFullYear().toString(),
      citationType: 'website',
      pages: '',
      doi: '',
      isbn: '',
    };

    onCitationsChange([...citations, newCitation]);
    setCitationNotification({
      sectionId,
      message: `Attached to References as [${nextId}]! You can now cite it using [${nextId}].`,
    });
    setTimeout(() => setCitationNotification(null), 4500);
    return nextId;
  };

  // Figure handlers
  const handleAttachFigure = (
    index: number,
    figureData: {
      url: string;
      caption: string;
      alt: string;
      credit: string;
      align?: 'right' | 'left' | 'center' | 'full';
    }
  ) => {
    const copy = [...safeSections];
    copy[index] = {
      ...copy[index],
      figure: {
        url: figureData.url,
        caption: figureData.caption,
        alt: figureData.alt,
        credit: figureData.credit || undefined,
        align: figureData.align || 'right',
      },
    };
    onChange(copy);
  };

  const handleUpdateFigureField = (
    sectionIndex: number,
    field: keyof ArticleImageFigure,
    val: any
  ) => {
    const copy = [...safeSections];
    if (!copy[sectionIndex].figure) return;
    copy[sectionIndex] = {
      ...copy[sectionIndex],
      figure: {
        ...copy[sectionIndex].figure!,
        [field]: val,
      },
    };
    onChange(copy);
  };

  const handleRemoveFigure = (index: number) => {
    const copy = [...safeSections];
    copy[index] = {
      ...copy[index],
      figure: undefined,
    };
    onChange(copy);
  };

  const scrollToTop = () => {
    const container = document.getElementById('editor-sections-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToNextSection = () => {
    if (activeSectionIndex < ORIGINAL_FOUR_SECTIONS.length - 1) {
      setActiveSectionIndex((prev) => prev + 1);
      scrollToTop();
    }
  };

  const goToPrevSection = () => {
    if (activeSectionIndex > 0) {
      setActiveSectionIndex((prev) => prev - 1);
      scrollToTop();
    }
  };

  // Helper to get error for a section (checking by section index or section ID)
  const getSectionError = (index: number, id: string): string | undefined => {
    return errors[id] || errors[`sections.${index}`] || errors[`sections[${index}]`];
  };

  // Render one of the 4 straightforward section writing editors
  const renderSingleSectionEditor = (def: DossierSectionDefinition, index: number) => {
    const sec = safeSections[index] || {
      id: def.id,
      title: def.title,
      content: [''],
      bulletPoints: [],
    };
    const rawText = (sec.content || []).join('\n\n');
    const charCount = rawText.trim().length;
    const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
    const figure = sec.figure;
    const figAltCheck = figure ? validateImageAlt(figure.alt) : { isValid: true };
    const sectionError = getSectionError(index, def.id);
    const categoryHint = def.categoryGuidance?.[categorySlug];
    const activeTab = sectionViewTabs[def.id] || 'write';
    const { links: detectedLinks, citationIds: detectedCitations } = extractLinksAndCitations(rawText);

    return (
      <div
        key={def.id}
        id={`section-editor-${def.id}`}
        className={`bg-[#ffffff] border rounded-sm p-4 sm:p-6 space-y-4 shadow-2xs transition-colors ${
          sectionError
            ? 'border-red-400 ring-1 ring-red-300'
            : 'border-[#c8ccd1]'
        }`}
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#eaecf0]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-6 h-6 rounded-xs bg-[#3366cc] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
              {index + 1}
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#101418] flex items-center gap-2">
              <span>{def.title}</span>
            </h3>
            <span className="text-[10px] font-mono uppercase bg-blue-50 text-[#3366cc] border border-blue-200 px-2 py-0.5 rounded-xs font-semibold">
              Section {index + 1} of 4
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {charCount >= 15 ? (
              <span className="text-emerald-700 flex items-center gap-1 font-sans text-xs font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs">
                <CheckCircle2 size={13} /> {wordCount} words ({charCount} chars)
              </span>
            ) : charCount > 0 ? (
              <span className="text-amber-800 font-sans text-xs bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xs">
                {charCount} chars (Min 15 required)
              </span>
            ) : (
              <span className="text-slate-500 font-sans text-xs bg-slate-100 px-2 py-0.5 rounded-xs">
                Awaiting content
              </span>
            )}
          </div>
        </div>

        {/* Editorial Goal Guidance */}
        <div className="bg-[#f8f9fa] border-l-3 border-[#3366cc] p-3.5 text-xs text-[#202122] rounded-r-xs space-y-1.5">
          <p className="text-[#374151] font-sans leading-relaxed">
            <strong className="font-semibold text-[#111827]">Editorial Purpose:</strong> {def.helperText}
          </p>
          {categoryHint && (
            <p className="text-[#3366cc] font-sans text-[11px] leading-snug">
              <span className="font-semibold">Category Context ({categoryName}):</span> {categoryHint}
            </p>
          )}
        </div>

        {/* Section Error Alert */}
        {sectionError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span className="font-medium">{sectionError}</span>
          </div>
        )}

        {/* Editor vs Live Preview Tab Switcher */}
        <div className="flex items-center justify-between border-b border-[#eaecf0] pb-2">
          <div className="flex items-center gap-1 bg-[#f8f9fa] border border-[#c8ccd1] p-1 rounded-sm">
            <button
              type="button"
              onClick={() => setSectionViewTabs((prev) => ({ ...prev, [def.id]: 'write' }))}
              className={`px-3 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'write'
                  ? 'bg-white text-[#3366cc] font-semibold shadow-xs'
                  : 'text-[#54595d] hover:text-[#101418]'
              }`}
            >
              <Edit3 size={12} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setSectionViewTabs((prev) => ({ ...prev, [def.id]: 'preview' }))}
              className={`px-3 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white text-[#3366cc] font-semibold shadow-xs'
                  : 'text-[#54595d] hover:text-[#101418]'
              }`}
            >
              <Eye size={12} />
              <span>Live Formatted Preview</span>
              {detectedLinks.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-blue-100 text-[#3366cc] rounded-full font-mono font-bold">
                  {detectedLinks.length} {detectedLinks.length === 1 ? 'link' : 'links'}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] text-[#72777d] font-sans hidden sm:inline">
            Pasted URLs automatically become clickable hyperlinks
          </span>
        </div>

        {activeTab === 'write' ? (
          <>
            {/* Formatting & Citation Toolbar */}
            <EditorToolbar
              citations={citations}
              onInsertMarkdown={(pre, suf, ph) =>
                handleInsertMarkdownToSection(index, pre, suf, ph)
              }
              onOpenAiWritingTools={
                onOpenAiWritingTools ? () => onOpenAiWritingTools(index) : undefined
              }
            />

            {/* The One Simple Writing Text Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`editor-textarea-${def.id}`}
                  className="text-[10px] font-mono uppercase text-[#54595d] font-bold"
                >
                  {def.title} Content
                </label>
                <span className="text-[11px] text-[#72777d] font-sans">
                  Paste URLs or markdown links &bull; Cite references using <code className="font-mono text-[#3366cc]">[1]</code>
                </span>
              </div>
              <textarea
                id={`editor-textarea-${def.id}`}
                value={rawText}
                onChange={(e) => handleContentChange(index, e.target.value)}
                onPaste={(e) => handleTextareaPaste(index, e)}
                rows={12}
                placeholder={def.placeholder}
                className={`w-full bg-[#ffffff] border rounded-sm p-3.5 text-sm text-[#202122] placeholder-[#72777d] focus:outline-none leading-relaxed transition-all font-sans shadow-inner ${
                  sectionError
                    ? 'border-red-400 focus:border-red-500 ring-1 ring-red-300'
                    : 'border-[#a2a9b1] focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]'
                }`}
              />
            </div>

            {/* Recognized Links & Citations Tray for this Section */}
            <div className="bg-[#f8f9fa] border border-[#eaecf0] rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#101418] text-[11px]">
                  <Link2 size={13} className="text-[#3366cc]" />
                  <span>Recognized Links &amp; Sources in this Section</span>
                  <span className="text-[#72777d] font-normal">
                    ({detectedLinks.length} {detectedLinks.length === 1 ? 'link' : 'links'}
                    {detectedCitations.length > 0 ? `, ${detectedCitations.length} cited` : ''})
                  </span>
                </div>
                <span className="text-[10px] text-[#72777d] font-mono">
                  Opens securely in new tab
                </span>
              </div>

              {/* Notification toast if citation was just attached */}
              {citationNotification && citationNotification.sectionId === def.id && (
                <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xs flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>{citationNotification.message}</span>
                </div>
              )}

              {detectedLinks.length === 0 && detectedCitations.length === 0 ? (
                <p className="text-[11px] text-[#72777d] font-sans">
                  Any pasted URL (e.g. <code>https://sec.gov/...</code>) or markdown link <code>[Source](https://...)</code> is recognized and rendered as a real clickable link.
                </p>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {detectedLinks.map((link, lIdx) => {
                    const isAlreadyCitation = citations.find(
                      (c) => c.url && link.safeUrl && c.url.trim().toLowerCase() === link.safeUrl.toLowerCase()
                    );

                    return (
                      <div
                        key={lIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white border border-[#e2e8f0] rounded-xs text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${link.safeUrl ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <div className="truncate font-mono text-[11px]">
                            {link.label && (
                              <span className="font-semibold text-[#101418] mr-1.5 font-sans">
                                {link.label}:
                              </span>
                            )}
                            <span className={link.safeUrl ? 'text-[#3366cc]' : 'text-red-600'}>
                              {link.url}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {link.safeUrl && (
                            <a
                              href={link.safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#3366cc] hover:underline px-2 py-0.5 rounded-xs hover:bg-blue-50 transition-colors"
                            >
                              <span>Test Link</span>
                              <ExternalLink size={11} />
                            </a>
                          )}

                          {onCitationsChange && (
                            isAlreadyCitation ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs">
                                Attached as Citation [{isAlreadyCitation.id}]
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAttachUrlAsCitation(def.id, link.url, link.label)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-xs transition-colors cursor-pointer"
                                title="Attach this URL to the article references list so you can cite it with [X]"
                              >
                                <BookmarkPlus size={11} />
                                <span>+ Attach as Citation Reference</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {detectedCitations.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-[#54595d]">
                      <span className="text-[#72777d]">Inline citation tags in this section:</span>
                      {detectedCitations.map((num) => {
                        const cit = citations.find((c) => c.id === num) || (num <= citations.length ? citations[num - 1] : null);
                        return (
                          <span
                            key={num}
                            className="bg-blue-50 text-[#3366cc] border border-blue-200 px-1.5 py-0.2 rounded-xs font-bold inline-flex items-center gap-1"
                            title={cit?.title || `Citation [${num}]`}
                          >
                            <span>[{num}]</span>
                            {cit?.title && <span className="font-normal font-serif truncate max-w-32 text-[10px]">{cit.title}</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Live Formatted Section Preview */
          <div className="bg-[#fafafa] border border-[#cbd5e1] rounded-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#54595d] pb-2 border-b border-[#eaecf0]">
              <span className="font-mono text-[11px] font-semibold flex items-center gap-1.5 text-[#3366cc]">
                <Eye size={13} />
                <span>Section Interactive Reader Preview</span>
              </span>
              <span className="text-[11px] text-[#72777d]">
                Click hyperlinks to verify external source destinations
              </span>
            </div>

            {rawText.trim() ? (
              <div className="space-y-3.5 text-[#202122] font-sans text-sm sm:text-base leading-relaxed">
                {rawText
                  .split(/\n\n+/)
                  .filter((p) => p.trim().length > 0)
                  .map((para, pIdx) => (
                    <p key={pIdx} className="whitespace-pre-line leading-relaxed">
                      <InlineCitationText
                        text={para}
                        citations={citations}
                        paragraphId={`sec-${index}-p${pIdx}`}
                      />
                    </p>
                  ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                No text written in this section yet. Switch back to "Editor" to type or paste content.
              </div>
            )}
          </div>
        )}

        {/* Optional Section Figure / Image Management */}
        <div className="pt-2 border-t border-[#eaecf0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#54595d] font-bold flex items-center gap-1">
              <ImageIcon size={12} className="text-[#3366cc]" />
              <span>Section Archival Illustration / Diagram (Optional)</span>
            </span>

            <button
              type="button"
              onClick={() => setActiveFigureSectionIndex(index)}
              className="text-[11px] text-[#3366cc] hover:underline font-semibold font-mono cursor-pointer flex items-center gap-1"
            >
              {figure ? <Edit2 size={11} /> : <Plus size={11} />}
              <span>{figure ? 'Edit Archival Figure' : '+ Attach Archival Figure'}</span>
            </button>
          </div>

          {figure && (
            <div className="p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-xs flex flex-col sm:flex-row items-start gap-3">
              <div className="w-24 h-20 bg-slate-200 rounded-2xs overflow-hidden shrink-0 border border-slate-300 relative group">
                <img
                  src={figure.url}
                  alt={figure.alt || 'Archival Figure'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1.5 text-xs w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-[#54595d] uppercase block">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={figure.caption || ''}
                      onChange={(e) =>
                        handleUpdateFigureField(index, 'caption', e.target.value)
                      }
                      placeholder="Figure caption..."
                      className="w-full text-xs p-1.5 border border-[#a2a9b1] rounded-2xs bg-white text-[#202122]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#54595d] uppercase block">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={figure.alt || ''}
                      onChange={(e) =>
                        handleUpdateFigureField(index, 'alt', e.target.value)
                      }
                      placeholder="Accessible description..."
                      className={`w-full text-xs p-1.5 border rounded-2xs bg-white text-[#202122] ${
                        !figAltCheck.isValid ? 'border-red-400' : 'border-[#a2a9b1]'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#72777d]">
                    Alignment: <strong>{figure.align || 'right'}</strong> &bull; Credit: {figure.credit || 'Archival Record'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveFigure(index)}
                    className="text-[11px] text-red-600 hover:text-red-800 font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} /> Remove Figure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Navigation Footer */}
        {viewMode === 'single' && (
          <div className="pt-4 border-t border-[#eaecf0] flex flex-wrap items-center justify-between gap-3">
            <div>
              {index > 0 ? (
                <button
                  type="button"
                  onClick={goToPrevSection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202122] bg-[#f8f9fa] border border-[#a2a9b1] hover:bg-[#eaecf0] rounded-sm transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Previous: Section {index} ({ORIGINAL_FOUR_SECTIONS[index - 1].title})</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-mono">
                  Beginning of writing workflow
                </span>
              )}
            </div>

            <div className="text-xs font-mono text-[#54595d] bg-slate-100 px-2.5 py-1 rounded-sm border border-slate-200">
              Section {index + 1} of 4
            </div>

            <div>
              {index < ORIGINAL_FOUR_SECTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={goToNextSection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#3366cc] hover:bg-[#2855aa] rounded-sm transition-colors cursor-pointer shadow-xs"
                >
                  <span>Next: Section {index + 2} ({ORIGINAL_FOUR_SECTIONS[index + 1].title})</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <span className="text-xs text-emerald-700 font-mono flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-sm border border-emerald-200">
                  <Check size={12} /> Final Section Reached
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="editor-sections-container" className="space-y-5">
      {/* Container Header with Section Counter & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#a2a9b1]">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#101418] flex items-center gap-2">
            <FileText size={20} className="text-[#3366cc]" />
            <span>Article Writing Sections</span>
          </h2>
          <p className="text-xs text-[#54595d] mt-0.5">
            Write or paste your investigative findings into each of the four core sections below.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#f8f9fa] border border-[#c8ccd1] p-1 rounded-sm self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('single')}
            className={`px-3 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'single'
                ? 'bg-white text-[#101418] shadow-xs font-semibold text-[#3366cc]'
                : 'text-[#54595d] hover:text-[#101418]'
            }`}
          >
            <FileText size={12} />
            <span>Single Section</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'all'
                ? 'bg-white text-[#101418] shadow-xs font-semibold text-[#3366cc]'
                : 'text-[#54595d] hover:text-[#101418]'
            }`}
          >
            <LayoutList size={12} />
            <span>View All 4 Sections</span>
          </button>
        </div>
      </div>

      {/* Exactly 4 Simple Writing Options / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ORIGINAL_FOUR_SECTIONS.map((def, idx) => {
          const sec = safeSections[idx];
          const rawText = (sec?.content || []).join('\n\n').trim();
          const charCount = rawText.length;
          const wordCount = rawText ? rawText.split(/\s+/).length : 0;
          const isComplete = charCount >= 15;
          const isSelected = viewMode === 'single' && activeSectionIndex === idx;
          const hasError = Boolean(getSectionError(idx, def.id));

          return (
            <button
              key={def.id}
              type="button"
              onClick={() => {
                setActiveSectionIndex(idx);
                if (viewMode === 'all') {
                  const targetEl = document.getElementById(`section-editor-${def.id}`);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }}
              className={`p-3.5 rounded-sm border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-[#3366cc] bg-[#f0f4f9] shadow-xs ring-1 ring-[#3366cc]'
                  : hasError
                  ? 'border-red-300 bg-red-50/50 hover:bg-red-50'
                  : 'border-[#c8ccd1] bg-white hover:border-[#3366cc] hover:bg-[#f8f9fa]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`w-5 h-5 rounded-xs font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#3366cc] text-white'
                        : isComplete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {isComplete ? (
                    <span className="text-emerald-700 text-[10px] font-sans font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  ) : charCount > 0 ? (
                    <span className="text-amber-700 text-[10px] font-mono">
                      {charCount} chars
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px] font-mono">
                      Empty
                    </span>
                  )}
                </div>

                <div className="font-serif text-sm font-bold text-[#101418] leading-snug line-clamp-1">
                  {def.title}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-[#54595d] font-mono">
                <span>{wordCount} words</span>
                <span className={`text-[10px] font-sans ${isSelected ? 'text-[#3366cc] font-semibold' : ''}`}>
                  {isSelected ? 'Active Editor' : 'Open Section →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Editor Body */}
      {viewMode === 'single' ? (
        <div>
          {renderSingleSectionEditor(
            ORIGINAL_FOUR_SECTIONS[activeSectionIndex],
            activeSectionIndex
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {ORIGINAL_FOUR_SECTIONS.map((def, idx) =>
            renderSingleSectionEditor(def, idx)
          )}
        </div>
      )}

      {/* Image Uploader Modal for Section Archival Figures */}
      {activeFigureSectionIndex !== null && (
        <ImageUploaderModal
          isOpen={true}
          onClose={() => setActiveFigureSectionIndex(null)}
          onSelect={(figData) => {
            handleAttachFigure(activeFigureSectionIndex, figData);
            setActiveFigureSectionIndex(null);
          }}
          currentFigure={safeSections[activeFigureSectionIndex]?.figure}
          sectionTitle={ORIGINAL_FOUR_SECTIONS[activeFigureSectionIndex]?.title || 'Section'}
        />
      )}
    </div>
  );
};

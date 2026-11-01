import React, { useState, useRef, useEffect } from 'react';
import { ArticleCitation } from '../../types';
import { sanitizeSafeUrl } from '../article/InlineCitationText';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  HelpCircle,
  BookOpen,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface EditorToolbarProps {
  onInsertMarkdown: (prefix: string, suffix?: string, placeholder?: string) => void;
  citations?: ArticleCitation[];
  className?: string;
  onOpenAiWritingTools?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onInsertMarkdown,
  citations = [],
  className = '',
  onOpenAiWritingTools,
}) => {
  const [citationDropdownOpen, setCitationDropdownOpen] = useState<boolean>(false);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const linkModalRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCitationDropdownOpen(false);
      }
      if (linkModalRef.current && !linkModalRef.current.contains(e.target as Node)) {
        setLinkModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus URL input when link modal opens
  useEffect(() => {
    if (linkModalOpen && urlInputRef.current) {
      setTimeout(() => urlInputRef.current?.focus(), 50);
    }
  }, [linkModalOpen]);

  const handleOpenLinkModal = () => {
    setCitationDropdownOpen(false);
    setLinkModalOpen(true);
    setLinkError(null);
  };

  const handleInsertLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawUrl = linkUrl.trim();
    if (!rawUrl) {
      setLinkError('Please enter or paste a valid web URL.');
      return;
    }

    const safeUrl = sanitizeSafeUrl(rawUrl);
    if (!safeUrl) {
      setLinkError('Invalid or unsafe link. Only secure http:// and https:// URLs are supported.');
      return;
    }

    const displayText = linkText.trim();
    if (displayText) {
      onInsertMarkdown(`[${displayText}](`, ')', safeUrl);
    } else {
      // Paste clean bare URL
      onInsertMarkdown(safeUrl, '', '');
    }

    setLinkUrl('');
    setLinkText('');
    setLinkError(null);
    setLinkModalOpen(false);
  };

  const tools = [
    {
      label: 'Bold Text',
      icon: <Bold size={13} />,
      action: () => onInsertMarkdown('**', '**', 'bold text'),
    },
    {
      label: 'Italic Text',
      icon: <Italic size={13} />,
      action: () => onInsertMarkdown('*', '*', 'italic text'),
    },
    {
      label: 'Section Heading (H2)',
      icon: <Heading2 size={13} />,
      action: () => onInsertMarkdown('## ', '\n', 'Section Title'),
    },
    {
      label: 'Subheading (H3)',
      icon: <Heading3 size={13} />,
      action: () => onInsertMarkdown('### ', '\n', 'Subsection Title'),
    },
    {
      label: 'Bullet List Item',
      icon: <List size={13} />,
      action: () => onInsertMarkdown('- ', '', 'List item'),
    },
    {
      label: 'Numbered List Item',
      icon: <ListOrdered size={13} />,
      action: () => onInsertMarkdown('1. ', '', 'Numbered point'),
    },
    {
      label: 'Blockquote / Scholar Citation',
      icon: <Quote size={13} />,
      action: () => onInsertMarkdown('> ', '', 'Historical quote or excerpt'),
    },
    {
      label: 'Inline Code / Monospace',
      icon: <Code size={13} />,
      action: () => onInsertMarkdown('`', '`', 'term'),
    },
  ];

  const handleInsertCitation = (citationId: number) => {
    onInsertMarkdown(`[${citationId}]`, '', '');
    setCitationDropdownOpen(false);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1 p-1.5 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm text-[#54595d] ${className}`}
      role="toolbar"
      aria-label="Formatting Controls"
    >
      <span className="text-[10px] font-mono uppercase text-[#72777d] px-1.5 font-bold">
        Format
      </span>
      <div className="h-4 w-px bg-[#cbd5e1] mx-0.5" />

      {tools.map((t, idx) => (
        <button
          key={idx}
          type="button"
          onClick={t.action}
          title={t.label}
          aria-label={t.label}
          className="p-1.5 hover:bg-[#eaecf0] hover:text-[#101418] active:bg-[#cbd5e1] text-[#54595d] rounded-sm transition-colors cursor-pointer"
        >
          {t.icon}
        </button>
      ))}

      {/* Hyperlink Inserter with Safe URL Modal */}
      <div className="relative" ref={linkModalRef}>
        <button
          type="button"
          onClick={handleOpenLinkModal}
          title="Insert Hyperlink / Source URL"
          aria-label="Insert Hyperlink"
          className={`p-1.5 rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
            linkModalOpen
              ? 'bg-[#eaecf0] text-[#3366cc]'
              : 'hover:bg-[#eaecf0] hover:text-[#101418] text-[#54595d]'
          }`}
        >
          <LinkIcon size={13} />
        </button>

        {linkModalOpen && (
          <div className="absolute left-0 top-full mt-1 w-80 bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#eaecf0]">
              <span className="text-[11px] font-mono uppercase text-[#3366cc] font-bold flex items-center gap-1">
                <LinkIcon size={12} />
                <span>Insert Web Hyperlink</span>
              </span>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-[#72777d] hover:text-[#101418] p-0.5 rounded-2xs cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#54595d] font-semibold mb-0.5">
                  Web URL (Required)
                </label>
                <input
                  ref={urlInputRef}
                  type="text"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    if (linkError) setLinkError(null);
                  }}
                  placeholder="https://example.com/official-report"
                  className="w-full text-xs font-mono p-1.5 border border-[#a2a9b1] focus:border-[#3366cc] focus:outline-none rounded-2xs bg-white text-[#202122]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#54595d] font-semibold mb-0.5">
                  Display Text (Optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. SEC Primary Filing Document"
                  className="w-full text-xs font-sans p-1.5 border border-[#a2a9b1] focus:border-[#3366cc] focus:outline-none rounded-2xs bg-white text-[#202122]"
                />
                <span className="text-[10px] text-[#72777d] block mt-0.5">
                  Leave blank to insert bare URL
                </span>
              </div>

              {linkError && (
                <div className="p-1.5 bg-red-50 border border-red-200 rounded-2xs text-red-700 text-[11px] flex items-start gap-1">
                  <AlertCircle size={12} className="shrink-0 mt-0.5 text-red-600" />
                  <span>{linkError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const sample = linkUrl.trim();
                    if (sample && sanitizeSafeUrl(sample)) {
                      window.open(sample, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  disabled={!linkUrl.trim() || !sanitizeSafeUrl(linkUrl.trim())}
                  className="text-[10px] font-mono text-[#3366cc] hover:underline disabled:text-slate-300 disabled:no-underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <ExternalLink size={10} />
                  <span>Test Link</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLinkModalOpen(false)}
                    className="px-2 py-1 text-xs text-[#54595d] hover:bg-[#eaecf0] rounded-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-medium text-white bg-[#3366cc] hover:bg-[#2855aa] rounded-xs cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Check size={11} />
                    <span>Insert Link</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Citation Inserter Dropdown */}
      <div className="h-4 w-px bg-[#cbd5e1] mx-0.5" />
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setCitationDropdownOpen(!citationDropdownOpen)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-[#ffffff] hover:bg-blue-50 text-[#3366cc] border border-[#cbd5e1] hover:border-[#3366cc] rounded-sm text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs"
          title="Insert inline reference tag e.g. [1]"
        >
          <BookOpen size={12} />
          <span>Cite Reference</span>
          <ChevronDown size={11} className="text-[#72777d]" />
        </button>

        {citationDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-64 max-h-52 overflow-y-auto bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#72777d] font-bold border-b border-[#eaecf0]">
              Select Source to Insert
            </div>

            {citations.length === 0 ? (
              <div className="p-3 text-[11px] text-[#54595d] text-center">
                No citations created yet. Add sources in the References section below.
              </div>
            ) : (
              citations.map((c, idx) => {
                const num = c.id || idx + 1;
                return (
                  <button
                    key={c.id || idx}
                    type="button"
                    onClick={() => handleInsertCitation(num)}
                    className="w-full text-left px-2 py-1.5 hover:bg-blue-50 text-xs text-[#101418] rounded-xs flex items-start gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="font-mono text-[#3366cc] font-bold text-[11px] shrink-0">
                      [{num}]
                    </span>
                    <span className="truncate font-serif text-[11px]">{c.title || `Untitled Reference ${num}`}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* AI Writer Assistant Button */}
      {onOpenAiWritingTools && (
        <>
          <div className="h-4 w-px bg-[#cbd5e1] mx-0.5" />
          <button
            type="button"
            onClick={onOpenAiWritingTools}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-[#3366cc] border border-blue-200 hover:border-[#3366cc] rounded-sm text-xs font-serif font-bold transition-all cursor-pointer shadow-xs"
            title="Open AI Article Writing & Research Assistant"
          >
            <Sparkles size={13} className="text-[#3366cc]" />
            <span>AI Scholar Tools</span>
          </button>
        </>
      )}

      <div className="ml-auto hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#72777d] pr-1">
        <HelpCircle size={12} className="text-[#72777d]" />
        <span>Structured Markdown &amp; Citations</span>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ArticleCitation } from '../../types';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCitationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    {
      label: 'Hyperlink',
      icon: <LinkIcon size={13} />,
      action: () => onInsertMarkdown('[', '](https://example.com)', 'Link Title'),
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

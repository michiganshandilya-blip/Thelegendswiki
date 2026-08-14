import React from 'react';
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
} from 'lucide-react';

interface EditorToolbarProps {
  onInsertMarkdown: (prefix: string, suffix?: string, placeholder?: string) => void;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onInsertMarkdown,
  className = '',
}) => {
  const tools = [
    {
      label: 'Bold Text',
      icon: <Bold size={14} />,
      action: () => onInsertMarkdown('**', '**', 'bold text'),
    },
    {
      label: 'Italic Text',
      icon: <Italic size={14} />,
      action: () => onInsertMarkdown('*', '*', 'italic text'),
    },
    {
      label: 'Section Heading (H2)',
      icon: <Heading2 size={14} />,
      action: () => onInsertMarkdown('## ', '\n', 'Section Title'),
    },
    {
      label: 'Subheading (H3)',
      icon: <Heading3 size={14} />,
      action: () => onInsertMarkdown('### ', '\n', 'Subsection Title'),
    },
    {
      label: 'Bullet List Item',
      icon: <List size={14} />,
      action: () => onInsertMarkdown('- ', '', 'List item'),
    },
    {
      label: 'Numbered List Item',
      icon: <ListOrdered size={14} />,
      action: () => onInsertMarkdown('1. ', '', 'Numbered point'),
    },
    {
      label: 'Blockquote / Scholar Citation',
      icon: <Quote size={14} />,
      action: () => onInsertMarkdown('> ', '', 'Historical quote or excerpt'),
    },
    {
      label: 'Inline Code / Monospace',
      icon: <Code size={14} />,
      action: () => onInsertMarkdown('`', '`', 'term'),
    },
    {
      label: 'Hyperlink',
      icon: <LinkIcon size={14} />,
      action: () => onInsertMarkdown('[', '](https://example.com)', 'Link Title'),
    },
  ];

  return (
    <div
      className={`flex flex-wrap items-center gap-1 p-1.5 bg-[#090e1a] border border-slate-800 rounded-sm text-slate-300 ${className}`}
      role="toolbar"
      aria-label="Formatting Controls"
    >
      <span className="text-[10px] font-mono uppercase text-slate-500 px-1.5 font-bold">
        Format
      </span>
      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {tools.map((t, idx) => (
        <button
          key={idx}
          type="button"
          onClick={t.action}
          title={t.label}
          aria-label={t.label}
          className="p-1.5 hover:bg-slate-800 hover:text-blue-300 active:bg-slate-700 text-slate-400 rounded-sm transition-colors cursor-pointer"
        >
          {t.icon}
        </button>
      ))}

      <div className="ml-auto hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-500 pr-1">
        <HelpCircle size={12} className="text-slate-500" />
        <span>Structured Markdown &amp; Semantic Paragraphs</span>
      </div>
    </div>
  );
};

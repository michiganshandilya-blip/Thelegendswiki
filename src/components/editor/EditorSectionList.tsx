import React from 'react';
import { ArticleSection } from '../../types';
import { EditorToolbar } from './EditorToolbar';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  FileText,
  ListPlus,
  Image as ImageIcon,
} from 'lucide-react';

interface EditorSectionListProps {
  sections: ArticleSection[];
  onChange: (sections: ArticleSection[]) => void;
}

export const EditorSectionList: React.FC<EditorSectionListProps> = ({
  sections,
  onChange,
}) => {
  // Add a new section
  const handleAddSection = () => {
    const nextIdx = sections.length + 1;
    const newSection: ArticleSection = {
      id: `section-${Date.now()}`,
      title: `Section ${nextIdx}`,
      content: [''],
      bulletPoints: [],
    };
    onChange([...sections, newSection]);
  };

  // Remove a section
  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) {
      // Keep at least one empty section
      onChange([
        {
          id: `section-${Date.now()}`,
          title: 'Overview',
          content: [''],
          bulletPoints: [],
        },
      ]);
      return;
    }
    const updated = sections.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  // Move section up/down
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onChange(copy);
  };

  // Update Section Title
  const handleTitleChange = (index: number, title: string) => {
    const copy = [...sections];
    // Generate clean section ID from title
    const cleanId = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `section-${index + 1}`;

    copy[index] = {
      ...copy[index],
      title,
      id: cleanId,
    };
    onChange(copy);
  };

  // Update Section Content text (multi-paragraph raw or array)
  const handleContentChange = (index: number, text: string) => {
    const copy = [...sections];
    // Split on double newlines to form clean paragraph array
    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    copy[index] = {
      ...copy[index],
      content: paragraphs.length > 0 ? paragraphs : [text],
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
    const section = sections[index];
    const rawContent = section.content.join('\n\n');
    const newContent = `${rawContent}${rawContent ? '\n\n' : ''}${prefix}${placeholder}${suffix}`;
    handleContentChange(index, newContent);
  };

  // Bullet Point handlers
  const handleAddBulletPoint = (index: number) => {
    const copy = [...sections];
    const existing = copy[index].bulletPoints || [];
    copy[index] = {
      ...copy[index],
      bulletPoints: [...existing, ''],
    };
    onChange(copy);
  };

  const handleUpdateBulletPoint = (sectionIndex: number, bulletIndex: number, val: string) => {
    const copy = [...sections];
    const points = [...(copy[sectionIndex].bulletPoints || [])];
    points[bulletIndex] = val;
    copy[sectionIndex] = {
      ...copy[sectionIndex],
      bulletPoints: points,
    };
    onChange(copy);
  };

  const handleRemoveBulletPoint = (sectionIndex: number, bulletIndex: number) => {
    const copy = [...sections];
    const points = (copy[sectionIndex].bulletPoints || []).filter((_, i) => i !== bulletIndex);
    copy[sectionIndex] = {
      ...copy[sectionIndex],
      bulletPoints: points,
    };
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-sky-400" />
          <h3 className="text-base font-bold text-slate-100 font-display">
            Article Sections &amp; Core Content
          </h3>
        </div>

        <button
          type="button"
          onClick={handleAddSection}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/40 rounded-sm text-xs font-semibold transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Add New Section</span>
        </button>
      </div>

      <div className="space-y-5">
        {sections.map((sec, idx) => {
          const rawText = (sec.content || []).join('\n\n');

          return (
            <div
              key={sec.id || idx}
              className="bg-[#0a0f1d] border border-slate-800 rounded-sm p-4 sm:p-5 space-y-3.5 shadow-sm transition-colors hover:border-slate-700"
            >
              {/* Section Header Controls */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-800/60 px-2 py-0.5 rounded-sm shrink-0">
                    § {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleTitleChange(idx, e.target.value)}
                    placeholder="Section Title (e.g. Historical Foundation)"
                    className="flex-1 bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-3 py-1 text-sm font-display font-semibold text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* Section Reorder & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveSection(idx, 'up')}
                    disabled={idx === 0}
                    title="Move section up"
                    className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    title="Move section down"
                    className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(idx)}
                    title="Delete section"
                    className="p-1 text-slate-500 hover:text-red-400 cursor-pointer ml-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <EditorToolbar
                onInsertMarkdown={(pre, suf, ph) =>
                  handleInsertMarkdownToSection(idx, pre, suf, ph)
                }
              />

              {/* Section Paragraph Textarea */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center justify-between">
                  <span>Section Paragraphs &amp; Body</span>
                  <span className="text-slate-500 font-normal">
                    Separate paragraphs with a blank line
                  </span>
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => handleContentChange(idx, e.target.value)}
                  rows={6}
                  placeholder="Write clear, encyclopedic content for this section. Support Markdown headings, quotes, bold, italics, and lists..."
                  className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none leading-relaxed transition-all font-sans"
                />
              </div>

              {/* Section Key Takeaways / Bullet Points List */}
              <div className="space-y-2 pt-1 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                    <ListPlus size={12} className="text-sky-400" />
                    <span>Bullet Points / Key Takeaways</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddBulletPoint(idx)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    + Add bullet point
                  </button>
                </div>

                {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                  <div className="space-y-1.5">
                    {sec.bulletPoints.map((bp, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-sky-400 text-xs font-mono">&bull;</span>
                        <input
                          type="text"
                          value={bp}
                          onChange={(e) => handleUpdateBulletPoint(idx, bIdx, e.target.value)}
                          placeholder="Highlight or key fact..."
                          className="flex-1 bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBulletPoint(idx, bIdx)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

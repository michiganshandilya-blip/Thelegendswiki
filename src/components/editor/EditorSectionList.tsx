import React, { useState } from 'react';
import { ArticleSection, ArticleImageFigure, ArticleCitation } from '../../types';
import { EditorToolbar } from './EditorToolbar';
import { ImageUploaderModal } from '../common/ImageUploaderModal';
import { validateImageAlt } from '../../lib/validation';
import { MANDATORY_DOSSIER_SECTIONS } from '../../lib/dossierStructure';
import {
  Plus,
  Trash2,
  Layers,
  ListPlus,
  Image as ImageIcon,
  Edit2,
  Info,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface EditorSectionListProps {
  sections: ArticleSection[];
  citations?: ArticleCitation[];
  categorySlug?: string;
  categoryName?: string;
  errors?: Record<string, string>;
  onChange: (sections: ArticleSection[]) => void;
  onOpenAiWritingTools?: (sectionIndex: number) => void;
}

export const EditorSectionList: React.FC<EditorSectionListProps> = ({
  sections,
  citations = [],
  categorySlug = 'behind-financial-markets',
  categoryName = 'Behind Financial Markets',
  errors = {},
  onChange,
  onOpenAiWritingTools,
}) => {
  const [activeFigureSectionIndex, setActiveFigureSectionIndex] = useState<number | null>(null);

  // Update Section Content text
  const handleContentChange = (index: number, text: string) => {
    const copy = [...sections];
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
    const rawContent = (section?.content || []).join('\n\n');
    const newContent = `${rawContent}${rawContent ? '\n\n' : ''}${prefix}${placeholder}${suffix}`;
    handleContentChange(index, newContent);
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
    const copy = [...sections];
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
    const copy = [...sections];
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
    const copy = [...sections];
    copy[index] = {
      ...copy[index],
      figure: undefined,
    };
    onChange(copy);
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
      {/* Dossier Structure Header Banner */}
      <div className="bg-[#f0f4f9] border border-[#3366cc]/40 rounded-sm p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#3366cc]/20">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#3366cc]" />
            <h3 className="text-base font-bold text-[#101418] font-serif">
              Standardized Investigative Dossier Structure
            </h3>
          </div>
          <span className="text-[11px] font-mono font-semibold text-[#3366cc] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            Mandatory 8 Dossier Sections + References
          </span>
        </div>

        <p className="text-xs text-[#54595d] mt-2 font-sans leading-relaxed">
          Every dossier in TheLegendsWiki follows an identical, evidence-based 8-part editorial structure across all five categories. Complete all required sections below with verified facts and source citations.
        </p>
      </div>

      {/* Render 8 Mandatory Dossier Sections */}
      <div className="space-y-6">
        {MANDATORY_DOSSIER_SECTIONS.map((def, idx) => {
          const sec = sections[idx] || {
            id: def.id,
            title: def.title,
            content: [''],
            bulletPoints: [],
          };
          const rawText = (sec.content || []).join('\n\n');
          const charCount = rawText.trim().length;
          const figure = sec.figure;
          const figAltCheck = figure ? validateImageAlt(figure.alt) : { isValid: true };
          const sectionError = errors[def.id] || (errors[`sections.${idx}`]);
          const categoryHint = def.categoryGuidance?.[categorySlug];

          return (
            <div
              key={def.id}
              id={`section-editor-${def.id}`}
              className={`bg-[#ffffff] border rounded-sm p-4 sm:p-5 space-y-3.5 shadow-xs transition-colors ${
                sectionError
                  ? 'border-red-400 ring-1 ring-red-300'
                  : 'border-[#a2a9b1] hover:border-[#3366cc]'
              }`}
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#eaecf0]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-white bg-[#3366cc] px-2.5 py-0.5 rounded-xs shrink-0">
                    § {def.order}
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#101418]">
                    {def.title}
                  </h4>
                  <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-xs font-semibold">
                    Required
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#72777d] font-mono">
                  {charCount > 0 ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-sans text-xs">
                      <CheckCircle2 size={13} /> {charCount} chars
                    </span>
                  ) : (
                    <span className="text-amber-700 font-sans text-xs">Pending content</span>
                  )}
                </div>
              </div>

              {/* Editorial Guidance & Helper Text */}
              <div className="bg-[#f8f9fa] border-l-2 border-[#3366cc] p-2.5 text-xs text-[#202122] rounded-r-xs space-y-1">
                <p className="text-[#374151] font-sans leading-relaxed">
                  <strong className="font-semibold text-[#111827]">Editorial Goal:</strong> {def.helperText}
                </p>
                {categoryHint && (
                  <p className="text-[#3366cc] font-sans text-[11px] leading-snug">
                    <span className="font-semibold">Context ({categoryName}):</span> {categoryHint}
                  </p>
                )}
              </div>

              {/* Section Validation Error Banner if empty */}
              {sectionError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xs text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-red-600" />
                  <span>{sectionError}</span>
                </div>
              )}

              {/* Formatting & Citation Toolbar */}
              <EditorToolbar
                citations={citations}
                onInsertMarkdown={(pre, suf, ph) =>
                  handleInsertMarkdownToSection(idx, pre, suf, ph)
                }
                onOpenAiWritingTools={
                  onOpenAiWritingTools ? () => onOpenAiWritingTools(idx) : undefined
                }
              />

              {/* Section Paragraph Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase text-[#54595d] font-bold">
                    Dossier Text &bull; Section {def.order}
                  </label>
                  <span className="text-[11px] text-[#72777d] font-sans">
                    Separate paragraphs with empty line &bull; Use <code className="font-mono text-[#3366cc]">[1]</code> for citations
                  </span>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => handleContentChange(idx, e.target.value)}
                  rows={5}
                  placeholder={def.placeholder}
                  className={`w-full bg-[#ffffff] border rounded-sm p-3 text-xs sm:text-sm text-[#202122] placeholder-[#72777d] focus:outline-none leading-relaxed transition-all font-sans ${
                    sectionError ? 'border-red-400 focus:border-red-500' : 'border-[#a2a9b1] focus:border-[#3366cc]'
                  }`}
                />
              </div>

              {/* Section Figure / Image Management */}
              <div className="pt-2 border-t border-[#eaecf0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#54595d] font-bold flex items-center gap-1">
                    <ImageIcon size={12} className="text-[#3366cc]" />
                    <span>Section Illustration / Archival Figure</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveFigureSectionIndex(idx)}
                    className="text-[11px] text-[#3366cc] hover:underline font-semibold font-mono cursor-pointer flex items-center gap-1"
                  >
                    {figure ? <Edit2 size={11} /> : <Plus size={11} />}
                    <span>{figure ? 'Change Section Figure' : '+ Attach Section Figure'}</span>
                  </button>
                </div>

                {figure && (
                  <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      {/* Image Thumbnail Preview */}
                      <div className="w-24 h-18 bg-[#ffffff] border border-[#cbd5e1] rounded-xs overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={figure.url}
                          alt={figure.alt || 'Section illustration'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2 w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#3366cc] bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-xs">
                            Alignment: {figure.align?.toUpperCase() || 'RIGHT'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFigure(idx)}
                            className="text-[10px] font-mono text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} /> Remove Figure
                          </button>
                        </div>

                        {/* Alt text */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                            Alt Text (Accessibility) <strong className="text-red-500">*</strong>
                          </label>
                          <input
                            type="text"
                            value={figure.alt || ''}
                            onChange={(e) => handleUpdateFigureField(idx, 'alt', e.target.value)}
                            placeholder="Descriptive text for accessibility..."
                            className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2 py-1 text-xs text-[#202122] focus:outline-none"
                          />
                          {!figAltCheck.isValid && (
                            <p className="text-[9px] text-amber-700 mt-0.5 flex items-center gap-1 font-sans">
                              <Info size={10} /> {figAltCheck.message}
                            </p>
                          )}
                        </div>

                        {/* Caption, Credit & Alignment */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="block text-[9px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                              Caption
                            </label>
                            <input
                              type="text"
                              value={figure.caption || ''}
                              onChange={(e) => handleUpdateFigureField(idx, 'caption', e.target.value)}
                              placeholder="Visible caption..."
                              className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2 py-1 text-xs text-[#202122] focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="block text-[9px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                              Credit
                            </label>
                            <input
                              type="text"
                              value={figure.credit || ''}
                              onChange={(e) => handleUpdateFigureField(idx, 'credit', e.target.value)}
                              placeholder="Source archive..."
                              className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2 py-1 text-xs text-[#202122] focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="block text-[9px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                              Alignment
                            </label>
                            <select
                              value={figure.align || 'right'}
                              onChange={(e) => handleUpdateFigureField(idx, 'align', e.target.value)}
                              className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2 py-1 text-xs text-[#202122] focus:outline-none"
                            >
                              <option value="right">Right Float</option>
                              <option value="left">Left Float</option>
                              <option value="center">Centered</option>
                              <option value="full">Full Width</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Key Takeaways / Bullet Points List */}
              <div className="space-y-2 pt-2 border-t border-[#eaecf0]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#54595d] font-bold flex items-center gap-1">
                    <ListPlus size={12} className="text-[#3366cc]" />
                    <span>Bullet Points / Key Findings</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddBulletPoint(idx)}
                    className="text-[11px] text-[#3366cc] hover:underline font-semibold cursor-pointer"
                  >
                    + Add bullet point
                  </button>
                </div>

                {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                  <div className="space-y-1.5">
                    {sec.bulletPoints.map((bp, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-[#3366cc] text-xs font-mono">&bull;</span>
                        <input
                          type="text"
                          value={bp}
                          onChange={(e) => handleUpdateBulletPoint(idx, bIdx, e.target.value)}
                          placeholder="Highlight key evidentiary finding or record..."
                          className="flex-1 bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1 text-xs text-[#202122] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBulletPoint(idx, bIdx)}
                          className="text-[#72777d] hover:text-red-600 p-1 cursor-pointer"
                          aria-label="Remove bullet point"
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

      {/* Image Uploader Modal for Section Figures */}
      {activeFigureSectionIndex !== null && (
        <ImageUploaderModal
          isOpen={activeFigureSectionIndex !== null}
          onClose={() => setActiveFigureSectionIndex(null)}
          onSelect={(figData) => {
            handleAttachFigure(activeFigureSectionIndex, figData);
          }}
          initialData={sections[activeFigureSectionIndex]?.figure}
          title={`Attach Figure to Section §${activeFigureSectionIndex + 1}: ${
            sections[activeFigureSectionIndex]?.title || MANDATORY_DOSSIER_SECTIONS[activeFigureSectionIndex]?.title || 'Section'
          }`}
          allowAlignment={true}
        />
      )}
    </div>
  );
};

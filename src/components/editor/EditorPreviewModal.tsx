import React from 'react';
import { Article } from '../../types';
import { TableOfContents } from '../article/TableOfContents';
import { ArticleInfobox } from '../article/ArticleInfobox';
import { ReferenceList } from '../article/ReferenceList';
import { X, Eye, Clock, Calendar, Tag, Sparkles } from 'lucide-react';

interface EditorPreviewModalProps {
  article: Partial<Article>;
  isOpen: boolean;
  onClose: () => void;
}

export const EditorPreviewModal: React.FC<EditorPreviewModalProps> = ({
  article,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const sections = article.sections || [];
  const citations = article.citations || article.references || [];
  const tags = article.tags || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-[#0b101e] border border-slate-700/80 rounded-sm w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#080c16] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-sky-400" />
            <h2 id="preview-modal-title" className="text-sm font-bold text-slate-100 font-display">
              Encyclopedia Article Preview
            </h2>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-sm">
              Live Draft View
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
            aria-label="Close preview modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Article Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Header & Lead */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
              <span>{article.category || 'General'}</span>
              {article.subCategory && (
                <>
                  <span className="text-slate-600">&bull;</span>
                  <span>{article.subCategory}</span>
                </>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 leading-tight">
              {article.title || 'Untitled Article'}
            </h1>

            {/* Summary Lead Box */}
            {article.summary && (
              <div className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans bg-[#0e1422] border border-[#1e293b] p-4 rounded-sm border-l-4 border-l-sky-500">
                <p className="m-0">{article.summary}</p>
              </div>
            )}

            {/* Metadata bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 border-t border-[#1e293b] font-sans">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} className="text-sky-400" />
                <span>{article.readingTimeMinutes || 3} min read</span>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="inline-flex items-center gap-1 font-mono">
                <Calendar size={12} className="text-slate-500" />
                <span>Draft Preview</span>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-300">
                Author: {article.author || 'Current Contributor'}
              </span>
            </div>
          </div>

          {/* Grid Layout (Left Content, Right Infobox) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
            <div className="lg:col-span-8 space-y-6">
              {/* TOC */}
              {sections.length > 0 && (
                <TableOfContents
                  sections={sections}
                  hasReferences={citations.length > 0}
                  hasRelated={false}
                />
              )}

              {/* Sections */}
              <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
                {sections.map((section, sIdx) => (
                  <section key={section.id || sIdx} className="space-y-3">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100 border-b border-[#1e293b] pb-1.5 pt-2">
                      <span className="text-sky-400 font-mono font-normal text-base mr-2">
                        {sIdx + 1}.
                      </span>
                      {section.title}
                    </h2>

                    {(section.content || []).map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-slate-300 leading-relaxed font-sans">
                        {paragraph}
                      </p>
                    ))}

                    {section.bulletPoints && section.bulletPoints.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1.5 text-slate-300 marker:text-sky-400">
                        {section.bulletPoints.map((point, bIdx) => (
                          <li key={bIdx} className="leading-relaxed pl-1">
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              {/* Citations */}
              {citations.length > 0 && <ReferenceList citations={citations} />}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="pt-4 border-t border-[#1e293b] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Tag size={13} className="text-sky-400" />
                    <span>Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[#0e1422] text-slate-400 rounded-sm text-xs border border-[#1e293b]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Infobox if enabled */}
            <div className="lg:col-span-4 w-full space-y-4">
              {article.infobox && <ArticleInfobox infobox={article.infobox} />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#080c16] border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

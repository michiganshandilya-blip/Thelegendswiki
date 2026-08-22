import React from 'react';
import { Article } from '../../types';
import { TableOfContents } from '../article/TableOfContents';
import { ArticleInfobox } from '../article/ArticleInfobox';
import { ArticleFigure } from '../article/ArticleFigure';
import { InlineCitationText } from '../article/InlineCitationText';
import { ReferenceList } from '../article/ReferenceList';
import { X, Eye, Clock, Calendar, Tag } from 'lucide-react';

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
  const heroImage = article.featuredImage || article.image;
  const hasInfoboxImage = Boolean(article.infobox?.image);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f8f9fa] border-b border-[#eaecf0]">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-[#3366cc]" />
            <h2 id="preview-modal-title" className="text-sm font-bold text-[#101418] font-serif">
              Article Preview
            </h2>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-sm">
              Live Draft View
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#72777d] hover:text-[#101418] hover:bg-[#eaecf0] rounded-sm transition-colors cursor-pointer"
            aria-label="Close preview modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Article Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 bg-[#ffffff]">
          {/* Header & Lead */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#3366cc]">
              <span>{article.category || 'General'}</span>
              {article.subCategory && (
                <>
                  <span className="text-[#a2a9b1]">&bull;</span>
                  <span>{article.subCategory}</span>
                </>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#101418] leading-tight">
              {article.title || 'Untitled Article'}
            </h1>

            {/* Main Hero Figure if provided and not in infobox */}
            {heroImage && !hasInfoboxImage && (
              <ArticleFigure
                figure={{
                  url: heroImage,
                  caption: article.imageCaption || `Historical reference illustration for ${article.title}`,
                  alt: article.imageAlt || article.imageCaption || `Archival depiction of ${article.title}`,
                  credit: article.imageCredit,
                  align: 'right',
                }}
              />
            )}

            {/* Summary Lead Box with inline citations */}
            {article.summary && (
              <div className="text-sm sm:text-base text-[#202122] leading-relaxed font-sans bg-[#f8f9fa] border border-[#eaecf0] p-4 rounded-sm border-l-4 border-l-[#3366cc]">
                <p className="m-0">
                  <InlineCitationText
                    text={article.summary}
                    citations={citations}
                    paragraphId="preview-lead"
                  />
                </p>
              </div>
            )}

            {/* Metadata bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#54595d] pt-2 border-t border-[#eaecf0] font-sans">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} className="text-[#3366cc]" />
                <span>{article.readingTimeMinutes || 3} min read</span>
              </span>
              <span className="text-[#cbd5e1]">&bull;</span>
              <span className="inline-flex items-center gap-1 font-mono">
                <Calendar size={12} className="text-[#72777d]" />
                <span>Draft Preview</span>
              </span>
              <span className="text-[#cbd5e1]">&bull;</span>
              <span className="text-[#101418]">
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
              <div className="space-y-6 text-[#202122] text-sm leading-relaxed">
                {sections.map((section, sIdx) => (
                  <section key={section.id || sIdx} className="space-y-3">
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#101418] border-b border-[#a2a9b1] pb-1.5 pt-2">
                      <span className="text-[#3366cc] font-mono font-normal text-base mr-2">
                        {sIdx + 1}.
                      </span>
                      {section.title}
                    </h2>

                    {section.figure && <ArticleFigure figure={section.figure} />}

                    {(section.content || []).map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-[#202122] leading-relaxed font-sans">
                        <InlineCitationText
                          text={paragraph}
                          citations={citations}
                          paragraphId={`preview-s${sIdx}-p${pIdx}`}
                        />
                      </p>
                    ))}

                    {section.bulletPoints && section.bulletPoints.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1.5 text-[#202122] marker:text-[#3366cc]">
                        {section.bulletPoints.map((point, bIdx) => (
                          <li key={bIdx} className="leading-relaxed pl-1">
                            <InlineCitationText
                              text={point}
                              citations={citations}
                              paragraphId={`preview-s${sIdx}-b${bIdx}`}
                            />
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
                <div className="pt-4 border-t border-[#eaecf0] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#54595d] uppercase tracking-wider">
                    <Tag size={13} className="text-[#3366cc]" />
                    <span>Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[#f8f9fa] text-[#54595d] rounded-sm text-xs border border-[#cbd5e1]"
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
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#eaecf0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

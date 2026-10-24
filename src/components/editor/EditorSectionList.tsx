import React, { useState } from 'react';
import { ArticleSection, ArticleImageFigure, ArticleCitation, EpistemicEvidenceClaim, EpistemicClassification } from '../../types';
import { EditorToolbar } from './EditorToolbar';
import { ImageUploaderModal } from '../common/ImageUploaderModal';
import { validateImageAlt } from '../../lib/validation';
import {
  MANDATORY_DOSSIER_SECTIONS,
  ARTICLE_WORKFLOW_SECTIONS,
  WorkflowSectionDefinition,
  DossierSectionDefinition,
} from '../../lib/dossierStructure';
import {
  EPISTEMIC_EVIDENCE_STANDARDS,
  EpistemicClassificationBadge,
  normalizeClassification,
} from '../article/EpistemicEvidenceCard';
import {
  Plus,
  Trash2,
  Layers,
  Image as ImageIcon,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  FileText,
  LayoutList,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
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
  const [activeWorkflowIndex, setActiveWorkflowIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'step' | 'all'>('step');
  const [activeFigureSectionIndex, setActiveFigureSectionIndex] = useState<number | null>(null);

  // Update Section Content text
  const handleContentChange = (index: number, text: string) => {
    const copy = [...sections];
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

  // Epistemic Claim Handlers
  const handleAddClaim = (sectionIndex: number) => {
    const copy = [...sections];
    const currentClaims = copy[sectionIndex].claims || [];
    const newClaim: EpistemicEvidenceClaim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      claim: '',
      classification: 'CONFIRMED',
      sourceTitle: '',
      sourceUrl: '',
      explanation: '',
    };
    copy[sectionIndex] = {
      ...copy[sectionIndex],
      claims: [...currentClaims, newClaim],
    };
    onChange(copy);
  };

  const handleUpdateClaim = (
    sectionIndex: number,
    claimId: string,
    field: keyof EpistemicEvidenceClaim,
    val: any
  ) => {
    const copy = [...sections];
    const currentClaims = copy[sectionIndex].claims || [];
    copy[sectionIndex] = {
      ...copy[sectionIndex],
      claims: currentClaims.map((c) =>
        c.id === claimId ? { ...c, [field]: val } : c
      ),
    };
    onChange(copy);
  };

  const handleRemoveClaim = (sectionIndex: number, claimId: string) => {
    const copy = [...sections];
    const currentClaims = copy[sectionIndex].claims || [];
    copy[sectionIndex] = {
      ...copy[sectionIndex],
      claims: currentClaims.filter((c) => c.id !== claimId),
    };
    onChange(copy);
  };

  const scrollToTop = () => {
    const container = document.getElementById('dossier-workflow-top');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToNextSection = () => {
    if (activeWorkflowIndex < ARTICLE_WORKFLOW_SECTIONS.length - 1) {
      setActiveWorkflowIndex((prev) => prev + 1);
      scrollToTop();
    }
  };

  const goToPrevSection = () => {
    if (activeWorkflowIndex > 0) {
      setActiveWorkflowIndex((prev) => prev - 1);
      scrollToTop();
    }
  };

  // Helper to determine field index in the underlying MANDATORY_DOSSIER_SECTIONS list
  const getFieldGlobalIndex = (fieldId: string): number => {
    return MANDATORY_DOSSIER_SECTIONS.findIndex((d) => d.id === fieldId);
  };

  // Helper to check validation status for a workflow section
  const getWorkflowSectionStats = (wfSection: WorkflowSectionDefinition) => {
    let totalChars = 0;
    let allValid = true;
    let hasError = false;

    wfSection.fieldIds.forEach((fieldId) => {
      const idx = getFieldGlobalIndex(fieldId);
      const sec = sections[idx];
      const rawText = (sec?.content || []).join('\n\n').trim();
      totalChars += rawText.length;
      if (rawText.length < 15) {
        allValid = false;
      }
      if (errors[fieldId] || errors[`sections.${idx}`]) {
        hasError = true;
      }
    });

    return { totalChars, allValid, hasError };
  };

  // Render a single field within a workflow section
  const renderFieldEditor = (def: DossierSectionDefinition) => {
    const idx = getFieldGlobalIndex(def.id);
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
    const fieldError = errors[def.id] || errors[`sections.${idx}`];
    const categoryHint = def.categoryGuidance?.[categorySlug];

    return (
      <div
        key={def.id}
        id={`section-editor-${def.id}`}
        className={`bg-[#ffffff] border rounded-sm p-4 sm:p-5 space-y-3.5 shadow-2xs transition-colors ${
          fieldError
            ? 'border-red-400 ring-1 ring-red-300'
            : 'border-[#c8ccd1] hover:border-[#3366cc]'
        }`}
      >
        {/* Field Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#eaecf0]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="font-serif text-base font-bold text-[#101418] flex items-center gap-2">
              <FileText size={15} className="text-[#3366cc]" />
              <span>{def.title}</span>
            </h4>
            <span className="text-[10px] font-mono uppercase bg-blue-50 text-[#3366cc] border border-blue-200 px-1.5 py-0.5 rounded-xs font-semibold">
              Required Dossier Field
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#72777d] font-mono">
            {charCount >= 15 ? (
              <span className="text-emerald-700 flex items-center gap-1 font-sans text-xs font-medium">
                <CheckCircle2 size={13} /> {charCount} chars (Valid)
              </span>
            ) : charCount > 0 ? (
              <span className="text-amber-700 font-sans text-xs">
                {charCount} chars (Min 15 required)
              </span>
            ) : (
              <span className="text-amber-700 font-sans text-xs font-medium">
                Pending content
              </span>
            )}
          </div>
        </div>

        {/* Editorial Guidance & Helper Text */}
        <div className="bg-[#f8f9fa] border-l-2 border-[#3366cc] p-3 text-xs text-[#202122] rounded-r-xs space-y-1">
          <p className="text-[#374151] font-sans leading-relaxed">
            <strong className="font-semibold text-[#111827]">Editorial Goal:</strong> {def.helperText}
          </p>
          {categoryHint && (
            <p className="text-[#3366cc] font-sans text-[11px] leading-snug">
              <span className="font-semibold">Investigation Guidance ({categoryName}):</span> {categoryHint}
            </p>
          )}
        </div>

        {/* Validation Error Banner */}
        {fieldError && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xs text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-red-600" />
            <span>{fieldError}</span>
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

        {/* Paragraph Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-mono uppercase text-[#54595d] font-bold">
              {def.title} Text
            </label>
            <span className="text-[11px] text-[#72777d] font-sans">
              Separate paragraphs with empty line &bull; Cite references using <code className="font-mono text-[#3366cc]">[1]</code>
            </span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => handleContentChange(idx, e.target.value)}
            rows={5}
            placeholder={def.placeholder}
            className={`w-full bg-[#ffffff] border rounded-sm p-3 text-xs sm:text-sm text-[#202122] placeholder-[#72777d] focus:outline-none leading-relaxed transition-all font-sans ${
              fieldError
                ? 'border-red-400 focus:border-red-500 ring-1 ring-red-300'
                : 'border-[#a2a9b1] focus:border-[#3366cc]'
            }`}
          />
        </div>

        {/* Section Figure / Image Management */}
        <div className="pt-2 border-t border-[#eaecf0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#54595d] font-bold flex items-center gap-1">
              <ImageIcon size={12} className="text-[#3366cc]" />
              <span>Archival Figure / Diagram (Optional)</span>
            </span>

            <button
              type="button"
              onClick={() => setActiveFigureSectionIndex(idx)}
              className="text-[11px] text-[#3366cc] hover:underline font-semibold font-mono cursor-pointer flex items-center gap-1"
            >
              {figure ? <Edit2 size={11} /> : <Plus size={11} />}
              <span>{figure ? 'Change Archival Figure' : '+ Attach Archival Figure'}</span>
            </button>
          </div>

          {figure && (
            <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-3 items-start">
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

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                      Alternative Text (Alt) <strong className="text-red-500">*</strong>
                    </label>
                    <input
                      type="text"
                      value={figure.alt || ''}
                      onChange={(e) =>
                        handleUpdateFigureField(idx, 'alt', e.target.value)
                      }
                      placeholder="Describe figure for screen readers..."
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2 py-1 text-xs text-[#202122] focus:outline-none"
                    />
                    {!figAltCheck.isValid && (
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        {figAltCheck.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                        Caption
                      </label>
                      <input
                        type="text"
                        value={figure.caption || ''}
                        onChange={(e) =>
                          handleUpdateFigureField(idx, 'caption', e.target.value)
                        }
                        placeholder="Caption shown below figure..."
                        className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2 py-1 text-xs text-[#202122] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                        Alignment
                      </label>
                      <select
                        value={figure.align || 'right'}
                        onChange={(e) =>
                          handleUpdateFigureField(idx, 'align', e.target.value)
                        }
                        className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2 py-1 text-xs text-[#202122] focus:outline-none font-sans"
                      >
                        <option value="right">Right (Float)</option>
                        <option value="left">Left (Float)</option>
                        <option value="center">Center</option>
                        <option value="full">Full Width</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Epistemic Evidence Standards & Claim Classification Panel */}
        {/* Featured primarily in Evidence & Documentation, and available on any field with claims */}
        {(def.id === 'evidence-documentation' || (sec.claims && sec.claims.length > 0)) && (
          <div className="pt-3 border-t border-[#eaecf0] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#f8fafc] border border-[#cbd5e1] p-3 rounded-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#3366cc]" />
                  <span className="text-xs font-mono font-bold uppercase text-[#101418] tracking-wide">
                    Epistemic Evidence Standards &amp; Claim Classifications
                  </span>
                </div>
                <p className="text-[11px] text-[#54595d] font-sans">
                  Classify individual evidence claims under the 4-Tier Epistemic Standard with supporting document links and verification rationale.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddClaim(idx)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold font-mono cursor-pointer transition-all shadow-xs shrink-0 self-start sm:self-auto"
              >
                <Plus size={13} />
                <span>+ Add Epistemic Claim</span>
              </button>
            </div>

            {/* Claims list */}
            {(!sec.claims || sec.claims.length === 0) ? (
              <div className="p-3 bg-white border border-dashed border-[#cbd5e1] rounded-sm text-center text-xs text-[#72777d] font-sans space-y-1">
                <p>No epistemic claims classified yet for this section.</p>
                <p className="text-[11px] text-[#54595d]">
                  Click <strong className="text-[#3366cc]">+ Add Epistemic Claim</strong> to assign Confirmed, Disputed, Alleged, or Theory classifications to specific evidence points.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {sec.claims.map((claimItem, cIdx) => {
                  const currentNorm = normalizeClassification(claimItem.classification);

                  return (
                    <div
                      key={claimItem.id || cIdx}
                      className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-3.5 sm:p-4 space-y-3 shadow-2xs"
                    >
                      {/* Top Bar: Claim Index & Remove Button */}
                      <div className="flex items-center justify-between pb-2 border-b border-[#eaecf0]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#101418]">
                            Claim #{cIdx + 1}
                          </span>
                          <EpistemicClassificationBadge classification={currentNorm} size="sm" />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveClaim(idx, claimItem.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:underline font-mono inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Remove Claim</span>
                        </button>
                      </div>

                      {/* 1. SELECTABLE 4 CLASSIFICATIONS (VISUAL CARDS) */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1.5">
                          Select Epistemic Classification <strong className="text-red-500">*</strong>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {(['CONFIRMED', 'DISPUTED', 'ALLEGED', 'THEORY'] as EpistemicClassification[]).map((typeKey) => {
                            const optMeta = EPISTEMIC_EVIDENCE_STANDARDS[typeKey];
                            const isSelected = currentNorm === typeKey;
                            const OptIcon = optMeta.icon;

                            return (
                              <button
                                key={typeKey}
                                type="button"
                                onClick={() => handleUpdateClaim(idx, claimItem.id, 'classification', typeKey)}
                                className={`p-2.5 rounded-sm border text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                                  isSelected
                                    ? optMeta.optionButton.selected
                                    : optMeta.optionButton.base
                                }`}
                              >
                                {isSelected && (
                                  <span className="absolute top-2 right-2 text-emerald-700 font-bold">
                                    <Check size={14} />
                                  </span>
                                )}

                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 font-mono font-bold uppercase text-[11px] leading-tight">
                                    <OptIcon size={13} className={optMeta.lightBadge.iconColor} />
                                    <span>{optMeta.badgeLabel}</span>
                                  </div>

                                  <p className="text-[10px] text-[#4b5563] font-sans leading-snug">
                                    {optMeta.shortExplanation}
                                  </p>
                                </div>

                                <div className="mt-2 text-[9px] font-mono uppercase tracking-wider text-[#6b7280]">
                                  {isSelected ? '● Active Selection' : 'Click to Select'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. CLAIM / EVIDENCE STATEMENT */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                          Claim or Evidentiary Statement <strong className="text-red-500">*</strong>
                        </label>
                        <input
                          type="text"
                          value={claimItem.claim}
                          onChange={(e) => handleUpdateClaim(idx, claimItem.id, 'claim', e.target.value)}
                          placeholder="e.g. Internal memorandum dated Oct 14 confirmed executive awareness of undisclosed liabilities..."
                          className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-3 py-1.5 text-xs text-[#202122] focus:outline-none font-sans"
                        />
                      </div>

                      {/* 3. SUPPORTING SOURCE & URL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                            Supporting Source / Document Name
                          </label>
                          <input
                            type="text"
                            value={claimItem.sourceTitle || ''}
                            onChange={(e) => handleUpdateClaim(idx, claimItem.id, 'sourceTitle', e.target.value)}
                            placeholder="e.g. SEC Deposition Ex. 402, Senate Hearing Transcript..."
                            className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1 text-xs text-[#202122] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                            Source Document URL (Link)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="url"
                              value={claimItem.sourceUrl || ''}
                              onChange={(e) => handleUpdateClaim(idx, claimItem.id, 'sourceUrl', e.target.value)}
                              placeholder="https://archive.org/... or official link"
                              className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1 text-xs text-[#202122] focus:outline-none font-mono pr-7"
                            />
                            {claimItem.sourceUrl && (
                              <a
                                href={claimItem.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute right-2 text-[#3366cc] hover:text-[#2557bb]"
                                title="Open URL in new tab"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 4. SHORT EXPLANATION / EPISTEMIC RATIONALE */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                          Short Explanation &amp; Verification Rationale
                        </label>
                        <textarea
                          value={claimItem.explanation || ''}
                          onChange={(e) => handleUpdateClaim(idx, claimItem.id, 'explanation', e.target.value)}
                          rows={2}
                          placeholder="Provide context explaining why this classification was chosen and how the evidence corroborates or disputes the claim..."
                          className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-3 py-1.5 text-xs text-[#202122] focus:outline-none leading-relaxed font-sans"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Subtle add button for non-evidence fields if no claims yet */}
        {def.id !== 'evidence-documentation' && (!sec.claims || sec.claims.length === 0) && (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => handleAddClaim(idx)}
              className="text-[11px] text-[#3366cc] hover:underline font-mono inline-flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck size={12} />
              <span>+ Add Epistemic Claim to {def.title}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render one of the 4 complete workflow sections
  const renderWorkflowSection = (wfSection: WorkflowSectionDefinition, wfIndex: number) => {
    const stats = getWorkflowSectionStats(wfSection);
    const isCurrent = activeWorkflowIndex === wfIndex;

    return (
      <div
        key={wfSection.id}
        id={`workflow-section-${wfSection.order}`}
        className="bg-[#fafbfc] border border-[#a2a9b1] rounded-sm p-4 sm:p-6 space-y-5 shadow-xs"
      >
        {/* Workflow Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#c8ccd1]">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-white bg-[#3366cc] px-2.5 py-0.5 rounded-xs tracking-wider">
                SECTION {wfSection.order} OF 4
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#101418]">
                {wfSection.order}. {wfSection.title}
              </h3>
            </div>
            <p className="text-xs text-[#54595d] mt-1 font-sans">
              {wfSection.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-[#54595d] bg-white border border-[#c8ccd1] px-2.5 py-1 rounded-xs">
              {stats.totalChars.toLocaleString()} total chars
            </span>
            {stats.allValid ? (
              <span className="inline-flex items-center gap-1 text-xs font-sans font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xs">
                <CheckCircle2 size={13} /> Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-sans font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xs">
                <AlertCircle size={13} /> In Progress
              </span>
            )}
          </div>
        </div>

        {/* Combined Fields Container */}
        <div className="space-y-5">
          {wfSection.fieldIds.map((fieldId) => {
            const def = MANDATORY_DOSSIER_SECTIONS.find((d) => d.id === fieldId);
            if (!def) return null;
            return renderFieldEditor(def);
          })}
        </div>

        {/* Workflow Navigation Controls (Next / Back) */}
        {viewMode === 'step' && (
          <div className="pt-4 border-t border-[#c8ccd1] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {wfIndex > 0 ? (
                <button
                  type="button"
                  onClick={goToPrevSection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-all shadow-xs"
                >
                  <ArrowLeft size={13} />
                  <span>Back: Section {wfIndex} ({ARTICLE_WORKFLOW_SECTIONS[wfIndex - 1].title})</span>
                </button>
              ) : (
                <span className="text-xs text-[#72777d] font-mono">
                  Beginning of Dossier Workflow
                </span>
              )}
            </div>

            <div className="text-xs font-mono text-[#54595d]">
              Section {wfSection.order} of {ARTICLE_WORKFLOW_SECTIONS.length}
            </div>

            <div>
              {wfIndex < ARTICLE_WORKFLOW_SECTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={goToNextSection}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold font-mono cursor-pointer transition-all shadow-xs"
                >
                  <span>Next: Section {wfIndex + 2} ({ARTICLE_WORKFLOW_SECTIONS[wfIndex + 1].title})</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm text-xs font-semibold font-mono">
                  <Check size={13} />
                  <span>All 4 Sections Configured</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="dossier-workflow-top" className="space-y-4">
      {/* Dossier Structure Header Banner */}
      <div className="bg-[#f0f4f9] border border-[#3366cc]/40 rounded-sm p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#3366cc]/20">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#3366cc]" />
            <h3 className="text-base font-bold text-[#101418] font-serif">
              Article Writing Workflow (4 Sections)
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono font-semibold text-[#3366cc] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              4 Sections
            </span>
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xs border border-[#3366cc]/40 overflow-hidden text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setViewMode('step')}
                className={`px-2.5 py-0.5 cursor-pointer transition-colors ${
                  viewMode === 'step'
                    ? 'bg-[#3366cc] text-white font-bold'
                    : 'bg-white text-[#3366cc] hover:bg-blue-50'
                }`}
              >
                Step View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-0.5 cursor-pointer transition-colors ${
                  viewMode === 'all'
                    ? 'bg-[#3366cc] text-white font-bold'
                    : 'bg-white text-[#3366cc] hover:bg-blue-50'
                }`}
              >
                All 4 Sections
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#54595d] mt-2 font-sans leading-relaxed">
          The article dossier is composed of exactly 4 structured sections: <strong>1. Case Overview</strong>, <strong>2. Investigation & Evidence</strong>, <strong>3. Impact & Unresolved Questions</strong>, and <strong>4. Dossier Conclusion</strong>. Fill out each section with verified evidentiary details and link your sources.
        </p>
      </div>

      {/* 4-Section Step Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {ARTICLE_WORKFLOW_SECTIONS.map((wf, idx) => {
          const stats = getWorkflowSectionStats(wf);
          const isActive = viewMode === 'step' && activeWorkflowIndex === idx;

          return (
            <button
              key={wf.id}
              type="button"
              onClick={() => {
                setActiveWorkflowIndex(idx);
                if (viewMode === 'all') {
                  const el = document.getElementById(`workflow-section-${wf.order}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`p-3 rounded-sm border text-left cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-50 border-[#3366cc] shadow-xs ring-1 ring-[#3366cc]'
                  : stats.hasError
                  ? 'bg-red-50/50 border-red-300 hover:border-red-400'
                  : 'bg-white border-[#c8ccd1] hover:border-[#3366cc]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs ${
                    isActive
                      ? 'bg-[#3366cc] text-white'
                      : 'bg-[#eaecf0] text-[#54595d]'
                  }`}
                >
                  Section {wf.order}
                </span>

                {stats.allValid ? (
                  <span className="text-emerald-700 flex items-center gap-0.5 text-[11px] font-medium font-sans">
                    <CheckCircle2 size={12} /> Complete
                  </span>
                ) : stats.hasError ? (
                  <span className="text-red-600 flex items-center gap-0.5 text-[11px] font-medium font-sans">
                    <AlertCircle size={12} /> Needs Info
                  </span>
                ) : (
                  <span className="text-[#72777d] text-[11px] font-mono">
                    {stats.totalChars > 0 ? `${stats.totalChars}c` : 'Empty'}
                  </span>
                )}
              </div>

              <div className="font-serif font-bold text-xs sm:text-sm text-[#101418] truncate">
                {wf.title}
              </div>

              <div className="text-[10px] text-[#72777d] font-sans truncate mt-0.5">
                {wf.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Render the 4 Workflow Sections */}
      <div className="space-y-6">
        {viewMode === 'step' ? (
          renderWorkflowSection(
            ARTICLE_WORKFLOW_SECTIONS[activeWorkflowIndex],
            activeWorkflowIndex
          )
        ) : (
          ARTICLE_WORKFLOW_SECTIONS.map((wf, idx) =>
            renderWorkflowSection(wf, idx)
          )
        )}
      </div>

      {/* Section Figure Image Uploader Modal */}
      {activeFigureSectionIndex !== null && (
        <ImageUploaderModal
          isOpen={true}
          onClose={() => setActiveFigureSectionIndex(null)}
          onSelect={(img) => {
            handleAttachFigure(activeFigureSectionIndex, img);
            setActiveFigureSectionIndex(null);
          }}
          initialData={
            sections[activeFigureSectionIndex]?.figure
              ? {
                  url: sections[activeFigureSectionIndex].figure!.url,
                  caption: sections[activeFigureSectionIndex].figure!.caption || '',
                  alt: sections[activeFigureSectionIndex].figure!.alt || '',
                  credit: sections[activeFigureSectionIndex].figure!.credit || '',
                  align: sections[activeFigureSectionIndex].figure!.align || 'right',
                }
              : undefined
          }
          title={`Attach Figure to ${
            MANDATORY_DOSSIER_SECTIONS[activeFigureSectionIndex]?.title || 'Section'
          }`}
          allowAlignment={true}
        />
      )}
    </div>
  );
};

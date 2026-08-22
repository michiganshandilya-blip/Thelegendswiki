import React, { useState, useEffect } from 'react';
import { requestWritingAssist } from '../../services/aiService';
import { Button } from '../common/Button';
import {
  Sparkles,
  X,
  ListTree,
  PenTool,
  FileText,
  Maximize2,
  CheckCheck,
  Tag,
  Hash,
  Link,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export type AiWritingToolAction =
  | 'generate_outline'
  | 'improve_writing'
  | 'summarize_text'
  | 'expand_explanation'
  | 'fix_grammar'
  | 'suggest_title'
  | 'suggest_categories'
  | 'suggest_keywords'
  | 'suggest_related';

interface AiWritingToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  category: string;
  currentContent?: string;
  onApplyOutline?: (outlineMarkdown: string) => void;
  onApplySummary?: (newSummary: string) => void;
  onApplyTitle?: (newTitle: string, newSlug?: string) => void;
  onApplyContent?: (improvedContent: string) => void;
  onAppendSection?: (title: string, paragraphs: string[]) => void;
}

export const AiWritingToolsModal: React.FC<AiWritingToolsModalProps> = ({
  isOpen,
  onClose,
  title,
  summary,
  category,
  currentContent = '',
  onApplyOutline,
  onApplySummary,
  onApplyTitle,
  onApplyContent,
  onAppendSection,
}) => {
  const [selectedTool, setSelectedTool] = useState<AiWritingToolAction>('generate_outline');
  const [inputText, setInputText] = useState<string>(currentContent || summary || '');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [outputResult, setOutputResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);

  // Sync current content when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputText(currentContent || summary || '');
      setErrorMessage(null);
      setAppliedSuccess(null);
    }
  }, [isOpen, currentContent, summary]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toolsList: Array<{
    id: AiWritingToolAction;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'generate_outline',
      label: 'Generate Outline',
      description: 'Create a structured Wikipedia-style section and subsection framework.',
      icon: <ListTree size={14} />,
    },
    {
      id: 'improve_writing',
      label: 'Improve Scholarly Tone',
      description: 'Refine phrasing for academic neutrality, precision, and clarity.',
      icon: <PenTool size={14} />,
    },
    {
      id: 'summarize_text',
      label: 'Summarize for Lead',
      description: 'Distill draft text into a concise 2-3 sentence encyclopedia overview.',
      icon: <FileText size={14} />,
    },
    {
      id: 'expand_explanation',
      label: 'Expand Explanation',
      description: 'Elaborate concise notes with historical context and significance.',
      icon: <Maximize2 size={14} />,
    },
    {
      id: 'fix_grammar',
      label: 'Fix Grammar & Style',
      description: 'Proofread text for spelling, typographical, and grammatical accuracy.',
      icon: <CheckCheck size={14} />,
    },
    {
      id: 'suggest_title',
      label: 'Suggest Titles & Slugs',
      description: 'Generate 5 authoritative article titles and canonical URL slugs.',
      icon: <Tag size={14} />,
    },
    {
      id: 'suggest_categories',
      label: 'Suggest Categories',
      description: 'Find matching primary categories, subcategories, and index tags.',
      icon: <Hash size={14} />,
    },
    {
      id: 'suggest_keywords',
      label: 'Suggest Keywords',
      description: 'Extract search keywords and discovery metadata for search engines.',
      icon: <Hash size={14} />,
    },
    {
      id: 'suggest_related',
      label: 'Suggest Related Topics',
      description: 'Find complementary encyclopedia topics to cross-reference.',
      icon: <Link size={14} />,
    },
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setAppliedSuccess(null);
    setOutputResult('');

    try {
      const response = await requestWritingAssist({
        action: selectedTool,
        title,
        summary,
        category,
        content: inputText,
        customPrompt,
      });

      if (response.error) {
        setErrorMessage(response.error);
      } else if (response.result) {
        setOutputResult(response.result);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate writing assistance.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToEditor = () => {
    if (!outputResult) return;

    if (selectedTool === 'summarize_text' && onApplySummary) {
      onApplySummary(outputResult.trim());
      setAppliedSuccess('Summary applied to article metadata!');
    } else if (selectedTool === 'improve_writing' || selectedTool === 'fix_grammar' || selectedTool === 'expand_explanation') {
      if (onApplyContent) {
        onApplyContent(outputResult);
        setAppliedSuccess('Content updated in editor!');
      }
    } else if (selectedTool === 'generate_outline' && onApplyOutline) {
      onApplyOutline(outputResult);
      setAppliedSuccess('Outline template ready to inspect!');
    } else {
      // General append as section
      if (onAppendSection) {
        onAppendSection('AI Research Notes', outputResult.split('\n\n').filter(Boolean));
        setAppliedSuccess('Added as a new working section in editor!');
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-writing-tools-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <header className="p-4 bg-[#f8f9fa] border-b border-[#eaecf0] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-[#3366cc] text-white flex items-center justify-center shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="ai-writing-tools-title" className="font-serif font-bold text-base text-[#101418]">
                  AI Article Writing &amp; Research Assistant
                </h3>
                <span className="text-[10px] font-mono uppercase bg-blue-50 text-[#3366cc] border border-blue-200 px-1.5 py-0.2 rounded-xs">
                  Scholar Toolkit
                </span>
              </div>
              <p className="text-xs text-[#54595d]">
                Drafting: <strong className="text-[#101418] font-serif">{title || 'Untitled Article'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Assistant"
            className="p-1.5 text-[#72777d] hover:text-[#ba0000] hover:bg-[#eaecf0] rounded-sm transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#fcfcfc]">
          {/* Tool Selector (Left Column) */}
          <div className="md:col-span-4 space-y-2 select-none">
            <div className="text-[11px] font-mono uppercase font-bold text-[#54595d] tracking-wider mb-2">
              Select Editorial Tool
            </div>
            <div className="space-y-1">
              {toolsList.map((tool) => {
                const isSelected = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setSelectedTool(tool.id);
                      setErrorMessage(null);
                      setAppliedSuccess(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-sm border transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#ffffff] border-[#3366cc] text-[#101418] shadow-xs ring-1 ring-[#3366cc]'
                        : 'bg-[#f8f9fa] border-[#eaecf0] text-[#54595d] hover:bg-[#ffffff] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <span className={`mt-0.5 ${isSelected ? 'text-[#3366cc]' : 'text-[#72777d]'}`}>
                      {tool.icon}
                    </span>
                    <div>
                      <div className={`text-xs font-serif font-bold ${isSelected ? 'text-[#3366cc]' : 'text-[#101418]'}`}>
                        {tool.label}
                      </div>
                      <div className="text-[10px] text-[#72777d] leading-tight mt-0.5">
                        {tool.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration & Output Column (Right Column) */}
          <div className="md:col-span-8 flex flex-col space-y-4">
            {/* Input / Context Box */}
            <div className="space-y-1.5">
              <label htmlFor="ai-writing-input-text" className="text-xs font-mono uppercase font-bold text-[#54595d]">
                Source Draft / Text Context:
              </label>
              <textarea
                id="ai-writing-input-text"
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste the paragraph or draft text you want the AI to analyze, improve, or expand..."
                className="w-full bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-2.5 text-xs text-[#202122] placeholder:text-[#72777d] focus:outline-none focus:border-[#3366cc] focus-visible:ring-2 focus-visible:ring-[#3366cc]"
              />
            </div>

            {/* Optional Custom Directive */}
            <div className="space-y-1">
              <label htmlFor="ai-custom-prompt-input" className="text-xs font-mono uppercase font-bold text-[#54595d]">
                Special Instructions (Optional):
              </label>
              <input
                id="ai-custom-prompt-input"
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus heavily on 19th-century technological impact..."
                className="w-full bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-2 text-xs text-[#202122] placeholder:text-[#72777d] focus:outline-none focus:border-[#3366cc] focus-visible:ring-2 focus-visible:ring-[#3366cc]"
              />
            </div>

            {/* Trigger Button */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerate}
                disabled={isLoading}
                icon={isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              >
                {isLoading ? 'Generating Analysis...' : 'Run Writing Tool'}
              </Button>

              {appliedSuccess && (
                <div className="text-xs text-[#1e7e34] font-medium flex items-center gap-1">
                  <Check size={14} />
                  <span>{appliedSuccess}</span>
                </div>
              )}
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-3 bg-[#fdf2f2] border border-[#f87171] rounded-sm text-xs text-[#b91c1c] flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div>
                  <strong>AI Service Notice:</strong> {errorMessage}
                </div>
              </div>
            )}

            {/* Output Result Container */}
            {outputResult && (
              <div className="space-y-2 border-t border-[#eaecf0] pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase font-bold text-[#54595d] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#3366cc]" />
                    <span>AI Generated Output (Review Before Applying):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-2 py-1 bg-white border border-[#cbd5e1] hover:border-[#3366cc] text-[#54595d] hover:text-[#3366cc] rounded-sm text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={12} className="text-[#1e7e34]" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyToEditor}
                      className="px-3 py-1 bg-[#3366cc] hover:bg-[#2563eb] text-white rounded-sm text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Insert / Apply to Editor</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-xs text-[#202122] max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans shadow-xs selection:bg-blue-100">
                  {outputResult}
                </div>

                <div className="text-[10px] text-[#72777d] flex items-center gap-1">
                  <ShieldAlert size={11} className="text-[#3366cc]" />
                  <span>
                    Human-in-the-loop: Output will only be committed to your draft when you choose to apply or save it.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="p-3 bg-[#f8f9fa] border-t border-[#eaecf0] flex items-center justify-between shrink-0 select-none">
          <span className="text-[11px] text-[#72777d]">
            TheLegendsWiki Editorial Assistant &bull; Powered by Gemini
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </footer>
      </div>
    </div>
  );
};

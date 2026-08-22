import React, { useState } from 'react';
import { Article } from '../../types';
import { askAiAssistant } from '../../services/aiService';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Send,
  MessageSquare,
} from 'lucide-react';

interface ArticleAiCompanionProps {
  article: Article;
  onOpenGlobalChat?: () => void;
}

export const ArticleAiCompanion: React.FC<ArticleAiCompanionProps> = ({
  article,
  onOpenGlobalChat,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTask, setActiveTask] = useState<'summary' | 'simple' | 'takeaways' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAiTask = async (task: 'summary' | 'simple' | 'takeaways') => {
    setActiveTask(task);
    setLoading(true);
    setError(null);
    setOutput(null);

    let prompt = '';
    if (task === 'summary') {
      prompt = `Provide a concise 3-bullet executive summary of the article "${article.title}". Be clear, academic, and factual.`;
    } else if (task === 'simple') {
      prompt = `Explain the key concepts of the article "${article.title}" in very simple, accessible language suitable for a general reader or student, avoiding jargon.`;
    } else if (task === 'takeaways') {
      prompt = `List 4 critical historical or scientific takeaways from the article "${article.title}".`;
    }

    try {
      const response = await askAiAssistant({
        messages: [{ role: 'user', content: prompt }],
        currentArticleSlug: article.slug,
      });

      if (response.error) {
        setError(response.error);
      } else if (response.reply) {
        setOutput(response.reply);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to generate synthesis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#ffffff] border border-blue-200 rounded-sm shadow-xs overflow-hidden">
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 hover:from-blue-100 hover:to-indigo-100 border-b border-blue-200 flex items-center justify-between text-left cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#3366cc] text-white rounded-xs">
            <Sparkles size={13} />
          </div>
          <div>
            <div className="text-xs font-serif font-bold text-[#101418] flex items-center gap-1.5">
              <span>AI Scholar Companion</span>
              <span className="text-[9px] font-mono uppercase bg-blue-100 text-[#3366cc] px-1 py-0.2 rounded-xs border border-blue-300">
                Gemini
              </span>
            </div>
            <p className="text-[10px] text-[#54595d] font-sans">
              Instant synthesis, simplification &amp; research insights
            </p>
          </div>
        </div>
        <div className="text-[#72777d]">
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Body Area */}
      {isOpen && (
        <div className="p-3.5 space-y-3">
          {/* Action Chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleRunAiTask('summary')}
              disabled={loading && activeTask === 'summary'}
              className={`px-2.5 py-1 text-xs rounded-sm border transition-all cursor-pointer flex items-center gap-1 font-medium ${
                activeTask === 'summary'
                  ? 'bg-[#3366cc] text-white border-[#3366cc]'
                  : 'bg-[#f8f9fa] border-[#cbd5e1] hover:border-[#3366cc] text-[#202122]'
              }`}
            >
              <ListOrdered size={12} />
              <span>3-Bullet Summary</span>
            </button>

            <button
              type="button"
              onClick={() => handleRunAiTask('simple')}
              disabled={loading && activeTask === 'simple'}
              className={`px-2.5 py-1 text-xs rounded-sm border transition-all cursor-pointer flex items-center gap-1 font-medium ${
                activeTask === 'simple'
                  ? 'bg-[#3366cc] text-white border-[#3366cc]'
                  : 'bg-[#f8f9fa] border-[#cbd5e1] hover:border-[#3366cc] text-[#202122]'
              }`}
            >
              <HelpCircle size={12} />
              <span>Explain Simply</span>
            </button>

            <button
              type="button"
              onClick={() => handleRunAiTask('takeaways')}
              disabled={loading && activeTask === 'takeaways'}
              className={`px-2.5 py-1 text-xs rounded-sm border transition-all cursor-pointer flex items-center gap-1 font-medium ${
                activeTask === 'takeaways'
                  ? 'bg-[#3366cc] text-white border-[#3366cc]'
                  : 'bg-[#f8f9fa] border-[#cbd5e1] hover:border-[#3366cc] text-[#202122]'
              }`}
            >
              <BookOpen size={12} />
              <span>Key Takeaways</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-3 bg-blue-50/50 rounded-sm border border-blue-100 flex items-center gap-2 text-xs text-[#3366cc]">
              <Loader2 size={14} className="animate-spin shrink-0" />
              <span>Synthesizing article facts with Gemini 3.7 Flash...</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-sm text-xs">
              {error}
            </div>
          )}

          {/* Output Content */}
          {output && !loading && (
            <div className="p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-xs text-[#202122] leading-relaxed space-y-2">
              <div className="text-[10px] font-mono uppercase font-bold text-[#3366cc] flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>
                  {activeTask === 'summary'
                    ? 'Archival Summary'
                    : activeTask === 'simple'
                    ? 'Simplified Concept'
                    : 'Critical Takeaways'}
                </span>
              </div>
              <div className="whitespace-pre-line text-xs font-sans">
                {output}
              </div>
            </div>
          )}

          {/* Bottom Chat Prompt */}
          <div className="pt-2 border-t border-[#eaecf0] flex items-center justify-between text-xs text-[#54595d]">
            <span className="text-[11px]">Have specific questions?</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenGlobalChat) {
                  onOpenGlobalChat();
                } else {
                  // Dispatch custom event to open floating assistant
                  window.dispatchEvent(
                    new CustomEvent('thelegendswiki:open-ai', {
                      detail: { articleSlug: article.slug },
                    })
                  );
                }
              }}
              className="text-[#3366cc] hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
            >
              <MessageSquare size={12} />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

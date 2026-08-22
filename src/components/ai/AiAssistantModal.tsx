import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import { askAiAssistant, AiChatMessage } from '../../services/aiService';
import { CodeXAvatar } from './CodeXAvatar';
import {
  Send,
  X,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArticle?: {
    title: string;
    slug: string;
    summary?: string;
    category?: string;
    content?: string;
  };
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentArticle,
}) => {
  const { navigate } = useRouter();
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am **Code X**, your AI assistant for TheLegendsWiki and general conversation. How can I help you today?',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestedLinks, setSuggestedLinks] = useState<
    Array<{ title: string; slug: string; category: string; summary: string }>
  >([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

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

  const handleSendMessage = async (customText?: string) => {
    const query = (customText || inputQuery).trim();
    if (!query || isLoading) return;

    const newMessages: AiChatMessage[] = [
      ...messages,
      { role: 'user', content: query },
    ];

    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askAiAssistant({
        messages: newMessages,
        currentArticleSlug: currentArticle?.slug,
        currentArticleTitle: currentArticle?.title,
        currentArticleContent: currentArticle?.content || currentArticle?.summary,
      });

      if (response.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ **Notice**: ${response.error}`,
          },
        ]);
      } else if (response.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.reply,
          },
        ]);

        if (response.suggestedArticles && response.suggestedArticles.length > 0) {
          setSuggestedLinks(response.suggestedArticles);
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Connection Error**: ${err?.message || 'Failed to reach Code X via the Gemini service.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Hello! I am **Code X**, your AI assistant for TheLegendsWiki and general conversation. How can I help you today?',
      },
    ]);
    setSuggestedLinks([]);
  };

  // Helper to render basic markdown & wiki internal links [[Title|/wiki/slug]]
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-[#202122]">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-1.5" />;

          // Heading
          if (line.startsWith('### ')) {
            return (
              <h4 key={lIdx} className="font-serif font-bold text-sm text-[#101418] pt-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={lIdx} className="font-serif font-bold text-base text-[#101418] border-b border-[#eaecf0] pb-1 pt-2">
                {line.replace('## ', '')}
              </h3>
            );
          }

          // Bullet list item
          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
          const cleanLine = isBullet ? line.trim().slice(2) : line;

          // Parse [[Title|url]] or **bold**
          const parts = cleanLine.split(/(\[\[.*?\]\]|\*\*.*?\*\*)/g);

          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('[[') && part.endsWith(']]')) {
              const inner = part.slice(2, -2);
              const [linkTitle, linkPath] = inner.includes('|')
                ? inner.split('|')
                : [inner, `/wiki/${inner.toLowerCase().replace(/\s+/g, '-')}`];

              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    navigate(linkPath);
                    if (!isExpanded) onClose();
                  }}
                  className="inline-flex items-center gap-0.5 text-[#3366cc] hover:underline font-medium cursor-pointer"
                >
                  <span>{linkTitle}</span>
                  <ExternalLink size={10} className="inline opacity-70" />
                </button>
              );
            }

            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-[#101418]">
                  {part.slice(2, -2)}
                </strong>
              );
            }

            return part;
          });

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-1.5 pl-2">
                <span className="text-[#3366cc] font-bold">&bull;</span>
                <div>{formattedLine}</div>
              </div>
            );
          }

          return <p key={lIdx}>{formattedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-2 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#ffffff] border border-[#a2a9b1] rounded-t-lg sm:rounded-sm shadow-2xl flex flex-col transition-all duration-300 w-full ${
          isExpanded
            ? 'sm:w-[720px] h-[92vh]'
            : 'sm:w-[480px] h-[85vh] sm:h-[640px]'
        }`}
      >
        {/* Header */}
        <header className="p-3.5 bg-[#f8f9fa] border-b border-[#eaecf0] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            {/* Code X Avatar beside name */}
            <CodeXAvatar size={34} />
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="ai-assistant-modal-title"
                  className="font-serif font-bold text-base text-[#101418] flex items-center gap-1.5"
                >
                  <span>Code X</span>
                </h3>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.2 bg-blue-50 text-[#3366cc] border border-blue-200 rounded-xs">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-[#54595d]">
                AI Assistant for TheLegendsWiki &amp; General Knowledge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Reset conversation"
              aria-label="Reset conversation"
              className="p-1.5 text-[#72777d] hover:text-[#202122] hover:bg-[#eaecf0] rounded-sm transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Minimize size' : 'Expand window'}
              aria-label={isExpanded ? 'Minimize dialog' : 'Expand dialog'}
              className="p-1.5 text-[#72777d] hover:text-[#202122] hover:bg-[#eaecf0] rounded-sm transition-colors cursor-pointer hidden sm:block"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Code X"
              aria-label="Close Code X"
              className="px-2.5 py-1 bg-[#eaecf0] hover:bg-rose-100 text-[#54595d] hover:text-rose-700 rounded-sm transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <X size={15} />
              <span>Close</span>
            </button>
          </div>
        </header>

        {/* Current Context Pill (if on an article page) */}
        {currentArticle && (
          <div className="px-3.5 py-1.5 bg-[#f0f6ff] border-b border-blue-100 flex items-center justify-between text-xs text-[#3366cc] shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <BookOpen size={13} className="shrink-0" />
              <span className="truncate">
                Article in context: <strong>{currentArticle.title}</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-white px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
              {currentArticle.category || 'Article'}
            </span>
          </div>
        )}

        {/* Conversation Message List */}
        <div
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fcfcfc]"
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-sm p-3 shadow-xs ${
                    isUser
                      ? 'bg-[#3366cc] text-white'
                      : 'bg-[#ffffff] border border-[#cbd5e1] text-[#202122]'
                  }`}
                >
                  {!isUser && (
                    <div className="text-[10px] font-mono uppercase text-[#72777d] font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                      <CodeXAvatar size={15} />
                      <span className="text-[#3366cc]">Code X</span>
                    </div>
                  )}

                  {isUser ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    renderMessageContent(msg.content)
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2.5 p-3 bg-[#ffffff] border border-[#cbd5e1] rounded-sm max-w-[80%] text-xs text-[#3366cc] shadow-xs">
              <CodeXAvatar size={18} className="animate-pulse" />
              <div className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin text-[#3366cc]" />
                <span className="font-medium">Code X is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Articles Card Box */}
        {suggestedLinks.length > 0 && (
          <div className="p-2.5 bg-[#f8f9fa] border-t border-[#eaecf0] shrink-0 space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#54595d] font-bold flex items-center gap-1">
              <BookOpen size={11} className="text-[#3366cc]" />
              <span>Referenced TheLegendsWiki Articles:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedLinks.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    navigate(`/wiki/${sug.slug}`);
                    if (!isExpanded) onClose();
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-[#a2a9b1] hover:border-[#3366cc] hover:text-[#3366cc] rounded-sm text-xs transition-colors cursor-pointer"
                >
                  <span className="font-serif font-medium">{sug.title}</span>
                  <ArrowRight size={11} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="px-3 py-2 bg-[#f8f9fa] border-t border-[#eaecf0] flex flex-wrap gap-1.5 shrink-0 overflow-x-auto">
          {currentArticle ? (
            <>
              <button
                type="button"
                onClick={() => handleSendMessage(`Summarize "${currentArticle.title}" into 3 key takeaways.`)}
                disabled={isLoading}
                className="px-2 py-1 bg-white border border-[#cbd5e1] hover:border-[#3366cc] hover:text-[#3366cc] rounded-sm text-[11px] text-[#54595d] transition-colors cursor-pointer disabled:opacity-50"
              >
                📝 Summarize this entry
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage(`Explain "${currentArticle.title}" in simple terms.`)}
                disabled={isLoading}
                className="px-2 py-1 bg-white border border-[#cbd5e1] hover:border-[#3366cc] hover:text-[#3366cc] rounded-sm text-[11px] text-[#54595d] transition-colors cursor-pointer disabled:opacity-50"
              >
                💡 Explain simply
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage(`What are the key discoveries or historical milestones in "${currentArticle.title}"?`)}
                disabled={isLoading}
                className="px-2 py-1 bg-white border border-[#cbd5e1] hover:border-[#3366cc] hover:text-[#3366cc] rounded-sm text-[11px] text-[#54595d] transition-colors cursor-pointer disabled:opacity-50"
              >
                🔍 Key milestones
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSendMessage('Hi')}
                disabled={isLoading}
                className="px-2 py-1 bg-white border border-[#cbd5e1] hover:border-[#3366cc] hover:text-[#3366cc] rounded-sm text-[11px] text-[#54595d] transition-colors cursor-pointer disabled:opacity-50"
              >
                👋 "Hi"
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('How are you?')}
                disabled={isLoading}
                className="px-2 py-1 bg-white border border-[#cbd5e1] hover:border-[#3366cc] hover:text-[#3366cc] rounded-sm text-[11px] text-[#54595d] transition-colors cursor-pointer disabled:opacity-50"
              >
                💬 "How are you?"
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('What is TheLegendsWiki?')}
                disabled={isLoading}
                className="px-2 py-1 bg-white border border-[#cbd5e1] hover:border-[#3366cc] hover:text-[#3366cc] rounded-sm text-[11px] text-[#54595d] transition-colors cursor-pointer disabled:opacity-50"
              >
                🏛️ "What is TheLegendsWiki?"
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Who was Ada Lovelace?')}
                disabled={isLoading}
                className="px-2 py-1 bg-white border border-[#cbd5e1] hover:border-[#3366cc] hover:text-[#3366cc] rounded-sm text-[11px] text-[#54595d] transition-colors cursor-pointer disabled:opacity-50"
              >
                💻 Ada Lovelace
              </button>
            </>
          )}
        </div>

        {/* Input Bar */}
        <footer className="p-3 bg-[#ffffff] border-t border-[#eaecf0] shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Message Code X or ask a question..."
              disabled={isLoading}
              aria-label="Message Code X"
              className="flex-1 bg-[#ffffff] border border-[#a2a9b1] rounded-sm px-3 py-2 text-xs sm:text-sm text-[#202122] placeholder:text-[#72777d] focus:outline-none focus:border-[#3366cc] focus-visible:ring-2 focus-visible:ring-[#3366cc] transition-all"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              aria-label="Send message"
              className="px-3.5 py-2 bg-[#3366cc] hover:bg-[#2563eb] text-white rounded-sm text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#3366cc]"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          {/* Neutrality & Source Disclaimer */}
          <div className="flex items-center justify-between text-[10px] text-[#72777d]">
            <div className="flex items-center gap-1">
              <ShieldAlert size={11} className="text-[#3366cc]" />
              <span>Powered by Gemini 3.7 Flash</span>
            </div>
            <span className="font-mono text-[9px]">TheLegendsWiki AI Engine</span>
          </div>
        </footer>
      </div>
    </div>
  );
};


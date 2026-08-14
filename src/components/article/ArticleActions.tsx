import React, { useState } from 'react';
import { BookOpen, Edit3, MessageSquare, Bookmark, Share2, Printer, Check } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { Button } from '../common/Button';

interface ArticleActionsProps {
  articleTitle: string;
  articleSlug: string;
  className?: string;
}

export const ArticleActions: React.FC<ArticleActionsProps> = ({
  articleTitle,
  articleSlug,
  className = '',
}) => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'read' | 'edit' | 'discussion'>('read');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Article URL copied to clipboard');
    } else {
      showToast('Link ready to share');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    showToast(!isBookmarked ? 'Article bookmarked locally' : 'Bookmark removed');
  };

  const handlePlaceholderAction = (type: string) => {
    showToast(`${type} will be available in future collaborative phases.`);
  };

  return (
    <div className={`relative flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 ${className}`}>
      {/* Primary Encyclopedia Tabs (Read / Edit / Discussion) */}
      <div className="flex items-center space-x-1 border-b border-[#1e293b] w-full sm:w-auto -mb-px">
        <button
          type="button"
          onClick={() => setActiveTab('read')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'read'
              ? 'border-sky-400 text-sky-300 bg-[#141c2e]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen size={13} className={activeTab === 'read' ? 'text-sky-400' : ''} />
          <span>Read</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/edit/${articleSlug}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-sky-300 hover:bg-slate-800/40 border-b-2 border-transparent cursor-pointer transition-colors"
          title="Edit or contribute revisions to this article"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => handlePlaceholderAction('Discussion / Talk page')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 border-b-2 border-transparent cursor-pointer transition-colors"
          title="Discussion system will be enabled in a future phase"
        >
          <MessageSquare size={13} />
          <span>Discussion</span>
        </button>
      </div>

      {/* Utility Action Buttons (Bookmark / Share / Print) */}
      <div className="flex items-center gap-1.5 text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmarkToggle}
          icon={
            <Bookmark
              size={13}
              className={isBookmarked ? 'fill-sky-400 text-sky-400' : 'text-slate-400'}
            />
          }
          className={isBookmarked ? 'text-sky-400 bg-sky-950/40' : 'text-slate-400'}
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
        >
          <span className="hidden xs:inline">{isBookmarked ? 'Saved' : 'Bookmark'}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          icon={<Share2 size={13} />}
          title="Share article URL"
        >
          <span className="hidden xs:inline">Share</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrint}
          icon={<Printer size={13} />}
          title="Print this article"
        >
          <span className="hidden xs:inline">Print</span>
        </Button>
      </div>

      {/* Lightweight Floating Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-full left-0 right-0 sm:right-auto sm:left-auto mt-2 z-30 bg-[#141c2e] border border-[#1e293b] text-slate-100 text-xs px-3 py-1.5 rounded-sm shadow-lg flex items-center gap-2 animate-fade-in"
        >
          <Check size={12} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};


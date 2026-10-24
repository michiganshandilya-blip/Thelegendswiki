import React, { useState } from 'react';
import { BookOpen, Edit3, Bookmark, Printer, Check, History } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { ArticleShare } from './ArticleShare';

interface ArticleActionsProps {
  articleTitle: string;
  articleSlug: string;
  category?: string;
  summary?: string;
  className?: string;
}

export const ArticleActions: React.FC<ArticleActionsProps> = ({
  articleTitle,
  articleSlug,
  category,
  summary,
  className = '',
}) => {
  const { navigate } = useRouter();
  const { isAuthenticated, isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<'read' | 'edit' | 'discussion'>('read');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to bookmark articles');
      return;
    }
    setIsBookmarked(!isBookmarked);
    showToast(!isBookmarked ? 'Article bookmarked' : 'Bookmark removed');
  };

  const handleEditClick = () => {
    if (isGuest || !isAuthenticated) {
      navigate(`/login?redirect=/edit/${articleSlug}`);
    } else {
      navigate(`/edit/${articleSlug}`);
    }
  };

  return (
    <div className={`relative flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-[#eaecf0] no-print ${className}`}>
      {/* Primary Tabs (Read / Edit / History) */}
      <div className="flex items-center space-x-1 -mb-px">
        <button
          type="button"
          onClick={() => setActiveTab('read')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'read'
              ? 'border-[#3366cc] text-[#3366cc] bg-[#ffffff] font-semibold'
              : 'border-transparent text-[#54595d] hover:text-[#101418]'
          }`}
        >
          <BookOpen size={13} className={activeTab === 'read' ? 'text-[#3366cc]' : ''} />
          <span>Read</span>
        </button>

        <button
          type="button"
          onClick={handleEditClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#54595d] hover:text-[#3366cc] hover:bg-[#f1f5f9] border-b-2 border-transparent cursor-pointer transition-colors"
          title={isGuest ? 'Sign in to edit' : 'Edit this article'}
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/edit/${encodeURIComponent(articleSlug)}?tab=history`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#72777d] hover:text-[#101418] border-b-2 border-transparent cursor-pointer transition-colors"
          title="View article version history & earlier snapshots"
        >
          <History size={13} />
          <span>History</span>
        </button>
      </div>

      {/* Utility Action Buttons (Bookmark / Share / Print) */}
      <div className="flex items-center gap-1 text-xs pb-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmarkToggle}
          icon={
            <Bookmark
              size={13}
              className={isBookmarked ? 'fill-[#3366cc] text-[#3366cc]' : 'text-[#72777d]'}
            />
          }
          className={isBookmarked ? 'text-[#3366cc] bg-blue-50' : 'text-[#54595d]'}
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
        >
          <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Bookmark'}</span>
        </Button>

        {/* Share Popover Component with Social Media Links & Copy Link */}
        <ArticleShare
          articleTitle={articleTitle}
          articleSlug={articleSlug}
          category={category}
          summary={summary}
          align="right"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrint}
          icon={<Printer size={13} />}
          title="Print this article"
        >
          <span className="hidden sm:inline">Print</span>
        </Button>
      </div>

      {/* Lightweight Floating Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-full left-0 right-0 sm:right-auto sm:left-auto mt-2 z-30 bg-[#ffffff] border border-[#a2a9b1] text-[#202122] text-xs px-3 py-1.5 rounded-sm shadow-md flex items-center gap-2"
        >
          <Check size={12} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Article, ArticleStatus } from '../types';
import { getUserArticles, deleteArticle, submitArticleForReview } from '../services/articleService';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { LoadingState } from '../components/common/LoadingState';
import {
  FileEdit,
  Plus,
  Clock,
  CheckCircle,
  Eye,
  Trash2,
  Send,
  Search,
  BookOpen,
  Calendar,
  AlertTriangle,
  XCircle,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export const MyArticlesPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'pending_review' | 'changes_requested' | 'published' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const authorId = user?.uid || userProfile?.id || '';

  // Load articles
  const loadUserArticles = async () => {
    if (!authorId) return;
    try {
      setLoading(true);
      const list = await getUserArticles(authorId);
      setArticles(list);
    } catch (err) {
      console.warn('Error loading user contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/my-articles');
      return;
    }
    if (authorId) {
      loadUserArticles();
    }
  }, [authorId, isAuthenticated, authLoading]);

  // Handle delete draft
  const handleDeleteDraft = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the draft "${title}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setActionSuccess(`Draft "${title}" was successfully deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Error deleting draft:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Quick submit draft or resubmit for review
  const handleQuickSubmit = async (article: Article) => {
    try {
      const authorName = userProfile?.displayName || user?.displayName || 'Contributor';
      await submitArticleForReview(article.id, authorId, authorName);
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, status: 'pending_review' } : a))
      );
      setActionSuccess(`"${article.title}" has been submitted for editorial peer review.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Error submitting article for review:', err);
    }
  };

  if (authLoading || (loading && articles.length === 0)) {
    return <LoadingState type="article" />;
  }

  // Filtered articles
  const filteredArticles = articles.filter((art) => {
    const matchesTab = activeTab === 'all' || art.status === activeTab;
    const matchesQuery =
      !searchQuery.trim() ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const countByStatus = {
    all: articles.length,
    draft: articles.filter((a) => a.status === 'draft').length,
    pending_review: articles.filter((a) => a.status === 'pending_review').length,
    changes_requested: articles.filter((a) => a.status === 'changes_requested').length,
    published: articles.filter((a) => a.status === 'published').length,
    rejected: articles.filter((a) => a.status === 'rejected').length,
  };

  const getStatusBadge = (status?: ArticleStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-300">
            <Clock size={11} className="text-amber-600" /> Draft
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-blue-50 text-[#3366cc] border border-blue-200">
            <Send size={11} className="text-[#3366cc]" /> In Review
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle size={11} className="text-amber-600" /> Changes Requested
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle size={11} className="text-emerald-600" /> Published
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle size={11} className="text-rose-600" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'Contributor Workspace' }, { label: 'My Contributions' }]} />

      {/* Header Banner */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#3366cc]" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
              My Articles & Drafts
            </h1>
          </div>
          <p className="text-xs text-[#54595d] font-sans">
            Manage your authored encyclopedia entries, peer-review submissions, and editorial feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/create')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold cursor-pointer shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Article Entry</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-sm text-emerald-900 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs & Search Strip */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eaecf0] pb-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { key: 'all', label: 'All Entries', count: countByStatus.all },
              { key: 'draft', label: 'Drafts', count: countByStatus.draft },
              { key: 'pending_review', label: 'In Review', count: countByStatus.pending_review },
              { key: 'changes_requested', label: 'Changes Needed', count: countByStatus.changes_requested },
              { key: 'published', label: 'Published', count: countByStatus.published },
              { key: 'rejected', label: 'Rejected', count: countByStatus.rejected },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-blue-50 text-[#3366cc] border border-blue-300'
                    : 'text-[#54595d] hover:text-[#101418] hover:bg-[#f8f9fa]'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#eaecf0] rounded-full text-[#54595d]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#72777d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your articles..."
              className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Article List */}
      {filteredArticles.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-12 text-center space-y-4 shadow-xs">
          <BookOpen size={36} className="mx-auto text-[#cbd5e1]" />
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-[#101418]">
              No Articles Found in this View
            </h3>
            <p className="text-xs text-[#54595d] max-w-md mx-auto leading-relaxed font-sans">
              {searchQuery
                ? `No articles match "${searchQuery}". Try clearing the search keyword.`
                : activeTab === 'draft'
                ? 'You have no active drafts in your workspace.'
                : activeTab === 'pending_review'
                ? 'You have no submissions currently waiting for editorial review.'
                : activeTab === 'changes_requested'
                ? 'Great! None of your submissions currently have changes requested.'
                : 'Start contributing your knowledge to the encyclopedia.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold cursor-pointer shadow-xs transition-all"
          >
            <Plus size={14} />
            <span>Create New Article Draft</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 sm:p-5 space-y-3 hover:border-[#3366cc] transition-all shadow-xs"
            >
              {/* Top metadata row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(art.status)}

                  <span className="text-xs font-semibold text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                    {art.category}
                  </span>

                  {art.subCategory && (
                    <span className="text-xs text-[#72777d] font-mono">
                      / {art.subCategory}
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-[#72777d] flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> Updated {art.lastUpdated || 'Recently'}
                  </span>
                  {art.status === 'published' && (
                    <>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-[#54595d]">
                        <Eye size={11} className="text-[#3366cc]" /> {art.views || 0} views
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Title & Excerpt */}
              <div className="space-y-1">
                <h2
                  onClick={() =>
                    art.status === 'published'
                      ? navigate(`/wiki/${art.slug}`)
                      : navigate(`/edit/${art.slug}`)
                  }
                  className="text-base sm:text-lg font-bold font-serif text-[#101418] hover:text-[#3366cc] hover:underline transition-colors cursor-pointer"
                >
                  {art.title}
                </h2>
                <p className="text-xs text-[#54595d] line-clamp-2 leading-relaxed font-sans">
                  {art.summary}
                </p>
              </div>

              {/* Changes Requested / Editorial Notes Callout */}
              {art.status === 'changes_requested' && art.moderationNotes && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle size={13} />
                    <span>Editorial Revision Feedback {art.reviewedBy ? `from ${art.reviewedBy}` : ''}:</span>
                  </div>
                  <p className="font-sans italic bg-white/70 p-2 rounded border border-amber-200">
                    "{art.moderationNotes}"
                  </p>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/edit/${art.slug}`)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-sm font-semibold cursor-pointer text-xs"
                    >
                      <span>Address Feedback in Editor</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection Note */}
              {art.status === 'rejected' && art.moderationNotes && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-sm text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800">
                    <XCircle size={13} />
                    <span>Editorial Rejection Note:</span>
                  </div>
                  <p className="font-sans italic bg-white/70 p-2 rounded border border-rose-200">
                    "{art.moderationNotes}"
                  </p>
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#eaecf0] text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#72777d]">
                  <span>Slug:</span>
                  <span className="text-[#101418] font-semibold">/wiki/{art.slug}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Quick Submit Review for Drafts */}
                  {art.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleQuickSubmit(art)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#3366cc] border border-blue-200 rounded-sm font-semibold cursor-pointer"
                      title="Submit this draft for editorial review"
                    >
                      <Send size={12} />
                      <span>Submit for Review</span>
                    </button>
                  )}

                  {/* Resubmit for Changes Requested */}
                  {art.status === 'changes_requested' && (
                    <button
                      type="button"
                      onClick={() => handleQuickSubmit(art)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#3366cc] border border-blue-200 rounded-sm font-semibold cursor-pointer"
                    >
                      <Send size={12} />
                      <span>Resubmit for Review</span>
                    </button>
                  )}

                  {/* View Live Article if published */}
                  {art.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/wiki/${art.slug}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm font-semibold cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View Live Entry</span>
                    </button>
                  )}

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => navigate(`/edit/${art.slug}`)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#f8f9fa] hover:bg-[#ffffff] text-[#101418] border border-[#a2a9b1] rounded-sm font-semibold cursor-pointer"
                  >
                    <FileEdit size={12} className="text-[#3366cc]" />
                    <span>Edit Article</span>
                  </button>

                  {/* Delete Draft Button */}
                  {art.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(art.id, art.title)}
                      disabled={deletingId === art.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-sm font-semibold cursor-pointer transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

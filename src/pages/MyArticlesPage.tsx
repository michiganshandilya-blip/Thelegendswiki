import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Article, ArticleStatus } from '../types';
import { getUserArticles, deleteArticle, updateArticle } from '../services/articleService';
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
  Layers,
  Sparkles,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';

export const MyArticlesPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'pending_review' | 'published' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load articles
  const loadUserArticles = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const list = await getUserArticles(user.uid);
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
    if (user?.uid) {
      loadUserArticles();
    }
  }, [user?.uid, isAuthenticated, authLoading]);

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

  // Quick submit draft for review
  const handleQuickSubmit = async (article: Article) => {
    try {
      await updateArticle(article.id, {
        status: 'pending_review',
      });
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
    published: articles.filter((a) => a.status === 'published').length,
    archived: articles.filter((a) => a.status === 'archived').length,
  };

  const getStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
            <Clock size={11} className="text-amber-400" /> Draft
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-sky-950/80 text-sky-300 border border-sky-700/80">
            <Send size={11} className="text-sky-400" /> In Review
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
            <CheckCircle size={11} className="text-emerald-400" /> Published
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-purple-950/80 text-purple-300 border border-purple-700/80">
            Archived
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <Breadcrumbs items={[{ label: 'Contributor Workspace' }, { label: 'My Contributions' }]} />

      {/* Header Banner */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-sky-400" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
              Contributor Articles
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Manage your authored encyclopedia entries, ongoing drafts, and peer-review submissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/create')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-md transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Article Entry</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-sm text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs & Search Strip */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { key: 'all', label: 'All Entries', count: countByStatus.all },
              { key: 'draft', label: 'Drafts', count: countByStatus.draft },
              { key: 'pending_review', label: 'In Review', count: countByStatus.pending_review },
              { key: 'published', label: 'Published', count: countByStatus.published },
              { key: 'archived', label: 'Archived', count: countByStatus.archived },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full border border-slate-700/60">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your articles..."
              className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Article List */}
      {filteredArticles.length === 0 ? (
        <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-12 text-center space-y-4">
          <BookOpen size={36} className="mx-auto text-slate-600" />
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-slate-200">
              No Articles Found in this View
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No articles match "${searchQuery}". Try clearing the search keyword.`
                : activeTab === 'draft'
                ? 'You have no active drafts in your workspace.'
                : activeTab === 'pending_review'
                ? 'You have no submissions currently waiting for editorial review.'
                : 'Start contributing your knowledge to the encyclopedia.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>Create Your First Article</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="bg-[#0a0f1d] border border-slate-800 rounded-sm p-4 sm:p-5 space-y-3 hover:border-slate-700/90 transition-all shadow-sm"
            >
              {/* Top metadata row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(art.status)}

                  <span className="text-xs font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded-sm border border-sky-800/40">
                    {art.category}
                  </span>

                  {art.subCategory && (
                    <span className="text-xs text-slate-400 font-mono">
                      / {art.subCategory}
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> Updated {art.lastUpdated || 'Recently'}
                  </span>
                  {art.status === 'published' && (
                    <>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Eye size={11} className="text-indigo-400" /> {art.views || 0} views
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
                  className="text-base sm:text-lg font-bold font-display text-slate-100 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  {art.title}
                </h2>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                  {art.summary}
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                  <span>Slug:</span>
                  <span className="text-slate-400 font-bold">/wiki/{art.slug}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Quick Submit Review for Drafts */}
                  {art.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleQuickSubmit(art)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-sm font-semibold cursor-pointer"
                      title="Submit this draft for editorial review"
                    >
                      <Send size={12} />
                      <span>Submit Review</span>
                    </button>
                  )}

                  {/* View Live Article if published */}
                  {art.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/wiki/${art.slug}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-sm font-semibold cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View Live Entry</span>
                    </button>
                  )}

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => navigate(`/edit/${art.slug}`)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-sm font-semibold cursor-pointer"
                  >
                    <FileEdit size={12} className="text-sky-400" />
                    <span>Edit Article</span>
                  </button>

                  {/* Delete Draft Button */}
                  {art.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(art.id, art.title)}
                      disabled={deletingId === art.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-slate-800 hover:border-red-900 rounded-sm font-semibold cursor-pointer transition-colors"
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

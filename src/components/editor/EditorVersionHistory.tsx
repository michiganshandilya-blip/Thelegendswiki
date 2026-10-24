import React, { useState, useEffect, useMemo } from 'react';
import { Revision, Article, ArticleSection, ArticleCitation, ArticleInfobox } from '../../types';
import { getRevisionsByArticleId } from '../../services/revisionService';
import {
  Clock,
  History,
  Eye,
  GitCompare,
  RotateCcw,
  CheckCircle2,
  Send,
  Edit3,
  Bookmark,
  Calendar,
  User,
  Search,
  Filter,
  FileText,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertCircle,
  X,
  BookOpen,
  ArrowLeft,
  Check,
} from 'lucide-react';

interface EditorVersionHistoryProps {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  currentStatus: string;
  currentArticle: Partial<Article>;
  onRestoreSnapshot: (snapshot: Partial<Article>, revisionNote: string) => void;
  onSwitchToEditor: () => void;
  isEditor?: boolean;
}

export const EditorVersionHistory: React.FC<EditorVersionHistoryProps> = ({
  articleId,
  articleSlug,
  articleTitle,
  currentStatus,
  currentArticle,
  onRestoreSnapshot,
  onSwitchToEditor,
}) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [selectedSnapshotRev, setSelectedSnapshotRev] = useState<Revision | null>(null);
  const [compareRevA, setCompareRevA] = useState<Revision | null>(null);
  const [compareRevB, setCompareRevB] = useState<Revision | null>(null);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [restoreConfirmRev, setRestoreConfirmRev] = useState<Revision | null>(null);
  const [snapshotViewMode, setSnapshotViewMode] = useState<'article' | 'structured' | 'diff'>('article');

  // Load revisions on mount or when articleId/slug changes
  const loadRevisions = async () => {
    try {
      setLoading(true);
      const identifier = articleId || articleSlug;
      let revs = await getRevisionsByArticleId(identifier);

      // If empty and identifier is slug, also try with articleId or vice versa
      if (revs.length === 0 && articleSlug && articleSlug !== identifier) {
        revs = await getRevisionsByArticleId(articleSlug);
      }
      if (revs.length === 0 && articleId && articleId !== identifier) {
        revs = await getRevisionsByArticleId(articleId);
      }

      // If published article still has no revisions recorded, synthesize baseline initial revision
      if (revs.length === 0 && (currentStatus === 'published' || currentArticle.title)) {
        const baselineRev: Revision = {
          id: `rev-baseline-${articleId || 'canonical'}`,
          articleId: articleId || articleSlug,
          articleSlug: articleSlug,
          articleTitle: articleTitle || currentArticle.title || 'Published Dossier',
          editorId: (currentArticle.authorId as string) || 'author',
          editorName: (currentArticle.author as string) || 'Founding Author',
          versionNumber: 'v1.0 (Initial Publication)',
          previousContent: '',
          newContent:
            typeof currentArticle.content === 'string'
              ? currentArticle.content
              : (currentArticle.sections || []).map((s) => (s.content || []).join('\n\n')).join('\n\n') ||
                currentArticle.summary ||
                'Baseline publication snapshot',
          changeSummary: 'Canonical initial publication to the encyclopedia repository.',
          actionType: 'approval',
          createdAt: (currentArticle.updatedAt as string) || new Date().toISOString(),
          snapshot: currentArticle,
        };
        revs = [baselineRev];
      }

      setRevisions(revs);
    } catch (err) {
      console.warn('Error loading article version history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevisions();
  }, [articleId, articleSlug, currentStatus]);

  // Filtered list
  const filteredRevisions = useMemo(() => {
    return revisions.filter((rev) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (rev.changeSummary && rev.changeSummary.toLowerCase().includes(q)) ||
        (rev.editorName && rev.editorName.toLowerCase().includes(q)) ||
        (rev.versionNumber && rev.versionNumber.toLowerCase().includes(q)) ||
        (rev.articleTitle && rev.articleTitle.toLowerCase().includes(q));

      const matchesFilter =
        filterAction === 'all' ||
        (filterAction === 'published' && (rev.actionType === 'approval' || rev.versionNumber?.includes('1.0'))) ||
        (filterAction === 'edits' && (rev.actionType === 'direct_edit' || !rev.actionType)) ||
        (filterAction === 'reviews' && (rev.actionType === 'submission' || rev.actionType === 'changes_requested')) ||
        (filterAction === 'drafts' && rev.actionType === 'draft_saved');

      return matchesSearch && matchesFilter;
    });
  }, [revisions, searchQuery, filterAction]);

  // Formatter for timestamp
  const formatTimestamp = (dateString: string | any): { relative: string; fullTime: string } => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) {
        return { relative: String(dateString || 'Recorded'), fullTime: String(dateString || 'Unknown') };
      }

      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      let relative = '';
      if (diffMs < 60000) {
        relative = 'Just now';
      } else if (diffHrs < 1) {
        relative = `${Math.floor(diffMs / 60000)} mins ago`;
      } else if (diffHrs < 24) {
        relative = `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        relative = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        relative = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      const fullTime = d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return { relative, fullTime };
    } catch {
      return { relative: String(dateString), fullTime: String(dateString) };
    }
  };

  const getActionBadge = (actionType?: string) => {
    switch (actionType) {
      case 'approval':
        return {
          label: 'Published Live',
          icon: <CheckCircle2 size={12} className="text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'submission':
        return {
          label: 'Editorial Submission',
          icon: <Send size={12} className="text-blue-600" />,
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'direct_edit':
        return {
          label: 'Editorial Revision',
          icon: <Edit3 size={12} className="text-indigo-600" />,
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'draft_saved':
        return {
          label: 'Draft Checkpoint',
          icon: <Bookmark size={12} className="text-slate-600" />,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
        };
      case 'restore':
        return {
          label: 'Restored Version',
          icon: <RotateCcw size={12} className="text-teal-600" />,
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
        };
      case 'changes_requested':
        return {
          label: 'Changes Requested',
          icon: <AlertCircle size={12} className="text-amber-600" />,
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return {
          label: 'Revision',
          icon: <History size={12} className="text-slate-600" />,
          bg: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const handleOpenCompare = (revA: Revision, revB?: Revision) => {
    setCompareRevA(revA);
    // If no second revision provided, compare with current editor state or previous revision
    if (revB) {
      setCompareRevB(revB);
    } else {
      // Find the next older revision or compare against current
      const idx = revisions.findIndex((r) => r.id === revA.id);
      if (idx !== -1 && idx + 1 < revisions.length) {
        setCompareRevB(revisions[idx + 1]);
      } else {
        setCompareRevB(null); // Will compare against current editor
      }
    }
    setShowCompareModal(true);
  };

  const handleConfirmRestore = () => {
    if (!restoreConfirmRev) return;
    const snap = restoreConfirmRev.snapshot;
    if (snap) {
      onRestoreSnapshot(snap, `Restored from ${restoreConfirmRev.versionNumber || 'snapshot'} (${restoreConfirmRev.id})`);
    } else {
      // Fallback: reconstruct partial article from revision content
      onRestoreSnapshot(
        {
          title: restoreConfirmRev.articleTitle || currentArticle.title,
          content: restoreConfirmRev.newContent,
        },
        `Restored from ${restoreConfirmRev.versionNumber || 'revision'} (${restoreConfirmRev.id})`
      );
    }
    setRestoreConfirmRev(null);
    setSelectedSnapshotRev(null);
    onSwitchToEditor();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eaecf0] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <History size={18} className="text-[#3366cc]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#101418]">
                Version History &amp; Edit Audit Trail
              </h2>
            </div>
            <p className="text-xs text-[#54595d] font-sans leading-relaxed">
              Transparent encyclopedic revision log. Inspect historical snapshots of earlier work, compare modifications
              across publication cycles, and roll back or restore baseline states.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadRevisions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors shadow-xs"
              title="Refresh Revision History"
            >
              <History size={13} className="text-[#3366cc]" />
              <span>Refresh Log</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToEditor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>Back to Editor</span>
            </button>
          </div>
        </div>

        {/* Publication Status & Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8f9fa] border border-[#eaecf0] p-3 rounded-sm text-xs font-mono">
          <div>
            <span className="text-[#72777d] block text-[10px] uppercase">Record Status</span>
            <span className="font-bold text-[#101418] uppercase flex items-center gap-1 mt-0.5">
              {currentStatus === 'published' ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Published Live</span>
                </>
              ) : (
                <>
                  <Bookmark size={13} className="text-amber-600 shrink-0" />
                  <span>{currentStatus}</span>
                </>
              )}
            </span>
          </div>

          <div>
            <span className="text-[#72777d] block text-[10px] uppercase">Total Revisions</span>
            <span className="font-bold text-[#101418] text-sm mt-0.5 block">
              {revisions.length} {revisions.length === 1 ? 'Snapshot' : 'Snapshots'}
            </span>
          </div>

          <div>
            <span className="text-[#72777d] block text-[10px] uppercase">Latest Modification</span>
            <span className="font-semibold text-[#101418] mt-0.5 block truncate">
              {revisions[0] ? formatTimestamp(revisions[0].createdAt).relative : 'None'}
            </span>
          </div>

          <div>
            <span className="text-[#72777d] block text-[10px] uppercase">First Published</span>
            <span className="font-semibold text-[#101418] mt-0.5 block truncate">
              {revisions.length > 0
                ? formatTimestamp(revisions[revisions.length - 1].createdAt).relative
                : 'Initial Cycle'}
            </span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-[#72777d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by edit note, author, or version..."
              className="w-full bg-[#f8f9fa] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#101418] placeholder-[#72777d] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#72777d] hover:text-[#101418]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
            <span className="text-[#72777d] text-[11px] mr-1 hidden sm:inline">Filter:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'published', label: 'Published' },
              { id: 'edits', label: 'Edits' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'drafts', label: 'Drafts' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilterAction(btn.id)}
                className={`px-2.5 py-1 rounded-sm text-xs font-semibold cursor-pointer transition-colors ${
                  filterAction === btn.id
                    ? 'bg-[#3366cc] text-white border border-[#3366cc]'
                    : 'bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#54595d] border border-[#a2a9b1]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center bg-[#ffffff] border border-[#a2a9b1] rounded-sm space-y-3 shadow-xs">
          <History size={28} className="mx-auto text-[#3366cc] animate-spin" />
          <p className="font-serif text-sm font-bold text-[#101418]">Loading Historical Snapshots...</p>
          <p className="text-xs text-[#54595d] font-mono">Retrieving immutable audit records from repository</p>
        </div>
      ) : filteredRevisions.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-[#ffffff] border border-[#a2a9b1] rounded-sm space-y-3 shadow-xs">
          <Clock size={32} className="mx-auto text-[#72777d]" />
          <h3 className="font-serif text-base font-bold text-[#101418]">No Revision Snapshots Found</h3>
          <p className="text-xs text-[#54595d] max-w-md mx-auto">
            {searchQuery
              ? `No edit records matched your search query "${searchQuery}". Try clearing filters.`
              : 'Snapshots are automatically recorded whenever you save drafts, submit updates for editorial review, or publish live revisions.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterAction('all');
              }}
              className="px-3 py-1.5 bg-[#f8f9fa] border border-[#a2a9b1] text-xs font-semibold rounded-sm cursor-pointer"
            >
              Clear Search Filters
            </button>
          )}
        </div>
      ) : (
        /* Timeline of Revisions */
        <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 sm:p-6 shadow-xs space-y-6">
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#eaecf0]">
            {filteredRevisions.map((rev, idx) => {
              const timeInfo = formatTimestamp(rev.createdAt);
              const badge = getActionBadge(rev.actionType);
              const isCurrentEditor = idx === 0;
              const hasSnapshot = Boolean(rev.snapshot && (rev.snapshot.sections || rev.snapshot.summary));

              // Compute simple stats for the snapshot
              const sectionCount = rev.snapshot?.sections?.length || 0;
              const citationCount = rev.snapshot?.citations?.length || rev.snapshot?.references?.length || 0;

              return (
                <div key={rev.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      idx === 0
                        ? 'bg-[#3366cc] border-[#ffffff] ring-2 ring-blue-200 text-white shadow-xs'
                        : 'bg-[#ffffff] border-[#a2a9b1] text-[#72777d] group-hover:border-[#3366cc] group-hover:text-[#3366cc]'
                    }`}
                  >
                    <History size={12} />
                  </div>

                  {/* Revision Card */}
                  <div
                    className={`border rounded-sm p-4 sm:p-5 transition-all shadow-xs space-y-3 ${
                      idx === 0
                        ? 'bg-blue-50/20 border-blue-200'
                        : 'bg-[#fcfdfd] hover:bg-[#ffffff] border-[#eaecf0] hover:border-[#a2a9b1]'
                    }`}
                  >
                    {/* Top Row: Version Tag, Status Pill, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#101418] bg-[#f8f9fa] border border-[#a2a9b1] px-2 py-0.5 rounded-sm">
                          {rev.versionNumber || `v1.${filteredRevisions.length - 1 - idx}`}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[11px] font-mono font-medium ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>

                        {isCurrentEditor && (
                          <span className="px-2 py-0.5 bg-blue-100 text-[#3366cc] border border-blue-200 rounded-sm text-[10px] font-mono font-bold">
                            Latest Published Revision
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-[#54595d]">
                        <span className="flex items-center gap-1" title={timeInfo.fullTime}>
                          <Clock size={12} className="text-[#72777d]" />
                          <strong className="text-[#101418]">{timeInfo.relative}</strong>
                        </span>
                        <span className="hidden md:inline text-[#a2a9b1]">&bull;</span>
                        <span className="hidden md:inline text-[#72777d] text-[11px]">{timeInfo.fullTime}</span>
                      </div>
                    </div>

                    {/* Change Note / Summary */}
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-serif font-bold text-[#101418] leading-snug">
                        {rev.changeSummary || 'Revision update to article record.'}
                      </p>
                      {rev.moderationNotes && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-sm text-[11px] text-amber-900 italic">
                          Editorial Feedback: "{rev.moderationNotes}"
                        </div>
                      )}
                    </div>

                    {/* Contributor & Snapshot Stats */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#eaecf0] text-xs font-mono text-[#54595d]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#eaecf0] text-[#101418] flex items-center justify-center text-[10px] font-bold uppercase">
                          {(rev.editorName || 'E').charAt(0)}
                        </div>
                        <span>
                          Contributor: <strong className="text-[#101418]">{rev.editorName || 'Editor'}</strong>
                        </span>
                      </div>

                      {hasSnapshot && (
                        <div className="flex items-center gap-3 text-[11px] text-[#72777d]">
                          <span className="flex items-center gap-1">
                            <Layers size={12} />
                            <span>{sectionCount} {sectionCount === 1 ? 'section' : 'sections'}</span>
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} />
                            <span>{citationCount} {citationCount === 1 ? 'citation' : 'citations'}</span>
                          </span>
                        </div>
                      )}

                      {/* Action Buttons for this Revision */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* View Snapshot */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSnapshotRev(rev);
                            setSnapshotViewMode('article');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors shadow-xs"
                          title="Inspect complete snapshot of earlier work"
                        >
                          <Eye size={12} className="text-[#3366cc]" />
                          <span>View Snapshot</span>
                        </button>

                        {/* Compare with Current or Previous */}
                        <button
                          type="button"
                          onClick={() => handleOpenCompare(rev)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ffffff] hover:bg-[#eaecf0] text-[#54595d] hover:text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors"
                          title="Compare changes against current editor"
                        >
                          <GitCompare size={12} />
                          <span className="hidden sm:inline">Compare</span>
                        </button>

                        {/* Restore Snapshot */}
                        <button
                          type="button"
                          onClick={() => setRestoreConfirmRev(rev)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#3366cc] border border-blue-200 rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors"
                          title="Restore this earlier version into active editor"
                        >
                          <RotateCcw size={12} />
                          <span className="hidden sm:inline">Restore</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Snapshot Viewer Modal */}
      {selectedSnapshotRev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#f8f9fa] border-b border-[#a2a9b1]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#101418] text-white text-xs font-mono font-bold rounded-sm">
                    {selectedSnapshotRev.versionNumber || 'Historical Snapshot'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[11px] font-mono ${
                      getActionBadge(selectedSnapshotRev.actionType).bg
                    }`}
                  >
                    {getActionBadge(selectedSnapshotRev.actionType).icon}
                    <span>{getActionBadge(selectedSnapshotRev.actionType).label}</span>
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#101418] truncate max-w-xl">
                  {selectedSnapshotRev.snapshot?.title || selectedSnapshotRev.articleTitle || articleTitle}
                </h3>
                <div className="text-xs text-[#54595d] font-mono flex items-center gap-2">
                  <span>Author: {selectedSnapshotRev.editorName || 'Editor'}</span>
                  <span>&bull;</span>
                  <span>Recorded: {formatTimestamp(selectedSnapshotRev.createdAt).fullTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setRestoreConfirmRev(selectedSnapshotRev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors shadow-xs"
                >
                  <RotateCcw size={13} />
                  <span>Restore This Version</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSnapshotRev(null)}
                  className="p-1.5 text-[#54595d] hover:text-[#101418] bg-white border border-[#a2a9b1] hover:bg-[#eaecf0] rounded-sm cursor-pointer"
                  title="Close Snapshot Viewer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs inside Snapshot Modal */}
            <div className="flex items-center gap-1 border-b border-[#eaecf0] bg-[#ffffff] px-4 pt-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSnapshotViewMode('article')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
                  snapshotViewMode === 'article'
                    ? 'border-[#3366cc] text-[#3366cc] bg-[#f8f9fa]'
                    : 'border-transparent text-[#54595d] hover:text-[#101418]'
                }`}
              >
                <BookOpen size={13} />
                <span>Full Article Snapshot</span>
              </button>

              <button
                type="button"
                onClick={() => setSnapshotViewMode('structured')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
                  snapshotViewMode === 'structured'
                    ? 'border-[#3366cc] text-[#3366cc] bg-[#f8f9fa]'
                    : 'border-transparent text-[#54595d] hover:text-[#101418]'
                }`}
              >
                <Layers size={13} />
                <span>Structured Dossier</span>
              </button>

              <button
                type="button"
                onClick={() => setSnapshotViewMode('diff')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
                  snapshotViewMode === 'diff'
                    ? 'border-[#3366cc] text-[#3366cc] bg-[#f8f9fa]'
                    : 'border-transparent text-[#54595d] hover:text-[#101418]'
                }`}
              >
                <GitCompare size={13} />
                <span>Changes vs Current Editor</span>
              </button>
            </div>

            {/* Modal Body with View Modes */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {snapshotViewMode === 'article' && (
                /* Full Article View */
                <div className="space-y-6 max-w-3xl mx-auto">
                  {/* Edit Note Callout */}
                  <div className="p-3 bg-[#f8f9fa] border-l-4 border-[#3366cc] text-xs text-[#202122] space-y-1 font-mono">
                    <span className="font-bold text-[#101418] uppercase">Snapshot Revision Note:</span>
                    <p className="font-sans italic">"{selectedSnapshotRev.changeSummary}"</p>
                  </div>

                  {/* Article Title */}
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418] border-b border-[#a2a9b1] pb-2">
                    {selectedSnapshotRev.snapshot?.title || selectedSnapshotRev.articleTitle}
                  </h1>

                  {/* Lead Summary */}
                  <p className="text-sm font-serif leading-relaxed text-[#202122] italic bg-[#f8f9fa] p-4 border border-[#eaecf0] rounded-sm">
                    {selectedSnapshotRev.snapshot?.summary || 'No summary recorded in this snapshot.'}
                  </p>

                  {/* Featured Image if present */}
                  {selectedSnapshotRev.snapshot?.featuredImage && (
                    <figure className="my-4 border border-[#eaecf0] p-2 bg-[#f8f9fa] rounded-sm space-y-1.5">
                      <img
                        src={selectedSnapshotRev.snapshot.featuredImage}
                        alt={selectedSnapshotRev.snapshot.imageAlt || 'Article illustration'}
                        className="w-full max-h-80 object-cover rounded-xs"
                      />
                      {selectedSnapshotRev.snapshot.imageCaption && (
                        <figcaption className="text-xs text-[#54595d] font-serif italic text-center">
                          {selectedSnapshotRev.snapshot.imageCaption}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  {/* Infobox Key Details if present */}
                  {selectedSnapshotRev.snapshot?.infobox && (
                    <div className="p-4 bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm space-y-2">
                      <div className="font-serif font-bold text-sm text-[#101418] border-b border-[#eaecf0] pb-1">
                        {selectedSnapshotRev.snapshot.infobox.title}
                      </div>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {selectedSnapshotRev.snapshot.infobox.details?.map((det, i) => (
                          <div key={i} className="border-b border-[#eaecf0] pb-1">
                            <dt className="text-[#72777d] font-mono text-[11px]">{det.label}:</dt>
                            <dd className="font-medium text-[#101418]">{det.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Sections */}
                  {selectedSnapshotRev.snapshot?.sections && selectedSnapshotRev.snapshot.sections.length > 0 ? (
                    <div className="space-y-6">
                      {selectedSnapshotRev.snapshot.sections.map((sec, sIdx) => (
                        <div key={sec.id || sIdx} className="space-y-3">
                          <h2 className="font-serif text-lg font-bold text-[#101418] border-b border-[#eaecf0] pb-1 flex items-center gap-2">
                            <span className="text-xs font-mono text-[#3366cc]">§ {sIdx + 1}</span>
                            <span>{sec.title}</span>
                          </h2>
                          <div className="space-y-2 text-sm text-[#202122] font-serif leading-relaxed">
                            {(sec.content || []).map((para, pIdx) => (
                              <p key={pIdx}>{para}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Raw Content fallback */
                    <div className="space-y-2 text-sm text-[#202122] font-serif leading-relaxed whitespace-pre-line">
                      {selectedSnapshotRev.newContent}
                    </div>
                  )}

                  {/* Citations / References List */}
                  {selectedSnapshotRev.snapshot?.citations &&
                    selectedSnapshotRev.snapshot.citations.length > 0 && (
                      <div className="mt-8 pt-4 border-t border-[#a2a9b1] space-y-2">
                        <h3 className="font-serif font-bold text-sm text-[#101418] uppercase font-mono tracking-wide">
                          References &amp; Archival Citations
                        </h3>
                        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#54595d] font-sans">
                          {selectedSnapshotRev.snapshot.citations.map((c, i) => (
                            <li key={c.id || i}>
                              <strong className="text-[#101418]">{c.author || 'Author'}</strong> ({c.year || 'n.d.'}).{' '}
                              <em>"{c.title}"</em>. {c.source || ''}.
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                </div>
              )}

              {snapshotViewMode === 'structured' && (
                /* Structured Dossier Breakdown */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8f9fa] border border-[#eaecf0] p-4 rounded-sm text-xs font-mono">
                    <div>
                      <span className="text-[#72777d] block text-[10px] uppercase">Category</span>
                      <span className="font-bold text-[#101418]">{selectedSnapshotRev.snapshot?.category || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[#72777d] block text-[10px] uppercase">Article Type</span>
                      <span className="font-bold text-[#101418]">{selectedSnapshotRev.snapshot?.articleType || 'Dossier'}</span>
                    </div>
                    <div>
                      <span className="text-[#72777d] block text-[10px] uppercase">Status in Snapshot</span>
                      <span className="font-bold text-[#101418]">{selectedSnapshotRev.snapshot?.status || 'Published'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-mono text-xs font-bold text-[#101418] uppercase">
                      Sections Registered ({selectedSnapshotRev.snapshot?.sections?.length || 0})
                    </h4>
                    {selectedSnapshotRev.snapshot?.sections?.map((sec, idx) => (
                      <div key={idx} className="border border-[#eaecf0] rounded-sm p-3 bg-[#ffffff] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-[#101418]">
                            {idx + 1}. {sec.title}
                          </span>
                          <span className="text-xs font-mono text-[#72777d]">
                            {sec.content?.length || 0} paragraphs
                          </span>
                        </div>
                        <p className="text-xs text-[#54595d] font-sans line-clamp-2">
                          {(sec.content || [])[0] || 'No content paragraphs.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {snapshotViewMode === 'diff' && (
                /* Visual Diff Comparison with Current Editor */
                <div className="space-y-6">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm text-xs text-blue-900 flex items-center justify-between">
                    <span>
                      Comparing this earlier snapshot <strong>({selectedSnapshotRev.versionNumber || 'Snapshot'})</strong> against your current active editor content.
                    </span>
                  </div>

                  {/* Title Diff */}
                  <div className="space-y-1.5 border border-[#eaecf0] p-3 rounded-sm">
                    <span className="text-[10px] font-mono text-[#72777d] uppercase block">Title</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2 bg-red-50 border border-red-200 rounded-sm">
                        <span className="block font-mono text-[10px] text-red-700 font-bold mb-1">
                          Snapshot Version:
                        </span>
                        <p className="font-serif font-bold text-red-900">
                          {selectedSnapshotRev.snapshot?.title || selectedSnapshotRev.articleTitle}
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-sm">
                        <span className="block font-mono text-[10px] text-emerald-700 font-bold mb-1">
                          Current Editor Draft:
                        </span>
                        <p className="font-serif font-bold text-emerald-900">
                          {currentArticle.title || 'Untitled Draft'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Diff */}
                  <div className="space-y-1.5 border border-[#eaecf0] p-3 rounded-sm">
                    <span className="text-[10px] font-mono text-[#72777d] uppercase block">Lead Summary</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2 bg-red-50 border border-red-200 rounded-sm font-serif text-red-900">
                        <span className="block font-mono text-[10px] text-red-700 font-bold mb-1">
                          Snapshot Summary:
                        </span>
                        {selectedSnapshotRev.snapshot?.summary || 'No summary'}
                      </div>
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-sm font-serif text-emerald-900">
                        <span className="block font-mono text-[10px] text-emerald-700 font-bold mb-1">
                          Current Editor Summary:
                        </span>
                        {currentArticle.summary || 'No summary'}
                      </div>
                    </div>
                  </div>

                  {/* Section Count comparison */}
                  <div className="space-y-2 border border-[#eaecf0] p-3 rounded-sm text-xs font-mono">
                    <span className="text-[10px] text-[#72777d] uppercase block">Dossier Sections</span>
                    <div className="flex items-center gap-4">
                      <div>
                        Snapshot sections: <strong>{selectedSnapshotRev.snapshot?.sections?.length || 0}</strong>
                      </div>
                      <div>&rarr;</div>
                      <div>
                        Current editor sections: <strong>{currentArticle.sections?.length || 0}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 p-4 bg-[#f8f9fa] border-t border-[#a2a9b1]">
              <div className="text-xs text-[#72777d] font-mono">
                Revision ID: <code className="text-[#101418]">{selectedSnapshotRev.id}</code>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSnapshotRev(null)}
                  className="px-3.5 py-1.5 bg-white border border-[#a2a9b1] hover:bg-[#eaecf0] text-[#101418] rounded-sm text-xs font-semibold font-mono cursor-pointer"
                >
                  Close Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreConfirmRev(selectedSnapshotRev)}
                  className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold font-mono cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Restore to Editor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompareModal && compareRevA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl my-auto animate-fadeIn">
            <div className="flex items-center justify-between p-4 bg-[#f8f9fa] border-b border-[#a2a9b1]">
              <div className="flex items-center gap-2">
                <GitCompare size={18} className="text-[#3366cc]" />
                <h3 className="font-serif font-bold text-lg text-[#101418]">
                  Revision Comparison
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="p-1 text-[#54595d] hover:text-[#101418]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#eaecf0] pb-4">
                <div className="bg-red-50/50 border border-red-200 p-3 rounded-sm space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-red-700 block">
                    Base: {compareRevA.versionNumber || 'Selected Revision'}
                  </span>
                  <div className="font-bold text-[#101418]">{compareRevA.changeSummary}</div>
                  <div className="text-[11px] text-[#72777d] font-mono">
                    By {compareRevA.editorName} &bull; {formatTimestamp(compareRevA.createdAt).fullTime}
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-sm space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block">
                    Compared Against: {compareRevB ? compareRevB.versionNumber : 'Current Editor Draft'}
                  </span>
                  <div className="font-bold text-[#101418]">
                    {compareRevB ? compareRevB.changeSummary : 'Working state in editor'}
                  </div>
                  <div className="text-[11px] text-[#72777d] font-mono">
                    {compareRevB
                      ? `By ${compareRevB.editorName} • ${formatTimestamp(compareRevB.createdAt).fullTime}`
                      : 'Live in active editor session'}
                  </div>
                </div>
              </div>

              {/* Title Compare */}
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-[#72777d] uppercase">Article Title</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-sm font-serif">
                    {compareRevA.snapshot?.title || compareRevA.articleTitle}
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-sm font-serif">
                    {compareRevB
                      ? compareRevB.snapshot?.title || compareRevB.articleTitle
                      : currentArticle.title}
                  </div>
                </div>
              </div>

              {/* Summary Compare */}
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-[#72777d] uppercase">Lead Summary</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-sm font-serif text-xs leading-relaxed">
                    {compareRevA.snapshot?.summary || compareRevA.newContent || 'No summary'}
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-sm font-serif text-xs leading-relaxed">
                    {compareRevB
                      ? compareRevB.snapshot?.summary || compareRevB.newContent
                      : currentArticle.summary}
                  </div>
                </div>
              </div>

              {/* Sections Compare */}
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-[#72777d] uppercase">Sections Registered</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-sm font-mono text-xs">
                    {(compareRevA.snapshot?.sections || []).map((s, idx) => (
                      <div key={idx} className="truncate">
                        &bull; {s.title} ({s.content?.length || 0} paras)
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-sm font-mono text-xs">
                    {(compareRevB ? compareRevB.snapshot?.sections || [] : currentArticle.sections || []).map(
                      (s, idx) => (
                        <div key={idx} className="truncate">
                          &bull; {s.title} ({s.content?.length || 0} paras)
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 bg-[#f8f9fa] border-t border-[#a2a9b1]">
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold font-mono cursor-pointer"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {restoreConfirmRev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-[#3366cc]">
              <div className="p-2 bg-blue-100 rounded-full">
                <RotateCcw size={20} className="text-[#3366cc]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#101418]">
                Restore Snapshot to Editor?
              </h3>
            </div>

            <p className="text-xs text-[#54595d] leading-relaxed">
              Restoring this snapshot will populate the active editor fields with content from{' '}
              <strong className="text-[#101418]">
                {restoreConfirmRev.versionNumber || 'earlier snapshot'}
              </strong>{' '}
              recorded on {formatTimestamp(restoreConfirmRev.createdAt).fullTime}.
            </p>

            <div className="bg-[#f8f9fa] border border-[#eaecf0] p-3 rounded-sm space-y-1 text-xs">
              <span className="font-mono text-[10px] text-[#72777d] uppercase block">Snapshot Note</span>
              <p className="font-serif italic text-[#101418]">"{restoreConfirmRev.changeSummary}"</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                Any unsaved changes currently in your editor will be replaced. You can save or publish after restoring.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => setRestoreConfirmRev(null)}
                className="px-3.5 py-1.5 bg-white border border-[#a2a9b1] hover:bg-[#eaecf0] text-[#101418] rounded-sm text-xs font-semibold font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-semibold font-mono shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check size={13} />
                <span>Confirm &amp; Load into Editor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

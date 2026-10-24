import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Article, ArticleStatus, UserProfile, UserRole, Revision } from '../types';
import { 
  getAllArticlesForModeration, 
  approveArticle, 
  rejectArticle, 
  requestChangesOnArticle, 
  deleteArticle 
} from '../services/articleService';
import { 
  getAllUsers, 
  setUserRole, 
  setUserStatus, 
  subscribeToUsers,
  DESIGNATED_SUPER_ADMIN_EMAIL 
} from '../services/userService';
import { getAllRevisions } from '../services/revisionService';
import { useCategories } from '../data/dataProvider';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { LoadingState } from '../components/common/LoadingState';
import { Button } from '../components/common/Button';
import { TheLegendsWikiLogo } from '../components/common/TheLegendsWikiLogo';
import { AdminAiControls } from '../components/admin/AdminAiControls';
import { InvestigationEngineDesk } from '../components/admin/InvestigationEngineDesk';
import {
  Shield,
  FileCheck,
  FileCheck2,
  Users,
  History,
  FolderTree,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Eye,
  FileEdit,
  Clock,
  Search,
  Filter,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Trash2,
  Lock,
  Unlock,
  Check,
  X,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { navigate } = useRouter();
  const { 
    userProfile, 
    user, 
    role, 
    isEditor, 
    isAdmin, 
    isSuperAdmin,
    simulatedRole, 
    setSimulatedRole 
  } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'moderation' | 'investigations' | 'users' | 'revisions' | 'categories' | 'ai_governance'>('moderation');

  // Moderation Data State
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState<boolean>(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [moderationSearch, setModerationSearch] = useState<string>('');
  const [actionArticleId, setActionArticleId] = useState<string | null>(null);

  // Selected Article for Review Modal
  const [reviewingArticle, setReviewingArticle] = useState<Article | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [modalMode, setModalMode] = useState<'view' | 'request_changes' | 'reject'>('view');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Delete Confirmation Modal
  const [deleteModalArticle, setDeleteModalArticle] = useState<Article | null>(null);
  const [isDeletingArticle, setIsDeletingArticle] = useState<boolean>(false);

  // Quick Reject Dialog
  const [quickRejectArticle, setQuickRejectArticle] = useState<Article | null>(null);
  const [quickRejectReason, setQuickRejectReason] = useState<string>('Submission does not meet encyclopedia verification or citation standards.');

  // Users Data State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleUpdatingId, setUserRoleUpdatingId] = useState<string | null>(null);

  // Revisions & Audit Log Data
  const [revisionsList, setRevisionsList] = useState<Revision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState<boolean>(false);

  // Categories Data
  const { categories } = useCategories();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Load Moderation Articles
  const loadModerationArticles = async () => {
    try {
      setArticlesLoading(true);
      const data = await getAllArticlesForModeration({
        status: selectedStatusFilter,
        searchQuery: moderationSearch,
      });
      setArticles(data);
    } catch (err) {
      console.warn('Error loading moderation articles:', err);
    } finally {
      setArticlesLoading(false);
    }
  };

  // Load Users List
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await getAllUsers();
      setUsersList(data);
    } catch (err) {
      console.warn('Error loading users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load Audit Revisions
  const loadRevisions = async () => {
    try {
      setRevisionsLoading(true);
      const data = await getAllRevisions(40);
      setRevisionsList(data);
    } catch (err) {
      console.warn('Error loading audit log:', err);
    } finally {
      setRevisionsLoading(false);
    }
  };

  useEffect(() => {
    loadModerationArticles();
  }, [selectedStatusFilter]);

  // Real-time subscription to users registry
  useEffect(() => {
    let unsubUsers: (() => void) | null = null;
    
    if (activeTab === 'users') {
      setUsersLoading(true);
      unsubUsers = subscribeToUsers(
        (liveUsers) => {
          setUsersList(liveUsers);
          setUsersLoading(false);
        },
        (err) => {
          console.warn('Realtime users error in AdminPage:', err);
          setUsersLoading(false);
        }
      );
    } else if (activeTab === 'revisions' && revisionsList.length === 0) {
      loadRevisions();
    }

    const handleRoleChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; newRole: UserRole; user?: UserProfile }>;
      if (customEvent.detail) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === customEvent.detail.userId ? { ...u, role: customEvent.detail.newRole } : u))
        );
      }
    };

    window.addEventListener('thelegendswiki:user-role-changed', handleRoleChanged);

    return () => {
      if (unsubUsers) unsubUsers();
      window.removeEventListener('thelegendswiki:user-role-changed', handleRoleChanged);
    };
  }, [activeTab]);

  // Handle Approve Article
  const handleApprove = async (article: Article) => {
    if (article.status === 'published') {
      showNotification('Article is already published.', 'error');
      return;
    }

    try {
      setActionArticleId(article.id);
      const reviewerName = userProfile?.displayName || userProfile?.username || user?.displayName || 'Editorial Board';
      const reviewerId = user?.uid || userProfile?.id || 'editor';

      const res = await approveArticle(article.id, reviewerId, reviewerName, feedbackNotes || undefined);
      if (res.success) {
        showNotification(`"${article.title}" approved and published to the codex.`);
        
        // Immediate optimistic UI update
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, status: 'published' as ArticleStatus } : a))
        );

        if (reviewingArticle?.id === article.id) {
          setReviewingArticle(null);
        }
        setFeedbackNotes('');
        loadModerationArticles();
      } else {
        showNotification(res.error || 'Failed to approve article.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error during approval.', 'error');
    } finally {
      setActionArticleId(null);
    }
  };

  // Handle Request Changes
  const handleRequestChanges = async (article: Article) => {
    if (!feedbackNotes.trim() || feedbackNotes.trim().length < 5) {
      showNotification('Please provide specific editorial instructions (minimum 5 characters).', 'error');
      return;
    }

    try {
      setActionArticleId(article.id);
      const reviewerName = userProfile?.displayName || userProfile?.username || user?.displayName || 'Editorial Board';
      const reviewerId = user?.uid || userProfile?.id || 'editor';

      const res = await requestChangesOnArticle(article.id, reviewerId, reviewerName, feedbackNotes);
      if (res.success) {
        showNotification(`Changes requested for "${article.title}". Contributor will be notified.`);
        
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, status: 'changes_requested' as ArticleStatus, moderationNotes: feedbackNotes } : a))
        );

        setReviewingArticle(null);
        setFeedbackNotes('');
        setModalMode('view');
        loadModerationArticles();
      } else {
        showNotification(res.error || 'Failed to submit change request.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error requesting changes.', 'error');
    } finally {
      setActionArticleId(null);
    }
  };

  // Handle Reject / Cancel Submission
  const handleReject = async (article: Article, customReason?: string) => {
    const reasonToUse = (customReason || rejectionReason || 'Submission does not meet encyclopedia verification or citation standards.').trim();

    try {
      setActionArticleId(article.id);
      const reviewerName = userProfile?.displayName || userProfile?.username || user?.displayName || 'Editorial Board';
      const reviewerId = user?.uid || userProfile?.id || 'editor';

      // Immediate optimistic UI update
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id || a.slug === article.slug
            ? { ...a, status: 'rejected' as ArticleStatus, moderationNotes: reasonToUse }
            : a
        )
      );

      const res = await rejectArticle(article.id, reviewerId, reviewerName, reasonToUse);
      if (res.success) {
        showNotification(`"${article.title}" submission marked as Rejected.`);
        setReviewingArticle(null);
        setQuickRejectArticle(null);
        setRejectionReason('');
        setModalMode('view');
        loadModerationArticles();
      } else {
        showNotification(res.error || 'Failed to reject article.', 'error');
        loadModerationArticles();
      }
    } catch (err: any) {
      showNotification(err.message || 'Error rejecting submission.', 'error');
      loadModerationArticles();
    } finally {
      setActionArticleId(null);
    }
  };

  // Handle Delete Article
  const handleConfirmDelete = async () => {
    if (!deleteModalArticle) return;
    const targetArticle = deleteModalArticle;

    try {
      setIsDeletingArticle(true);
      const actor = {
        uid: user?.uid || userProfile?.id || 'admin',
        email: userProfile?.email || user?.email || 'Thelegendswiki@gmail.com',
        role: role,
      };

      // Immediate optimistic UI update
      setArticles((prev) =>
        prev.filter((a) => a.id !== targetArticle.id && a.slug !== targetArticle.slug)
      );
      setDeleteModalArticle(null);
      if (reviewingArticle?.id === targetArticle.id || reviewingArticle?.slug === targetArticle.slug) {
        setReviewingArticle(null);
      }

      const res = await deleteArticle(targetArticle.id, actor);
      if (res.success) {
        showNotification(`"${targetArticle.title}" permanently removed.`);
      } else {
        showNotification(res.error || 'Failed to delete article.', 'error');
        loadModerationArticles();
      }
    } catch (err: any) {
      showNotification(err.message || 'Error deleting article.', 'error');
      loadModerationArticles();
    } finally {
      setIsDeletingArticle(false);
    }
  };

  // Handle User Role Change
  const handleUserRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUserRoleUpdatingId(userId);
      const actor = {
        uid: user?.uid || userProfile?.id || 'admin',
        email: userProfile?.email || user?.email || 'Thelegendswiki@gmail.com',
        role: role,
      };

      const res = await setUserRole(userId, newRole, actor);
      if (res.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showNotification(`User role updated to ${newRole.replace('_', ' ')}.`);
      } else {
        showNotification(res.error || 'Failed to update user role.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Role change failed.', 'error');
    } finally {
      setUserRoleUpdatingId(null);
    }
  };

  // Handle User Account Status Toggle
  const handleUserStatusToggle = async (userId: string, currentDisabled: boolean) => {
    try {
      setUserRoleUpdatingId(userId);
      const actor = {
        uid: user?.uid || userProfile?.id || 'admin',
        email: userProfile?.email || user?.email || 'Thelegendswiki@gmail.com',
        role: role,
      };

      const res = await setUserStatus(userId, !currentDisabled, actor);
      if (res.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, disabled: !currentDisabled } : u))
        );
        showNotification(`User account ${!currentDisabled ? 'restricted' : 'restored'}.`);
      } else {
        showNotification(res.error || 'Failed to change user status.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Status toggle failed.', 'error');
    } finally {
      setUserRoleUpdatingId(null);
    }
  };

  // Counts by status
  const pendingCount = articles.filter((a) => a.status === 'pending_review').length;
  const changesCount = articles.filter((a) => a.status === 'changes_requested').length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const rejectedCount = articles.filter((a) => a.status === 'rejected').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;

  const filteredArticles = articles.filter((art) => {
    const matchesStatus = selectedStatusFilter === 'all' || art.status === selectedStatusFilter;
    const matchesSearch =
      !moderationSearch.trim() ||
      art.title.toLowerCase().includes(moderationSearch.toLowerCase()) ||
      art.summary.toLowerCase().includes(moderationSearch.toLowerCase()) ||
      art.author.toLowerCase().includes(moderationSearch.toLowerCase()) ||
      art.category.toLowerCase().includes(moderationSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = usersList.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status?: ArticleStatus) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-blue-50 text-[#3366cc] border border-blue-200">
            <Clock size={11} /> Pending Review
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle size={11} /> Changes Requested
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle size={11} /> Published
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle size={11} /> Rejected
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-300">
            <Clock size={11} /> Draft
          </span>
        );
    }
  };

  const getActionBadge = (actionType?: string) => {
    switch (actionType) {
      case 'approval':
        return <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">APPROVED</span>;
      case 'submission':
        return <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">SUBMITTED</span>;
      case 'changes_requested':
        return <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded">FEEDBACK</span>;
      case 'rejection':
        return <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-100 text-rose-900 rounded">REJECTED</span>;
      default:
        return <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">EDIT</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <Breadcrumbs items={[{ label: 'Administration & Governance', path: '/admin' }]} />

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-sm border text-xs flex items-center justify-between gap-3 shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle size={16} className="text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-red-700 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-800 p-0.5 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <TheLegendsWikiLogo size="lg" className="rounded-sm border border-blue-200 bg-white p-0.5 shadow-xs shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                  Editorial Control &amp; Governance
                </span>
                {role === 'super_admin' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm border border-amber-300">
                    SUPER ADMIN ACCOUNT
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
                Encyclopedia Governance Desk
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#54595d]">
                <div>
                  <span className="text-slate-500">Logged in as:</span>{' '}
                  <strong className="text-[#101418] font-mono font-semibold">{userProfile?.email || user?.email || 'Thelegendswiki@gmail.com'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Role:</span>{' '}
                  <strong className="text-[#3366cc] font-mono font-bold uppercase">{role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {role === 'super_admin' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/super-admin')}
                icon={<ShieldCheck size={14} />}
                className="bg-amber-800 hover:bg-amber-900 text-white font-mono font-bold text-xs"
              >
                Super Admin Center
              </Button>
            )}
            <button
              type="button"
              onClick={() => {
                loadModerationArticles();
                if (activeTab === 'users') loadUsers();
                if (activeTab === 'revisions') loadRevisions();
                showNotification('Registry synchronized with backend.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] hover:bg-[#ffffff] text-[#202122] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={articlesLoading || usersLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setSelectedStatusFilter('pending_review')}
          className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] hover:border-[#3366cc] rounded-sm shadow-xs cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Pending Review</span>
            <Clock size={12} className="text-[#3366cc]" />
          </div>
          <div className="text-2xl font-bold text-[#3366cc] font-mono mt-1">{pendingCount}</div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Awaiting editorial decision</div>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('changes_requested')}
          className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] hover:border-amber-500 rounded-sm shadow-xs cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Changes Requested</span>
            <AlertTriangle size={12} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono mt-1">{changesCount}</div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Awaiting author revisions</div>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('published')}
          className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] hover:border-emerald-500 rounded-sm shadow-xs cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Published</span>
            <CheckCircle size={12} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">{publishedCount}</div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Live encyclopedia entries</div>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('rejected')}
          className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] hover:border-rose-500 rounded-sm shadow-xs cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Rejected</span>
            <XCircle size={12} className="text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono mt-1">{rejectedCount}</div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Archived rejections</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#cbd5e1] flex items-center gap-1 sm:gap-2 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'moderation'
              ? 'border-[#3366cc] text-[#3366cc] bg-[#ffffff] shadow-xs'
              : 'border-transparent text-[#54595d] hover:text-[#101418] hover:bg-[#f8f9fa]'
          }`}
        >
          <FileCheck size={15} />
          <span>Moderation Queue</span>
          <span className="text-[10px] font-mono bg-blue-100 text-[#3366cc] px-1.5 py-0.2 rounded font-bold">
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('investigations')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'investigations'
              ? 'border-[#3366cc] text-[#3366cc] bg-[#ffffff] shadow-xs'
              : 'border-transparent text-[#54595d] hover:text-[#101418] hover:bg-[#f8f9fa]'
          }`}
        >
          <FileCheck2 size={15} className="text-[#3366cc]" />
          <span>Investigation &amp; Evidence Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'users'
              ? 'border-[#3366cc] text-[#3366cc] bg-[#ffffff] shadow-xs'
              : 'border-transparent text-[#54595d] hover:text-[#101418] hover:bg-[#f8f9fa]'
          }`}
        >
          <Users size={15} />
          <span>Scholar &amp; User Clearances</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('revisions')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'revisions'
              ? 'border-[#3366cc] text-[#3366cc] bg-[#ffffff] shadow-xs'
              : 'border-transparent text-[#54595d] hover:text-[#101418] hover:bg-[#f8f9fa]'
          }`}
        >
          <History size={15} />
          <span>System Audit Log</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'categories'
              ? 'border-[#3366cc] text-[#3366cc] bg-[#ffffff] shadow-xs'
              : 'border-transparent text-[#54595d] hover:text-[#101418] hover:bg-[#f8f9fa]'
          }`}
        >
          <FolderTree size={15} />
          <span>Taxonomy &amp; Disciplines</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai_governance')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'ai_governance'
              ? 'border-[#3366cc] text-[#3366cc] bg-[#ffffff] shadow-xs'
              : 'border-transparent text-[#54595d] hover:text-[#101418] hover:bg-[#f8f9fa]'
          }`}
        >
          <Sparkles size={15} className="text-[#3366cc]" />
          <span>AI Governance &amp; Controls</span>
        </button>
      </div>

      {/* ==================================================
          TAB 1: ARTICLE MODERATION DESK
          ================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {/* Sub-filters and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#ffffff] border border-[#eaecf0] p-3 rounded-sm shadow-xs">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { key: 'all', label: 'All Submissions', count: articles.length },
                { key: 'pending_review', label: 'Pending Review', count: pendingCount },
                { key: 'changes_requested', label: 'Changes Requested', count: changesCount },
                { key: 'published', label: 'Published', count: publishedCount },
                { key: 'rejected', label: 'Rejected', count: rejectedCount },
                { key: 'draft', label: 'Drafts', count: draftCount },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setSelectedStatusFilter(filter.key as any)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedStatusFilter === filter.key
                      ? 'bg-blue-50 text-[#3366cc] font-bold border border-blue-200'
                      : 'text-[#54595d] hover:text-[#101418] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className="text-[10px] px-1 py-0.2 bg-slate-200/70 rounded text-[#334155]">
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#72777d]" />
              <input
                type="text"
                value={moderationSearch}
                onChange={(e) => setModerationSearch(e.target.value)}
                placeholder="Search submission title, author..."
                className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm pl-8 pr-3 py-1 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none"
              />
            </div>
          </div>

          {/* Submissions List */}
          {articlesLoading ? (
            <LoadingState type="article" />
          ) : filteredArticles.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-12 text-center space-y-3">
              <CheckCircle size={36} className="mx-auto text-emerald-500" />
              <h3 className="font-serif text-lg font-bold text-[#101418]">
                No Submissions in this Queue
              </h3>
              <p className="text-xs text-[#54595d] max-w-md mx-auto">
                All articles under this filter have been processed or no entries match the criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((art) => {
                const isItemUpdating = actionArticleId === art.id;

                return (
                  <div
                    key={art.id}
                    className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 sm:p-5 space-y-3 hover:border-[#3366cc] transition-all shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(art.status)}
                        <span className="text-xs font-medium text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                          {art.category}
                        </span>
                        {art.subCategory && (
                          <span className="text-xs text-[#72777d] font-mono">
                            / {art.subCategory}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-[#72777d] flex items-center gap-2">
                        <span>Author: <strong className="text-[#101418]">{art.author}</strong></span>
                        <span>&bull;</span>
                        <span>Updated {art.lastUpdated || 'Recently'}</span>
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div>
                      <h2
                        onClick={() => {
                          setReviewingArticle(art);
                          setModalMode('view');
                        }}
                        className="font-serif text-lg sm:text-xl font-bold text-[#101418] hover:text-[#3366cc] hover:underline cursor-pointer"
                      >
                        {art.title}
                      </h2>
                      <p className="text-xs text-[#54595d] line-clamp-2 mt-1 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    {/* Moderation Notes Banner if existing */}
                    {art.moderationNotes && (
                      <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-sm text-xs text-amber-900 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                          <MessageSquare size={12} />
                          <span>Editorial Notes {art.reviewedBy ? `by ${art.reviewedBy}` : ''}:</span>
                        </div>
                        <p className="font-sans italic">{art.moderationNotes}</p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#eaecf0] text-xs">
                      <div className="text-[11px] font-mono text-[#72777d]">
                        Slug: <span className="text-[#101418]">/wiki/{art.slug}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Approve for pending/changes_requested */}
                        {art.status !== 'published' && (
                          <button
                            type="button"
                            disabled={isItemUpdating}
                            onClick={() => handleApprove(art)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-sm font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                            title="Quick approve and publish"
                          >
                            <Check size={12} className="text-emerald-700" />
                            <span>{isItemUpdating ? 'Approving...' : 'Approve'}</span>
                          </button>
                        )}

                        {/* Quick Reject for pending/changes_requested */}
                        {art.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={isItemUpdating}
                            onClick={() => {
                              setQuickRejectArticle(art);
                              setQuickRejectReason('Submission does not meet encyclopedia verification or citation standards.');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-sm font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                            title="Reject submission"
                          >
                            <XCircle size={12} className="text-rose-700" />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* Inspect Submission Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingArticle(art);
                            setModalMode('view');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm font-semibold cursor-pointer shadow-xs"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>

                        {/* Direct Edit */}
                        <button
                          type="button"
                          onClick={() => navigate(`/edit/${art.slug}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f8f9fa] hover:bg-[#ffffff] text-[#202122] border border-[#a2a9b1] rounded-sm font-semibold cursor-pointer"
                        >
                          <FileEdit size={12} className="text-[#3366cc]" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Article */}
                        <button
                          type="button"
                          onClick={() => setDeleteModalArticle(art)}
                          className="p-1 text-[#72777d] hover:text-red-700 rounded cursor-pointer"
                          title="Delete article"
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* Live Article Link if Published */}
                        {art.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => navigate(`/wiki/${art.slug}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[#3366cc] hover:underline"
                          >
                            <ExternalLink size={12} />
                            <span>Live</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          TAB: INVESTIGATION & EVIDENCE ENGINE DESK
          ================================================== */}
      {activeTab === 'investigations' && (
        <InvestigationEngineDesk
          userProfile={userProfile}
          user={user}
          role={simulatedRole || role}
          onNotification={(msg, type) => showNotification(msg, type || 'success')}
        />
      )}

      {/* ==================================================
          TAB 2: SCHOLAR REGISTRY & USER CLEARANCES
          ================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eaecf0] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#101418]">
                  Scholar Accounts &amp; Role Governance
                </h3>
                <p className="text-xs text-[#54595d]">
                  Configure contributor permissions, editorial clearances, and administrative authorities.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#72777d]" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search scholars by name, username..."
                  className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm pl-8 pr-3 py-1 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none"
                />
              </div>
            </div>

            {usersLoading ? (
              <LoadingState type="article" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#eaecf0] bg-[#f8f9fa] text-[#54595d] font-mono uppercase text-[10px]">
                      <th className="py-2.5 px-3">Scholar Profile</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Assigned Role</th>
                      <th className="py-2.5 px-3">Clearance Action</th>
                      <th className="py-2.5 px-3">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaecf0]">
                    {filteredUsers.map((u) => {
                      const isSuperAdminEmail = u.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();

                      return (
                        <tr key={u.id} className="hover:bg-[#f8f9fa]/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt={u.displayName}
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 rounded-sm object-cover border border-[#cbd5e1]"
                                />
                              ) : (
                                <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                                  isSuperAdminEmail ? 'bg-amber-700' : 'bg-[#3366cc]'
                                }`}>
                                  {u.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/user/${u.username}`)}
                                  className="font-semibold text-[#101418] hover:text-[#3366cc] truncate text-left block cursor-pointer"
                                >
                                  {u.displayName}
                                </button>
                                <div className="text-[11px] font-mono text-[#54595d]">
                                  @{u.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono text-[#54595d]">
                            {u.email}
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold border uppercase ${
                                isSuperAdminEmail || u.role === 'super_admin'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                  : u.role === 'admin' || u.role === 'administrator' || u.role === 'editor'
                                  ? 'bg-blue-50 text-[#3366cc] border-blue-200 font-bold'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {isSuperAdminEmail ? 'SUPER ADMIN' : u.role.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {isSuperAdminEmail ? (
                              <span className="text-[11px] font-mono text-amber-800 font-semibold">
                                Protected Super Admin
                              </span>
                            ) : (
                              <select
                                value={u.role}
                                disabled={userRoleUpdatingId === u.id}
                                onChange={(e) => handleUserRoleChange(u.id, e.target.value as UserRole)}
                                className="bg-[#ffffff] border border-[#a2a9b1] text-[#202122] text-xs rounded-sm px-2 py-1 focus:outline-none focus:border-[#3366cc] cursor-pointer"
                              >
                                <option value="user">Scholar / Contributor</option>
                                <option value="admin">Admin Curator</option>
                              </select>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            {isSuperAdminEmail ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                <Unlock size={10} /> Active (Protected)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUserStatusToggle(u.id, Boolean(u.disabled))}
                                disabled={userRoleUpdatingId === u.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm font-mono text-[10px] font-semibold cursor-pointer border ${
                                  u.disabled
                                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                }`}
                              >
                                {u.disabled ? <Lock size={10} /> : <Unlock size={10} />}
                                <span>{u.disabled ? 'Restricted' : 'Active'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          TAB 3: SYSTEM AUDIT LOG & REVISIONS
          ================================================== */}
      {activeTab === 'revisions' && (
        <div className="space-y-4">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 space-y-4 shadow-xs">
            <div className="border-b border-[#eaecf0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#101418]">
                Chronological System Audit &amp; Revision Stream
              </h3>
              <p className="text-xs text-[#54595d]">
                Immutable archival log of article publications, peer review decisions, and scholarly edits.
              </p>
            </div>

            {revisionsLoading ? (
              <LoadingState type="article" />
            ) : revisionsList.length === 0 ? (
              <p className="text-xs text-[#54595d] text-center py-6">No historical revisions recorded.</p>
            ) : (
              <div className="space-y-3">
                {revisionsList.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm space-y-1.5 text-xs hover:border-[#3366cc] transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(rev.actionType)}
                        <span className="font-serif font-bold text-[#101418]">
                          {rev.articleTitle || `Article ID: ${rev.articleId}`}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-[#72777d] flex items-center gap-1.5">
                        <Clock size={11} />
                        <span>{new Date(rev.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-[#334155] font-sans">
                      <strong className="text-[#101418]">{rev.editorName || 'Curator'}</strong>: {rev.changeSummary}
                    </p>

                    {rev.moderationNotes && (
                      <div className="text-[11px] bg-white border border-[#cbd5e1] p-2 rounded text-[#475569] font-mono">
                        Notes: {rev.moderationNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          TAB 4: TAXONOMY & CATEGORIES
          ================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 space-y-4 shadow-xs">
            <div className="border-b border-[#eaecf0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#101418]">
                Knowledge Taxonomy &amp; Disciplines
              </h3>
              <p className="text-xs text-[#54595d]">
                Core encyclopedia disciplines and classification registries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm space-y-2 hover:border-[#3366cc] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#101418]">{cat.name}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-[#3366cc] rounded border border-blue-200">
                      {cat.articleCount} entries
                    </span>
                  </div>
                  <p className="text-xs text-[#54595d] font-sans line-clamp-2">
                    {cat.description}
                  </p>
                  <div className="pt-2 border-t border-[#eaecf0] flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[#72777d]">/category/{cat.slug}</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/category/${cat.slug}`)}
                      className="text-[#3366cc] hover:underline inline-flex items-center gap-1 font-semibold text-xs cursor-pointer"
                    >
                      <span>Explore</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          TAB 5: AI GOVERNANCE & CONTROLS
          ================================================== */}
      {activeTab === 'ai_governance' && (
        <AdminAiControls />
      )}

      {/* ==================================================
          MODAL: QUICK REJECT DIALOG
          ================================================== */}
      {quickRejectArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <h3 className="font-serif font-bold text-base text-rose-900 flex items-center gap-2">
                <XCircle size={18} className="text-rose-700" />
                <span>Reject Submission</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuickRejectArticle(null)}
                className="text-[#72777d] hover:text-[#101418] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#334155]">
                You are rejecting the submission for: <strong className="text-[#101418]">"{quickRejectArticle.title}"</strong>.
              </p>

              <div className="space-y-1">
                <label className="block font-semibold text-[#101418]">Rejection Rationale / Feedback</label>
                <textarea
                  rows={3}
                  value={quickRejectReason}
                  onChange={(e) => setQuickRejectReason(e.target.value)}
                  placeholder="Explain the reason for rejecting this entry..."
                  className="w-full bg-white border border-[#a2a9b1] rounded-sm p-2 text-xs text-[#101418] focus:outline-none focus:border-rose-600"
                />
              </div>

              {/* Quick rationale presets */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-[#72777d] block">Common Rationale Presets:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Lacks required historical citations',
                    'Duplicate topic already documented',
                    'Fails encyclopedic tone guidelines',
                    'Incorrect historical chronology'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuickRejectReason(preset)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[#334155] rounded text-[10px] font-mono border border-slate-200 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => setQuickRejectArticle(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionArticleId === quickRejectArticle.id || quickRejectReason.trim().length < 5}
                onClick={() => handleReject(quickRejectArticle, quickRejectReason)}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-sm text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionArticleId === quickRejectArticle.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL: DELETE ARTICLE CONFIRMATION
          ================================================== */}
      {deleteModalArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] border border-red-300 rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={22} />
              </div>
              <h3 className="font-serif font-bold text-base text-[#101418]">
                Delete Article Permanently
              </h3>
            </div>

            <p className="text-xs text-[#54595d] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#101418]">"{deleteModalArticle.title}"</strong>? This will purge the record from the database and cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => setDeleteModalArticle(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-sm text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingArticle}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-sm text-xs font-semibold shadow-xs cursor-pointer"
              >
                {isDeletingArticle ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL: SUBMISSION REVIEW & DECISION DRAWER
          ================================================== */}
      {reviewingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#f8f9fa] border-b border-[#eaecf0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {getStatusBadge(reviewingArticle.status)}
                <span className="font-serif font-bold text-base text-[#101418] truncate max-w-md">
                  Review: {reviewingArticle.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReviewingArticle(null);
                  setModalMode('view');
                  setFeedbackNotes('');
                  setRejectionReason('');
                }}
                className="p-1 text-[#54595d] hover:text-[#101418] rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#202122] font-sans flex-1">
              {/* Metadata strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm font-mono text-[11px]">
                <div>
                  <span className="text-[#72777d] block text-[10px] uppercase">Author</span>
                  <span className="font-bold text-[#101418]">{reviewingArticle.author}</span>
                </div>
                <div>
                  <span className="text-[#72777d] block text-[10px] uppercase">Discipline</span>
                  <span className="font-bold text-[#3366cc]">{reviewingArticle.category}</span>
                </div>
                <div>
                  <span className="text-[#72777d] block text-[10px] uppercase">Est. Read Time</span>
                  <span className="font-bold text-[#101418]">{reviewingArticle.readingTimeMinutes} min</span>
                </div>
                <div>
                  <span className="text-[#72777d] block text-[10px] uppercase">Citations</span>
                  <span className="font-bold text-[#101418]">{reviewingArticle.citations?.length || 0} sources</span>
                </div>
              </div>

              {/* Lead Summary */}
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-sm text-[#101418]">Lead Summary Paragraph</h4>
                <div className="p-3 bg-[#f8f9fa] border-l-2 border-[#3366cc] rounded-r-sm text-xs leading-relaxed text-[#1e293b]">
                  {reviewingArticle.summary}
                </div>
              </div>

              {/* Structured Sections */}
              {reviewingArticle.sections && reviewingArticle.sections.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-sm text-[#101418]">Article Sections ({reviewingArticle.sections.length})</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {reviewingArticle.sections.map((sec, idx) => (
                      <div key={sec.id || idx} className="p-3 bg-[#ffffff] border border-[#eaecf0] rounded-sm space-y-1">
                        <div className="font-bold text-xs text-[#101418] flex items-center gap-1.5">
                          <span className="font-mono text-[#3366cc]">§{idx + 1}</span>
                          <span>{sec.title}</span>
                        </div>
                        <p className="text-xs text-[#475569] line-clamp-3">
                          {Array.isArray(sec.content) ? sec.content.join(' ') : sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citations & References */}
              {reviewingArticle.citations && reviewingArticle.citations.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-sm text-[#101418]">Scholarly References ({reviewingArticle.citations.length})</h4>
                  <ul className="space-y-1 bg-[#f8f9fa] p-3 rounded-sm border border-[#eaecf0]">
                    {reviewingArticle.citations.map((c) => (
                      <li key={c.id} className="text-[11px] font-mono text-[#475569]">
                        [{c.id}] {c.author ? `${c.author}. ` : ''}<em>{c.title}</em> {c.year ? `(${c.year})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* MODE 1: Request Changes Form */}
              {modalMode === 'request_changes' && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-700" />
                    <span>Editorial Change Request Instructions</span>
                  </div>
                  <p className="text-xs text-amber-800 font-sans">
                    Specify the exact citations, prose revisions, or clarifications required before publication:
                  </p>
                  <textarea
                    rows={4}
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="E.g., Please add citation for the third century BC timeline in section 2..."
                    className="w-full bg-white border border-amber-300 rounded-sm p-2 text-xs text-[#101418] focus:outline-none focus:border-amber-600"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setModalMode('view')}
                      className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-sm font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionArticleId === reviewingArticle.id}
                      onClick={() => handleRequestChanges(reviewingArticle)}
                      className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-sm font-semibold cursor-pointer shadow-xs"
                    >
                      {actionArticleId === reviewingArticle.id ? 'Sending...' : 'Send Feedback to Contributor'}
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: Rejection Form */}
              {modalMode === 'reject' && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-sm space-y-2">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <XCircle size={14} className="text-rose-700" />
                    <span>Rejection Rationale</span>
                  </div>
                  <p className="text-xs text-rose-800 font-sans">
                    Explain why this submission does not meet encyclopedic standards (will be recorded in audit log):
                  </p>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g., Content does not meet historical verification standards or is duplicate..."
                    className="w-full bg-white border border-rose-300 rounded-sm p-2 text-xs text-[#101418] focus:outline-none focus:border-rose-600"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setModalMode('view')}
                      className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-sm font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionArticleId === reviewingArticle.id}
                      onClick={() => handleReject(reviewingArticle)}
                      className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-sm font-semibold cursor-pointer shadow-xs"
                    >
                      {actionArticleId === reviewingArticle.id ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            {modalMode === 'view' && (
              <div className="px-5 py-3.5 bg-[#f8f9fa] border-t border-[#eaecf0] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingArticle(null);
                      navigate(`/edit/${reviewingArticle.slug}`);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#ffffff] hover:bg-[#f1f5f9] text-[#202122] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer"
                  >
                    <FileEdit size={13} className="text-[#3366cc]" />
                    <span>Open in Editor</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Request Changes */}
                  <button
                    type="button"
                    onClick={() => setModalMode('request_changes')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-sm text-xs font-semibold cursor-pointer"
                  >
                    <AlertTriangle size={13} className="text-amber-700" />
                    <span>Request Changes</span>
                  </button>

                  {/* Reject */}
                  {reviewingArticle.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => setModalMode('reject')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-sm text-xs font-semibold cursor-pointer"
                    >
                      <XCircle size={13} className="text-rose-700" />
                      <span>Reject</span>
                    </button>
                  )}

                  {/* Approve and Publish */}
                  {reviewingArticle.status !== 'published' && (
                    <button
                      type="button"
                      disabled={actionArticleId === reviewingArticle.id}
                      onClick={() => handleApprove(reviewingArticle)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle size={13} />
                      <span>{actionArticleId === reviewingArticle.id ? 'Publishing...' : 'Approve & Publish'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

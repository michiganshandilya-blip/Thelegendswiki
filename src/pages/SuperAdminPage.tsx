import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { useRouter } from '../context/RouterContext';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Sliders,
  FileText,
  Activity,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  Settings,
  Database,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Trash2,
  FileCheck2,
  Shield,
  Key,
  Copy,
  Check,
  Mail,
  Phone,
  Clock,
  User,
  Info,
  X,
} from 'lucide-react';
import { UserProfile, UserRole, AuditLogEntry, SystemSettings } from '../types';
import {
  getAllUsers,
  setUserRole,
  setUserStatus,
  deleteUserAccount,
  promoteUserToAdmin,
  demoteAdminToUser,
  subscribeToUsers,
  DESIGNATED_SUPER_ADMIN_EMAIL,
} from '../services/userService';
import { getAuditLogs, logAuditEvent } from '../services/auditService';
import { DEFAULT_SYSTEM_SETTINGS } from '../services/settingsService';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { useArticles } from '../data/dataProvider';
import { TheLegendsWikiLogo } from '../components/common/TheLegendsWikiLogo';

export const SuperAdminPage: React.FC = () => {
  const { currentUser, userProfile, effectiveRole, isSuperAdmin, resetPasswordEmail } = useAuth();
  const { currentRoute, navigate } = useRouter();
  const { articles } = useArticles({ includeAllStatuses: true, status: 'all' });
  const { settings, updateSettings, loading: settingsLoading, error: settingsError } = useSystemSettings();

  // Tab State
  const initialTab = (currentRoute.type === 'super-admin' && currentRoute.tab) || 'admins';
  const [activeTab, setActiveTab] = useState<'admins' | 'settings' | 'audit' | 'metrics'>(
    initialTab as any
  );

  // Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // User Profile Detail Modal & Security State
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserProfile | null>(null);
  const [resetPasswordStatus, setResetPasswordStatus] = useState<{
    loading: boolean;
    successMessage: string | null;
    errorMessage: string | null;
  }>({
    loading: false,
    successMessage: null,
    errorMessage: null,
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.warn('Could not copy to clipboard:', err);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      setResetPasswordStatus({
        loading: false,
        successMessage: null,
        errorMessage: 'This account does not have a registered email address.',
      });
      return;
    }
    setResetPasswordStatus({ loading: true, successMessage: null, errorMessage: null });
    try {
      const result = await resetPasswordEmail(cleanEmail);
      if (result.success) {
        const activeProject = auth?.app?.options?.projectId || 'thelegendswiki';
        setResetPasswordStatus({
          loading: false,
          successMessage: `Password reset request submitted for ${cleanEmail} via Firebase Authentication (Project: ${activeProject}). Please advise the user to check their email inbox and spam folder.`,
          errorMessage: null,
        });

        // Record Super Admin audit event for password reset dispatch
        logAuditEvent({
          actorUid: actorInfo.uid || 'system-super-admin',
          actorEmail: actorInfo.email || DESIGNATED_SUPER_ADMIN_EMAIL,
          actorRole: 'super_admin',
          action: 'Password Reset Dispatched',
          targetId: selectedUserDetails?.id || cleanEmail,
          targetTitle: `Password Reset: ${cleanEmail}`,
          targetType: 'user',
          details: `Super Admin dispatched official Firebase password reset link to ${cleanEmail} via Firebase project ${activeProject}.`,
        }).catch(console.warn);
      } else {
        setResetPasswordStatus({
          loading: false,
          successMessage: null,
          errorMessage: result.error || 'Failed to send password reset email.',
        });
      }
    } catch (err: any) {
      setResetPasswordStatus({
        loading: false,
        successMessage: null,
        errorMessage: err?.message || 'Error triggering password reset email.',
      });
    }
  };

  const formatDateTime = (val?: string | number | any): { date: string; time: string; full: string; iso: string } => {
    if (!val) {
      return { date: '—', time: '', full: 'Not recorded', iso: '—' };
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return { date: String(val), time: '', full: String(val), iso: String(val) };
    }
    return {
      date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      full: d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      iso: d.toISOString(),
    };
  };

  // User Management Filters
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'user'>('all');

  // Audit Filters
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    actionType: 'promote' | 'demote' | 'suspend' | 'activate' | 'delete';
    targetUser?: UserProfile;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    actionType: 'promote',
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [newRegionInput, setNewRegionInput] = useState<string>('');

  const actorInfo = useMemo(() => {
    const activeUid = auth?.currentUser?.uid || currentUser?.uid || userProfile?.id || '';
    const activeEmail = auth?.currentUser?.email || currentUser?.email || userProfile?.email || '';
    return {
      uid: activeUid,
      email: activeEmail,
      role: 'super_admin' as const,
    };
  }, [currentUser, userProfile]);

  // Load static data
  const loadData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    else setLoading(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const [fetchedUsers, fetchedLogs] = await Promise.all([
        getAllUsers(),
        getAuditLogs(),
      ]);

      setUsers(fetchedUsers);
      setAuditLogs(fetchedLogs);
    } catch (err: any) {
      console.error('[SuperAdminPage] Error loading super admin data:', err);
      setActionErrorMessage(err?.message || 'Failed to load user records from Firestore.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sync settingsForm whenever authoritative system settings load or change
  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  // Real-time synchronization
  useEffect(() => {
    // 1. Initial loads for logs
    getAuditLogs().then(setAuditLogs).catch(console.warn);

    // 2. Real-time users collection subscription
    const unsubscribeUsers = subscribeToUsers(
      (liveUsers) => {
        setUsers(liveUsers);
        setActionErrorMessage(null);
        setLoading(false);
        setRefreshing(false);
        setSelectedUserDetails((prev) => {
          if (!prev) return null;
          return liveUsers.find((u) => u.id === prev.id) || prev;
        });
      },
      (err) => {
        console.warn('[SuperAdminPage] Realtime subscription notice in SuperAdminPage:', err?.message || err);
        setLoading(false);
        setRefreshing(false);
      }
    );

    // 3. Listen to immediate in-app role change events
    const handleRoleChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; newRole: UserRole; user?: UserProfile }>;
      if (customEvent.detail) {
        setUsers((prev) =>
          prev.map((u) => (u.id === customEvent.detail.userId ? { ...u, role: customEvent.detail.newRole } : u))
        );
        setSelectedUserDetails((prev) => {
          if (!prev || prev.id !== customEvent.detail.userId) return prev;
          return { ...prev, role: customEvent.detail.newRole };
        });
        // Refresh audit logs
        getAuditLogs().then(setAuditLogs).catch(console.warn);
      }
    };

    const handleUserDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; user?: UserProfile }>;
      if (customEvent.detail?.userId) {
        setUsers((prev) => prev.filter((u) => u.id !== customEvent.detail.userId));
        getAuditLogs().then(setAuditLogs).catch(console.warn);
      }
    };

    window.addEventListener('thelegendswiki:user-role-changed', handleRoleChanged);
    window.addEventListener('thelegendswiki:user-deleted', handleUserDeleted);

    return () => {
      unsubscribeUsers();
      window.removeEventListener('thelegendswiki:user-role-changed', handleRoleChanged);
      window.removeEventListener('thelegendswiki:user-deleted', handleUserDeleted);
    };
  }, []);

  const handlePromoteClick = (target: UserProfile) => {
    setConfirmModal({
      isOpen: true,
      title: 'Promote User to Administrator',
      description: `Are you sure you want to promote @${target.username} (${target.email}) to the ADMIN role? They will gain access to article publishing, user moderation, and editorial review.`,
      actionLabel: 'Promote to Admin',
      actionType: 'promote',
      targetUser: target,
    });
  };

  const handleDemoteClick = (target: UserProfile) => {
    if (target.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()) {
      setActionErrorMessage('Cannot demote designated root Super Admin account.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Demote Administrator to User',
      description: `Are you sure you want to remove administrative privileges from @${target.username} (${target.email}) and set their role back to USER?`,
      actionLabel: 'Remove Admin Role',
      actionType: 'demote',
      targetUser: target,
    });
  };

  const handleToggleStatusClick = (target: UserProfile) => {
    const isSuspending = !target.disabled;
    setConfirmModal({
      isOpen: true,
      title: isSuspending ? 'Suspend Contributor Account' : 'Re-enable Contributor Account',
      description: isSuspending
        ? `Are you sure you want to suspend @${target.username} (${target.email})? They will not be able to author articles or submit contributions.`
        : `Re-enable account @${target.username} (${target.email}) to full standing?`,
      actionLabel: isSuspending ? 'Suspend Account' : 'Re-enable Account',
      actionType: isSuspending ? 'suspend' : 'activate',
      targetUser: target,
    });
  };

  const handleDeleteUserClick = (target: UserProfile) => {
    if (target.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()) {
      setActionErrorMessage('Cannot delete designated root Super Admin account.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Delete Contributor Account',
      description: `Are you sure you want to permanently delete @${target.username} (${target.email})? This action cannot be undone and will purge the contributor record.`,
      actionLabel: 'Delete Account',
      actionType: 'delete',
      targetUser: target,
    });
  };

  const executeModalAction = async () => {
    const target = confirmModal.targetUser;
    if (!target) return;

    const actionType = confirmModal.actionType;
    const previousRole = target.role;
    const previousDisabled = target.disabled;

    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
    setUpdatingUserId(target.id);

    try {
      if (actionType === 'promote') {
        const res = await promoteUserToAdmin(target.id, actorInfo);
        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === target.id ? { ...u, role: 'admin' as UserRole } : u))
          );
          setActionSuccessMessage(`Successfully promoted @${target.username} to ADMIN in database.`);
        } else {
          setActionErrorMessage(res.error || 'Failed to promote user in database.');
        }
      } else if (actionType === 'demote') {
        const res = await demoteAdminToUser(target.id, actorInfo);
        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === target.id ? { ...u, role: 'user' as UserRole } : u))
          );
          setActionSuccessMessage(`Successfully demoted @${target.username} to USER in database.`);
        } else {
          setActionErrorMessage(res.error || 'Failed to demote admin in database.');
        }
      } else if (actionType === 'suspend') {
        const res = await setUserStatus(target.id, true, actorInfo);
        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === target.id ? { ...u, disabled: true } : u))
          );
          setActionSuccessMessage(`Suspended account @${target.username}.`);
        } else {
          setActionErrorMessage(res.error || 'Failed to suspend account.');
        }
      } else if (actionType === 'activate') {
        const res = await setUserStatus(target.id, false, actorInfo);
        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === target.id ? { ...u, disabled: false } : u))
          );
          setActionSuccessMessage(`Re-enabled account @${target.username}.`);
        } else {
          setActionErrorMessage(res.error || 'Failed to re-enable account.');
        }
      } else if (actionType === 'delete') {
        const res = await deleteUserAccount(target.id, actorInfo);
        if (res.success) {
          setUsers((prev) => prev.filter((u) => u.id !== target.id));
          if (selectedUserDetails?.id === target.id) {
            setSelectedUserDetails(null);
          }
          setActionSuccessMessage(`Successfully deleted account @${target.username}.`);
        } else {
          setActionErrorMessage(res.error || 'Failed to delete account.');
        }
      }
      
      // Refresh audit logs
      const updatedLogs = await getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      console.error('SuperAdmin action exception:', err);
      setActionErrorMessage(err?.message || 'An unexpected error occurred executing the action.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      // Ensure the Save Governance Policy action waits for the authenticated Firebase user before attempting the Firestore write
      if (auth && typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }

      let activeAuthUser = auth?.currentUser;
      if (!activeAuthUser && auth) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 2000);
          const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
              activeAuthUser = u;
              clearTimeout(timeout);
              unsub();
              resolve();
            }
          });
        });
      }

      if (!activeAuthUser) {
        throw new Error('Authentication required: An active Firebase Auth session for the Super Admin is required to save system settings.');
      }

      const activeActorEmail = activeAuthUser.email || currentUser?.email || userProfile?.email || DESIGNATED_SUPER_ADMIN_EMAIL;

      const activeActor = {
        uid: activeAuthUser.uid,
        email: activeActorEmail,
        role: 'super_admin' as const,
      };

      // 1. Flow: SuperAdminPage save handler -> useSystemSettings -> updateSystemSettings -> Firestore "system_settings/global_config"
      const persisted = await updateSettings(settingsForm, activeActor);
      
      // 2. Update UI form state directly from verified backend data
      setSettingsForm(persisted);
      setActionSuccessMessage('Global system governance settings saved and verified in backend.');

      // 3. Update audit log view
      const logs = await getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('[SuperAdminPage] Failed to persist system settings to backend:', err);
      // Explicitly show actual backend error, never show fake success
      setActionErrorMessage(
        err?.message || (typeof err === 'string' ? err : 'Failed to save system configuration to Firestore database.')
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddRegion = () => {
    const trimmed = newRegionInput.trim();
    if (!trimmed) return;
    if (settingsForm.allowedRegions.includes(trimmed)) return;
    setSettingsForm((prev) => ({
      ...prev,
      allowedRegions: [...prev.allowedRegions, trimmed],
    }));
    setNewRegionInput('');
  };

  const handleRemoveRegion = (region: string) => {
    setSettingsForm((prev) => ({
      ...prev,
      allowedRegions: prev.allowedRegions.filter((r) => r !== region),
    }));
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter === 'super_admin' && u.role !== 'super_admin' && u.email.toLowerCase() !== DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()) return false;
      if (roleFilter === 'admin' && (u.role !== 'admin' && u.role !== 'editor' && u.role !== 'administrator')) return false;
      if (roleFilter === 'user' && (u.role !== 'user' && u.role !== 'registered_user')) return false;

      // Search term
      if (userSearchTerm.trim()) {
        const q = userSearchTerm.trim().toLowerCase();
        const matchName = u.displayName?.toLowerCase().includes(q);
        const matchUser = u.username?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        return matchName || matchUser || matchEmail;
      }
      return true;
    });
  }, [users, roleFilter, userSearchTerm]);

  // Filtered Audit Logs List
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditActionFilter !== 'all') {
        if (!log.action.toLowerCase().includes(auditActionFilter.toLowerCase())) {
          return false;
        }
      }
      if (auditSearchTerm.trim()) {
        const q = auditSearchTerm.trim().toLowerCase();
        return (
          log.action.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.actorEmail.toLowerCase().includes(q) ||
          (log.targetTitle && log.targetTitle.toLowerCase().includes(q)) ||
          (log.targetId && log.targetId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditLogs, auditActionFilter, auditSearchTerm]);

  // Metric stats
  const metrics = useMemo(() => {
    const superAdminCount = users.filter(
      (u) => u.role === 'super_admin' || u.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()
    ).length;
    const adminCount = users.filter(
      (u) =>
        (u.role === 'admin' || u.role === 'editor' || u.role === 'administrator') &&
        u.email.toLowerCase() !== DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase()
    ).length;
    const regularUserCount = users.filter(
      (u) => u.role === 'user' || u.role === 'registered_user'
    ).length;
    const suspendedCount = users.filter((u) => u.disabled).length;

    const publishedArticles = articles.filter((a) => a.status === 'published' || !a.status).length;
    const pendingArticles = articles.filter((a) => a.status === 'pending_review').length;
    const draftArticles = articles.filter((a) => a.status === 'draft').length;

    return {
      totalUsers: users.length,
      superAdminCount,
      adminCount,
      regularUserCount,
      suspendedCount,
      totalArticles: articles.length,
      publishedArticles,
      pendingArticles,
      draftArticles,
      totalAuditLogs: auditLogs.length,
    };
  }, [users, articles, auditLogs]);

  const currentEmail = userProfile?.email || currentUser?.email || DESIGNATED_SUPER_ADMIN_EMAIL;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Admin Dashboard', path: '/admin' },
          { label: 'Super Admin Control Center' },
        ]}
      />

      {/* SUPER ADMIN IDENTITY BANNER */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-[#334155] rounded-sm p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <TheLegendsWikiLogo size="lg" className="rounded-sm border border-amber-400/40 bg-slate-900/80 p-0.5 shadow-sm shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-2xs">
                  SUPER ADMIN CONTROL CENTER
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-2xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Root Authority Active
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
                Governance & Role Administration
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-300">
                <div>
                  <span className="text-slate-400">Logged in as:</span>{' '}
                  <strong className="text-white font-semibold">{currentEmail}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Role:</span>{' '}
                  <strong className="text-amber-400 font-bold">SUPER ADMIN</strong>
                </div>
                <div>
                  <span className="text-slate-400">Super Admin Account:</span>{' '}
                  <strong className="text-amber-300 underline font-mono">{DESIGNATED_SUPER_ADMIN_EMAIL}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
              icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Logs'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin')}
              icon={<ArrowRight size={13} />}
              className="text-xs"
            >
              Admin Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {actionSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-sm text-xs text-emerald-800 flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{actionSuccessMessage}</div>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-300 rounded-sm text-xs text-red-800 flex items-start gap-2.5 shadow-2xs">
          <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{actionErrorMessage}</div>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] rounded-sm shadow-2xs">
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-semibold">
            Super Admins
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 font-mono mt-1">
            {metrics.superAdminCount}
          </div>
          <div className="text-[10px] text-[#64748b] mt-0.5 font-mono truncate">
            {DESIGNATED_SUPER_ADMIN_EMAIL}
          </div>
        </div>

        <div className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] rounded-sm shadow-2xs">
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-semibold">
            Active Admins
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-700 font-mono mt-1">
            {metrics.adminCount}
          </div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Content & Review Managers</div>
        </div>

        <div className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] rounded-sm shadow-2xs">
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-semibold">
            Total Users
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#101418] font-mono mt-1">
            {metrics.regularUserCount}
          </div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Contributors & Researchers</div>
        </div>

        <div className="p-3.5 bg-[#ffffff] border border-[#cbd5e1] rounded-sm shadow-2xs">
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-semibold">
            Audit Events
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#059669] font-mono mt-1">
            {metrics.totalAuditLogs}
          </div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Immutable Actions Recorded</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#cbd5e1] flex items-center gap-1 sm:gap-2 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'admins'
              ? 'border-amber-600 text-amber-900 bg-amber-50/70'
              : 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50'
          }`}
        >
          <Users size={15} />
          <span>Admin & Role Management</span>
          <span className="font-mono text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded-2xs text-[#334155]">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'border-amber-600 text-amber-900 bg-amber-50/70'
              : 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50'
          }`}
        >
          <Sliders size={15} />
          <span>System Settings & Policies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-amber-600 text-amber-900 bg-amber-50/70'
              : 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50'
          }`}
        >
          <Activity size={15} />
          <span>Administrative Audit Log</span>
          <span className="font-mono text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded-2xs text-[#334155]">
            {auditLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'metrics'
              ? 'border-amber-600 text-amber-900 bg-amber-50/70'
              : 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50'
          }`}
        >
          <Database size={15} />
          <span>System Metrics & Health</span>
        </button>
      </div>

      {/* TAB 1: ADMIN & ROLE MANAGEMENT */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-[#ffffff] border border-[#cbd5e1] rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94a3b8]">
                <Search size={14} />
              </div>
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search by email, handle, or name..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-[#cbd5e1] rounded-sm bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
              <span className="text-[11px] font-mono text-[#64748b] uppercase mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-sm transition-colors cursor-pointer font-medium ${
                  roleFilter === 'all'
                    ? 'bg-[#1e293b] text-white'
                    : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
                }`}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('super_admin')}
                className={`px-2.5 py-1 text-xs rounded-sm transition-colors cursor-pointer font-medium ${
                  roleFilter === 'super_admin'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                Super Admin ({metrics.superAdminCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1 text-xs rounded-sm transition-colors cursor-pointer font-medium ${
                  roleFilter === 'admin'
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                Admins ({metrics.adminCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('user')}
                className={`px-2.5 py-1 text-xs rounded-sm transition-colors cursor-pointer font-medium ${
                  roleFilter === 'user'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
                }`}
              >
                Users ({metrics.regularUserCount})
              </button>
            </div>
          </div>

          {/* User List Table */}
          <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-sm overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#334155]">
                <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-mono uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="py-3 px-4">Contributor & UID</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Registered On</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#64748b]">
                        No users match the selected search query or role filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isRootSuperAdmin =
                        user.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();
                      const isAccountAdmin =
                        !isRootSuperAdmin &&
                        (user.role === 'admin' || user.role === 'editor' || user.role === 'administrator');
                      const isAccountUser =
                        !isRootSuperAdmin && !isAccountAdmin;
                      const regInfo = formatDateTime(user.createdAt);
                      const activeInfo = formatDateTime(user.lastActive);

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isRootSuperAdmin ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Name, Handle & Firebase UID */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-sm object-cover border border-[#cbd5e1] shrink-0 mt-0.5"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-sm text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5 ${
                                  isRootSuperAdmin ? 'bg-amber-700' : 'bg-[#3366cc]'
                                }`}>
                                  {user.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                                  <span>{user.displayName}</span>
                                  {isRootSuperAdmin && (
                                    <span className="text-[9px] font-mono uppercase font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded-2xs border border-amber-300">
                                      Root
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-[#64748b]">
                                  @{user.username}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-500 bg-slate-100/90 border border-slate-200 px-1.5 py-0.5 rounded-2xs w-fit">
                                  <span className="text-slate-400 font-sans">UID:</span>
                                  <span className="truncate max-w-[120px] select-all" title={user.id}>
                                    {user.id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(user.id, `table-uid-${user.id}`);
                                    }}
                                    title="Copy Firebase UID"
                                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                  >
                                    {copiedKey === `table-uid-${user.id}` ? (
                                      <Check size={10} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={10} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-xs text-[#0f172a]">
                              <span>{user.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(user.email, `table-email-${user.id}`)}
                                title="Copy email address"
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {copiedKey === `table-email-${user.id}` ? (
                                  <Check size={10} className="text-emerald-600" />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </button>
                            </div>
                            {user.phoneNumber && (
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Phone size={9} />
                                <span>{user.phoneNumber}</span>
                              </div>
                            )}
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-4">
                            {isRootSuperAdmin ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-amber-100 text-amber-900 border border-amber-300">
                                <ShieldCheck size={11} className="text-amber-700" />
                                SUPER ADMIN
                              </span>
                            ) : isAccountAdmin ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-blue-50 text-blue-800 border border-blue-200">
                                <Shield size={11} className="text-blue-700" />
                                ADMIN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-200">
                                USER
                              </span>
                            )}
                          </td>

                          {/* Registration Date */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="text-[#0f172a] font-medium">{regInfo.date}</div>
                            {regInfo.time && (
                              <div className="text-[10px] text-[#64748b]">{regInfo.time}</div>
                            )}
                          </td>

                          {/* Last Active */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="text-[#0f172a]">
                              {user.lastActive ? activeInfo.date : 'Recently'}
                            </div>
                            {user.lastActive && activeInfo.time && (
                              <div className="text-[10px] text-[#64748b]">{activeInfo.time}</div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {user.disabled ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-sm bg-red-100 text-red-800 border border-red-200">
                                <Lock size={10} /> Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={10} /> Active
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Details Button */}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedUserDetails(user)}
                                icon={<Eye size={12} />}
                                className="text-xs py-1 px-2 border-slate-300 text-slate-700 hover:text-slate-900 bg-white"
                                title="View full user details, UID, timestamps, and account profile"
                              >
                                Details
                              </Button>

                              {isRootSuperAdmin ? (
                                <span className="text-[11px] font-mono text-amber-800 italic bg-amber-100/60 px-2 py-1 rounded-sm border border-amber-200">
                                  Protected Root
                                </span>
                              ) : updatingUserId === user.id ? (
                                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-sm border border-amber-200">
                                  <RefreshCw size={12} className="animate-spin" />
                                  <span>Updating...</span>
                                </div>
                              ) : (
                                <>
                                  {isAccountUser && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handlePromoteClick(user)}
                                      icon={<UserCheck size={12} />}
                                      className="text-xs py-1 px-2.5 bg-blue-700 hover:bg-blue-800"
                                      title="Promote User to Admin role"
                                    >
                                      Promote
                                    </Button>
                                  )}

                                  {isAccountAdmin && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleDemoteClick(user)}
                                      icon={<UserX size={12} />}
                                      className="text-xs py-1 px-2.5 border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
                                      title="Remove Admin privileges and demote to User"
                                    >
                                      Demote
                                    </Button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatusClick(user)}
                                    title={user.disabled ? 'Re-enable account' : 'Suspend account'}
                                    className={`p-1.5 rounded-sm border transition-colors cursor-pointer ${
                                      user.disabled
                                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                        : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                                    }`}
                                  >
                                    {user.disabled ? <Unlock size={13} /> : <Lock size={13} />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUserClick(user)}
                                    title="Delete contributor account"
                                    className="p-1.5 rounded-sm border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => navigate(`/user/${user.username}`)}
                                    title="View public profile"
                                    className="p-1.5 rounded-sm border border-[#cbd5e1] text-[#64748b] hover:text-[#0f172a] hover:bg-slate-100 cursor-pointer"
                                  >
                                    <ExternalLink size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM SETTINGS & POLICIES */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-sm p-6 space-y-6 shadow-xs">
            <div className="border-b border-[#eaecf0] pb-3">
              <h2 className="text-base font-bold font-serif text-[#0f172a] flex items-center gap-2">
                <Sliders size={18} className="text-amber-700" />
                Global Platform Governance & Moderation Policies
              </h2>
              <p className="text-xs text-[#64748b] mt-1 font-sans">
                These platform-wide rules govern content submission, editorial verification thresholds, and global security policies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policy 1: Require Peer Review */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#0f172a]">
                    Require Editorial Peer Review
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.requirePeerReview}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          requirePeerReview: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  When enabled, all User submissions must be formally approved by an Admin before appearing publicly in the encyclopedia.
                </p>
              </div>

              {/* Policy 2: Allow Public Submissions */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#0f172a]">
                    Allow Public User Submissions
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.allowPublicSubmissions}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          allowPublicSubmissions: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  Permits standard authenticated Users to author new draft articles and submit them for editorial consideration.
                </p>
              </div>

              {/* Policy 3: Auto-Flag Spam */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#0f172a]">
                    Automated Link & Spam Detection
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.autoFlagSpam}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          autoFlagSpam: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  Automatically flags submissions containing unverified external domains or spam patterns.
                </p>
              </div>

              {/* Policy 4: Maintenance Mode */}
              <div className="p-4 bg-red-50/50 border border-red-200 rounded-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-red-900 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-red-600" />
                    Platform Maintenance Mode
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.maintenanceMode}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          maintenanceMode: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600" />
                  </label>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Freezes all public modifications and restricts article authoring exclusively to Super Admins.
                </p>
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="space-y-2 pt-2 border-t border-[#eaecf0]">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wider font-mono">
                  Global System Announcement Banner
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#64748b]">
                  <input
                    type="checkbox"
                    checked={settingsForm.announcementActive}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        announcementActive: e.target.checked,
                      }))
                    }
                    className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Active on Homepage</span>
                </label>
              </div>
              <input
                type="text"
                value={settingsForm.announcementBanner}
                onChange={(e) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    announcementBanner: e.target.value,
                  }))
                }
                placeholder="Broadcast a system-wide announcement to all visitors..."
                className="w-full text-xs p-2.5 border border-[#cbd5e1] rounded-sm bg-white text-[#0f172a] focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            {/* Featured Series Promotional Banner */}
            <div className="space-y-3 pt-2 border-t border-[#eaecf0]">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wider font-mono">
                  Featured Series Promotional Banner
                </label>
                <label className="flex items-center gap-2 text-xs font-mono text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.featuredSeries?.active !== false}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        featuredSeries: {
                          ...(prev.featuredSeries || {
                            title: 'Who Taught Us to Want This?',
                            slug: 'who-taught-us-to-want-this',
                            bannerImageUrl: '',
                            active: true,
                          }),
                          active: e.target.checked,
                        },
                      }))
                    }
                    className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Active on Homepage</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] text-slate-600">Series Title</span>
                  <input
                    type="text"
                    value={settingsForm.featuredSeries?.title || 'Who Taught Us to Want This?'}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        featuredSeries: {
                          ...(prev.featuredSeries || {
                            slug: 'who-taught-us-to-want-this',
                            bannerImageUrl: '',
                            active: true,
                          }),
                          title: e.target.value,
                        },
                      }))
                    }
                    className="w-full text-xs p-2 border border-[#cbd5e1] rounded-sm bg-white text-[#0f172a] focus:outline-none focus:border-amber-600"
                    placeholder="Who Taught Us to Want This?"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[11px] text-slate-600">Series URL Slug</span>
                  <input
                    type="text"
                    value={settingsForm.featuredSeries?.slug || 'who-taught-us-to-want-this'}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        featuredSeries: {
                          ...(prev.featuredSeries || {
                            title: 'Who Taught Us to Want This?',
                            bannerImageUrl: '',
                            active: true,
                          }),
                          slug: e.target.value,
                          targetPath: `/series/${e.target.value}`,
                        },
                      }))
                    }
                    className="w-full text-xs p-2 border border-[#cbd5e1] rounded-sm bg-white text-[#0f172a] focus:outline-none focus:border-amber-600 font-mono"
                    placeholder="who-taught-us-to-want-this"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <span className="font-mono text-[11px] text-slate-600">Custom Promotional Image URL</span>
                  <input
                    type="text"
                    value={settingsForm.featuredSeries?.bannerImageUrl || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        featuredSeries: {
                          ...(prev.featuredSeries || {
                            title: 'Who Taught Us to Want This?',
                            slug: 'who-taught-us-to-want-this',
                            active: true,
                          }),
                          bannerImageUrl: e.target.value,
                        },
                      }))
                    }
                    className="w-full text-xs p-2 border border-[#cbd5e1] rounded-sm bg-white text-[#0f172a] focus:outline-none focus:border-amber-600 font-mono"
                    placeholder="https://... or upload custom artwork directly from Homepage banner"
                  />
                </div>
              </div>
            </div>

            {/* Region Taxonomy Governance */}
            <div className="space-y-3 pt-2 border-t border-[#eaecf0]">
              <label className="block text-xs font-semibold text-[#0f172a] uppercase tracking-wider font-mono">
                Approved Investigation Regions
              </label>
              <div className="flex flex-wrap gap-2">
                {settingsForm.allowedRegions.map((region) => (
                  <span
                    key={region}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium"
                  >
                    <span>{region}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRegion(region)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                      title="Remove region"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-sm pt-1">
                <input
                  type="text"
                  value={newRegionInput}
                  onChange={(e) => setNewRegionInput(e.target.value)}
                  placeholder="Add custom region..."
                  className="flex-1 text-xs px-3 py-1.5 border border-[#cbd5e1] rounded-sm bg-white text-[#0f172a] focus:outline-none focus:border-amber-600"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddRegion}
                  className="text-xs"
                >
                  Add Region
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-[#eaecf0] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#64748b]">
                Last updated by: {settings.updatedBy} at {new Date(settings.updatedAt).toLocaleString()}
              </span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={savingSettings}
                icon={<Settings size={15} />}
                className="bg-amber-700 hover:bg-amber-800"
              >
                {savingSettings ? 'Saving Governance Policy...' : 'Save Governance Policy'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: COMPREHENSIVE ADMINISTRATIVE AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-[#ffffff] border border-[#cbd5e1] rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94a3b8]">
                <Search size={14} />
              </div>
              <input
                type="text"
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                placeholder="Search audit actions, emails, details..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-[#cbd5e1] rounded-sm bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <span className="text-[11px] font-mono text-[#64748b] uppercase">Action:</span>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-[#cbd5e1] rounded-sm bg-white text-[#0f172a] focus:outline-none focus:border-amber-600"
              >
                <option value="all">All Actions ({auditLogs.length})</option>
                <option value="Admin">Admin Promotions / Demotions</option>
                <option value="Role">Role Changes</option>
                <option value="Contribution">Contribution Approvals / Rejections</option>
                <option value="Article">Article Events</option>
                <option value="Setting">System Settings Changed</option>
                <option value="User">User Suspensions</option>
              </select>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-sm overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#334155]">
                <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-mono uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor & Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target / Record</th>
                    <th className="py-3 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#64748b]">
                        No audit log records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const isSuperActor =
                        log.actorRole === 'super_admin' ||
                        log.actorEmail?.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Timestamp */}
                          <td className="py-3 px-4 font-mono text-[11px] text-[#64748b] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>

                          {/* Actor */}
                          <td className="py-3 px-4 font-mono font-medium text-[#0f172a]">
                            {log.actorEmail}
                          </td>

                          {/* Actor Role */}
                          <td className="py-3 px-4">
                            {isSuperActor ? (
                              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-2xs bg-amber-100 text-amber-900 border border-amber-300">
                                SUPER ADMIN
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-2xs bg-blue-50 text-blue-800 border border-blue-200">
                                {log.actorRole?.toUpperCase() || 'ADMIN'}
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#0f172a] bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                              {log.action}
                            </span>
                          </td>

                          {/* Target */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-[#0f172a] max-w-[200px] truncate">
                              {log.targetTitle || log.targetId || '—'}
                            </div>
                            {log.targetType && (
                              <span className="text-[10px] font-mono text-[#64748b] uppercase">
                                [{log.targetType}]
                              </span>
                            )}
                          </td>

                          {/* Details */}
                          <td className="py-3 px-4 text-[#475569] max-w-md leading-relaxed">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM METRICS & HEALTH */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Health Card */}
          <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#eaecf0] pb-3">
              <Database size={18} className="text-amber-700" />
              <h3 className="text-sm font-bold font-serif text-[#0f172a]">
                Database & Security Rules Health
              </h3>
            </div>

            <div className="space-y-2 text-xs text-[#334155]">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm">
                <span className="text-slate-600 font-mono">Backend RBAC Engine:</span>
                <span className="text-emerald-700 font-bold font-mono flex items-center gap-1">
                  <CheckCircle2 size={13} /> Firestore Rules v2 (Hardened)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm">
                <span className="text-slate-600 font-mono">Designated Root Account:</span>
                <span className="text-amber-800 font-bold font-mono">
                  {DESIGNATED_SUPER_ADMIN_EMAIL}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm">
                <span className="text-slate-600 font-mono">Immutable Audit Logs:</span>
                <span className="text-emerald-700 font-bold font-mono">
                  Enforced (Create & Read Only)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm">
                <span className="text-slate-600 font-mono">Client-Side Role Escalation:</span>
                <span className="text-emerald-700 font-bold font-mono">
                  BLOCKED by Server Rules
                </span>
              </div>
            </div>
          </div>

          {/* Content Breakdown Card */}
          <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#eaecf0] pb-3">
              <FileCheck2 size={18} className="text-blue-700" />
              <h3 className="text-sm font-bold font-serif text-[#0f172a]">
                Encyclopedia Content Distribution
              </h3>
            </div>

            <div className="space-y-2 text-xs text-[#334155]">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm">
                <span className="text-slate-600">Total Encyclopedia Entries:</span>
                <span className="font-bold font-mono text-[#0f172a]">{metrics.totalArticles}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm">
                <span className="text-slate-600">Published & Live Dossiers:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {metrics.publishedArticles}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm">
                <span className="text-slate-600">Pending Editorial Review:</span>
                <span className="font-bold font-mono text-amber-700">
                  {metrics.pendingArticles}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-sm">
                <span className="text-slate-600">Draft Investigations:</span>
                <span className="font-bold font-mono text-slate-700">{metrics.draftArticles}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-9 h-9 rounded-sm bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold font-serif text-base text-[#0f172a]">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="pt-3 border-t border-[#eaecf0] flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={executeModalAction}
                className={
                  confirmModal.actionType === 'demote' ||
                  confirmModal.actionType === 'suspend' ||
                  confirmModal.actionType === 'delete'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-amber-700 hover:bg-amber-800'
                }
              >
                {confirmModal.actionLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* USER ACCOUNT & PROFILE DETAILS MODAL */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-sm max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#eaecf0] pb-4">
              <div className="flex items-center gap-3.5">
                {selectedUserDetails.photoURL ? (
                  <img
                    src={selectedUserDetails.photoURL}
                    alt={selectedUserDetails.displayName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-sm object-cover border border-[#cbd5e1]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-sm bg-[#3366cc] text-white flex items-center justify-center font-bold text-base font-mono">
                    {selectedUserDetails.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold font-serif text-[#0f172a]">
                      {selectedUserDetails.displayName}
                    </h2>
                    {selectedUserDetails.email.toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() && (
                      <span className="text-[10px] font-mono uppercase font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-2xs border border-amber-300">
                        Root Super Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#64748b]">
                    @{selectedUserDetails.username}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserDetails(null);
                  setResetPasswordStatus({ loading: false, successMessage: null, errorMessage: null });
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-sm hover:bg-slate-100 cursor-pointer"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              {/* Firebase Auth UID */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold flex items-center justify-between">
                  <span>Firebase Auth UID</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedUserDetails.id, 'modal-uid')}
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-sans text-[11px] cursor-pointer"
                  >
                    {copiedKey === 'modal-uid' ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedKey === 'modal-uid' ? 'Copied' : 'Copy UID'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-[#0f172a] font-medium break-all select-all bg-white p-1.5 rounded-2xs border border-slate-200">
                  {selectedUserDetails.id}
                </div>
              </div>

              {/* Email Address */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold flex items-center justify-between">
                  <span>Email Address</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedUserDetails.email, 'modal-email')}
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-sans text-[11px] cursor-pointer"
                  >
                    {copiedKey === 'modal-email' ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedKey === 'modal-email' ? 'Copied' : 'Copy Email'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-[#0f172a] font-medium break-all bg-white p-1.5 rounded-2xs border border-slate-200 flex items-center justify-between">
                  <span>{selectedUserDetails.email}</span>
                  <a
                    href={`mailto:${selectedUserDetails.email}`}
                    className="text-blue-600 hover:text-blue-800 ml-2 shrink-0"
                    title="Send email"
                  >
                    <Mail size={13} />
                  </a>
                </div>
              </div>

              {/* Role & Privileges */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Platform Role & Governance Authority
                </div>
                <div className="pt-0.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm border ${
                      selectedUserDetails.role === 'super_admin'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : selectedUserDetails.role === 'admin' || selectedUserDetails.role === 'editor'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <Shield size={12} />
                    {selectedUserDetails.role.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {selectedUserDetails.role === 'super_admin'
                      ? 'Root Administrative Authority'
                      : selectedUserDetails.role === 'admin'
                      ? 'Editorial & Moderation Staff'
                      : 'Registered Contributor'}
                  </span>
                </div>
              </div>

              {/* Account Status */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Account Moderation Status
                </div>
                <div className="pt-0.5">
                  {selectedUserDetails.disabled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded-sm bg-red-100 text-red-800 border border-red-200">
                      <Lock size={12} /> Suspended / Access Disabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium uppercase px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} /> Active & Good Standing
                    </span>
                  )}
                </div>
              </div>

              {/* Registration / Creation Date */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Calendar size={11} /> Registration / Created Date
                </div>
                <div className="font-mono text-xs text-[#0f172a] font-medium">
                  {formatDateTime(selectedUserDetails.createdAt).full}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  ISO: {formatDateTime(selectedUserDetails.createdAt).iso}
                </div>
              </div>

              {/* Last Activity / Sign-in */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Clock size={11} /> Last Activity / Sign-In
                </div>
                <div className="font-mono text-xs text-[#0f172a] font-medium">
                  {selectedUserDetails.lastActive
                    ? formatDateTime(selectedUserDetails.lastActive).full
                    : 'Recently active'}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  ISO: {selectedUserDetails.lastActive ? formatDateTime(selectedUserDetails.lastActive).iso : '—'}
                </div>
              </div>

              {/* Phone number */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Phone size={11} /> Verified Contact Phone
                </div>
                <div className="font-mono text-xs text-[#0f172a]">
                  {selectedUserDetails.phoneNumber || 'Not provided'}
                </div>
              </div>

              {/* Authored Encyclopedia Articles */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <FileText size={11} /> Authored Encyclopedia Entries
                </div>
                <div className="font-mono text-xs font-bold text-blue-700">
                  {selectedUserDetails.articlesCount ?? 0} published dossiers
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1 text-xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                Scholar Bio & Research Background
              </div>
              <p className="text-slate-700 italic">
                {selectedUserDetails.bio || 'No public biography provided by contributor.'}
              </p>
            </div>

            {/* Security & Password Assistance Section */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-sm space-y-3">
              <div className="flex items-start gap-2.5 text-amber-900">
                <Key size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold font-serif text-xs uppercase tracking-wide">
                    Authentication Security & Password Reset Flow
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Passwords are encrypted server-side by Firebase Authentication and are never transmitted, readable, or stored in Firestore. If the user has lost access or forgot their credentials, dispatch an official password reset link directly to their registered email address.
                  </p>
                </div>
              </div>

              {resetPasswordStatus.successMessage && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-sm text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                  <span>{resetPasswordStatus.successMessage}</span>
                </div>
              )}

              {resetPasswordStatus.errorMessage && (
                <div className="p-2.5 bg-red-100 border border-red-300 rounded-sm text-xs text-red-800 font-medium flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-700 shrink-0" />
                  <span>{resetPasswordStatus.errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-slate-600">
                  Target: <strong className="text-slate-900">{selectedUserDetails.email}</strong>
                  <span className="ml-1.5 text-[10px] text-slate-400 font-sans">
                    ({auth?.app?.options?.projectId || 'thelegendswiki'})
                  </span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSendPasswordReset(selectedUserDetails.email)}
                  disabled={resetPasswordStatus.loading}
                  icon={<Mail size={13} className={resetPasswordStatus.loading ? 'animate-spin' : ''} />}
                  className="text-xs bg-white hover:bg-slate-50 border-amber-300 text-amber-900 font-medium cursor-pointer"
                >
                  {resetPasswordStatus.loading ? 'Dispatching Link...' : 'Send Password Reset Email'}
                </Button>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="pt-3 border-t border-[#eaecf0] flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/user/${selectedUserDetails.username}`)}
                icon={<ExternalLink size={13} />}
                className="text-xs cursor-pointer"
              >
                View Public Profile
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedUserDetails(null);
                    setResetPasswordStatus({ loading: false, successMessage: null, errorMessage: null });
                  }}
                  className="cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

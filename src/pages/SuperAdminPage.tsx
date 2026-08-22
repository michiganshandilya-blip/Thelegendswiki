import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
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
import { getAuditLogs } from '../services/auditService';
import { getSystemSettings, updateSystemSettings, DEFAULT_SYSTEM_SETTINGS } from '../services/settingsService';
import { useArticles } from '../data/dataProvider';

export const SuperAdminPage: React.FC = () => {
  const { currentUser, userProfile, effectiveRole, isSuperAdmin } = useAuth();
  const { currentRoute, navigate } = useRouter();
  const { articles } = useArticles();

  // Tab State
  const initialTab = (currentRoute.type === 'super-admin' && currentRoute.tab) || 'admins';
  const [activeTab, setActiveTab] = useState<'admins' | 'settings' | 'audit' | 'metrics'>(
    initialTab as any
  );

  // Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

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
    return {
      uid: currentUser?.uid || 'usr-super-admin-01',
      email: userProfile?.email || currentUser?.email || DESIGNATED_SUPER_ADMIN_EMAIL,
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
      const [fetchedUsers, fetchedLogs, fetchedSettings] = await Promise.all([
        getAllUsers(),
        getAuditLogs(),
        getSystemSettings(),
      ]);

      setUsers(fetchedUsers);
      setAuditLogs(fetchedLogs);
      setSettings(fetchedSettings);
      setSettingsForm(fetchedSettings);
    } catch (err) {
      console.warn('Error loading super admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Real-time synchronization
  useEffect(() => {
    // 1. Initial loads for logs & settings
    getAuditLogs().then(setAuditLogs).catch(console.warn);
    getSystemSettings().then((s) => {
      setSettings(s);
      setSettingsForm(s);
    }).catch(console.warn);

    // 2. Real-time users collection subscription
    const unsubscribeUsers = subscribeToUsers(
      (liveUsers) => {
        setUsers(liveUsers);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.warn('Realtime subscription error in SuperAdminPage:', err);
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
        // Refresh audit logs
        getAuditLogs().then(setAuditLogs).catch(console.warn);
      }
    };

    window.addEventListener('thelegendswiki:user-role-changed', handleRoleChanged);

    return () => {
      unsubscribeUsers();
      window.removeEventListener('thelegendswiki:user-role-changed', handleRoleChanged);
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
      const updated = await updateSystemSettings(settingsForm, actorInfo);
      setSettings(updated);
      setSettingsForm(updated);
      setActionSuccessMessage('Global system governance settings updated successfully.');
      const logs = await getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      setActionErrorMessage(err?.message || 'Failed to save settings.');
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
            <div className="w-12 h-12 rounded-sm bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={26} />
            </div>
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
                    <th className="py-3 px-4">Contributor / Account</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4 text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#64748b]">
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

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isRootSuperAdmin ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Name & Handle */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-sm object-cover border border-[#cbd5e1] shrink-0"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-sm text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
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
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 font-mono text-xs text-[#0f172a]">
                            {user.email}
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

                          {/* Last Active */}
                          <td className="py-3 px-4 text-[#64748b] font-mono text-[11px]">
                            {user.lastActive
                              ? new Date(user.lastActive).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recently'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isRootSuperAdmin ? (
                                <span className="text-[11px] font-mono text-amber-800 italic bg-amber-100/60 px-2 py-1 rounded-sm border border-amber-200">
                                  Protected Super Admin
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
                                      Promote to Admin
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
                                      Demote to User
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
                {savingSettings ? 'Saving Governance Policies...' : 'Save System Configuration'}
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
                  confirmModal.actionType === 'demote' || confirmModal.actionType === 'suspend'
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
    </div>
  );
};

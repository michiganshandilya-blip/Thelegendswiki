import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { Button } from '../common/Button';
import { ShieldAlert, Lock, ArrowLeft, LogIn, UserPlus, Shield } from 'lucide-react';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'user',
  fallbackTitle,
  fallbackDescription,
}) => {
  const { isAuthenticated, role, isSuperAdmin, isAdmin, loading, userProfile, currentUser } = useAuth();
  const { navigate } = useRouter();

  if (loading) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center space-y-4 py-12">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-t-[#3366cc] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <span className="text-xs font-mono text-[#54595d] uppercase tracking-widest">
          Verifying Security Clearance...
        </span>
      </div>
    );
  }

  // 1. Unauthenticated case
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-xs relative overflow-hidden">
        <div className="mx-auto w-12 h-12 rounded-sm bg-blue-50 border border-blue-200 flex items-center justify-center text-[#3366cc] shadow-xs">
          <Lock size={22} />
        </div>

        <div className="space-y-2">
          <div className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-[#3366cc] bg-blue-50 px-2.5 py-0.5 rounded-sm border border-blue-200">
            Authentication Required
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#101418] font-serif">
            {fallbackTitle || 'Access Restricted'}
          </h2>
          <p className="text-xs sm:text-sm text-[#54595d] max-w-md mx-auto leading-relaxed font-sans">
            {fallbackDescription ||
              'You must be signed in with a verified researcher or administrator account to access this system section.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/login')}
            icon={<LogIn size={16} />}
            className="w-full sm:w-auto"
          >
            Log In to Continue
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/signup')}
            icon={<UserPlus size={16} />}
            className="w-full sm:w-auto"
          >
            Create Contributor Account
          </Button>
        </div>

        <div className="pt-4 border-t border-[#eaecf0]">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-[#54595d] hover:text-[#3366cc] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} /> Return to Main Encyclopedia
          </button>
        </div>
      </div>
    );
  }

  // 2. Role hierarchy verification (USER -> ADMIN -> SUPER ADMIN)
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    user: 1,
    registered_user: 1,
    admin: 2,
    editor: 2,
    administrator: 2,
    super_admin: 3,
  };

  const userLevel = isSuperAdmin ? 3 : isAdmin ? 2 : (roleHierarchy[role] || 1);
  const requiredLevel = roleHierarchy[requiredRole] || 1;

  if (userLevel < requiredLevel) {
    const isSuperAdminRequired = requiredRole === 'super_admin';
    const requiredTitle = isSuperAdminRequired
      ? 'Super Admin (michiganshandilya@gmail.com)'
      : 'Administrator';

    const userDisplayRole = isSuperAdmin
      ? 'SUPER ADMIN'
      : isAdmin
      ? 'ADMIN'
      : 'USER';

    const currentEmail = userProfile?.email || currentUser?.email || 'authenticated user';

    return (
      <div className="max-w-xl mx-auto my-12 bg-[#ffffff] border border-red-200 rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-xs relative overflow-hidden">
        <div className="mx-auto w-12 h-12 rounded-sm bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shadow-xs">
          <ShieldAlert size={22} />
        </div>

        <div className="space-y-2">
          <div className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2.5 py-0.5 rounded-sm border border-red-200">
            {isSuperAdminRequired ? 'Super Admin Clearance Required' : 'Administrative Clearance Required'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#101418] font-serif">
            Insufficient Permissions
          </h2>
          <p className="text-xs sm:text-sm text-[#54595d] max-w-md mx-auto leading-relaxed font-sans">
            This high-security governance section requires{' '}
            <strong className="text-[#101418] font-mono">{requiredTitle}</strong> privileges.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs font-mono text-left space-y-1 text-[#334155] max-w-md mx-auto mt-2">
            <div>
              <span className="text-slate-500">Logged in as:</span>{' '}
              <span className="font-semibold text-slate-800">{currentEmail}</span>
            </div>
            <div>
              <span className="text-slate-500">Current Role:</span>{' '}
              <span className="font-bold text-amber-700">{userDisplayRole}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={15} />}
          >
            Return to Main Codex
          </Button>
          {isAdmin && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/admin')}
              icon={<Shield size={15} />}
            >
              Go to Admin Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

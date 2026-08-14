import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { Button } from '../common/Button';
import { ShieldAlert, Lock, ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'registered_user',
  fallbackTitle,
  fallbackDescription,
}) => {
  const { isAuthenticated, role, loading } = useAuth();
  const { navigate } = useRouter();

  if (loading) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center space-y-4 py-12">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
          <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Authenticating Archival Clearance...
        </span>
      </div>
    );
  }

  // 1. Unauthenticated case
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-[#0e1424] border border-slate-800 rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="mx-auto w-12 h-12 rounded-sm bg-blue-950/80 border border-blue-600/40 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Lock size={22} />
        </div>

        <div className="space-y-2">
          <div className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-sm border border-blue-500/30">
            Authentication Required
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            {fallbackTitle || 'Contributor Access Restricted'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {fallbackDescription ||
              'You must be signed in with a verified researcher account to access this curation workspace or contribute to TheLegendsWiki codex.'}
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
            variant="outline"
            size="md"
            onClick={() => navigate('/signup')}
            icon={<UserPlus size={16} />}
            className="w-full sm:w-auto"
          >
            Create Researcher Account
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-blue-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} /> Return to Main Encyclopedia
          </button>
        </div>
      </div>
    );
  }

  // 2. Role clearance check
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    registered_user: 1,
    editor: 2,
    administrator: 3,
  };

  const userLevel = roleHierarchy[role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 1;

  if (userLevel < requiredLevel) {
    const requiredTitle =
      requiredRole === 'administrator'
        ? 'Archival Administrator'
        : requiredRole === 'editor'
        ? 'Senior Editor'
        : 'Registered Scholar';

    return (
      <div className="max-w-xl mx-auto my-12 bg-[#0e1424] border border-amber-900/40 rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="mx-auto w-12 h-12 rounded-sm bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <ShieldAlert size={22} />
        </div>

        <div className="space-y-2">
          <div className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-sm border border-amber-500/30">
            Elevated Clearance Required
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            Insufficient Permissions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            This administrative partition requires{' '}
            <strong className="text-amber-300">{requiredTitle}</strong> clearance. Your current account
            is registered as{' '}
            <span className="font-mono text-slate-300 capitalize">{role.replace('_', ' ')}</span>.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={15} />}
          >
            Return to Knowledge Archives
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { ShieldAlert, HelpCircle, Mail, LogOut, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface SuspendedAccountNoticeProps {
  /**
   * If true, the authenticated user is the one whose account is suspended.
   * If false, a public visitor or other user is attempting to view a suspended profile.
   */
  isOwnAccount?: boolean;
  /**
   * Optional custom return path
   */
  returnPath?: string;
  /**
   * Optional callback when an admin decides to unsuspend (if viewed by admin)
   */
  onUnsuspend?: () => void;
  isAdminViewing?: boolean;
}

export const SuspendedAccountNotice: React.FC<SuspendedAccountNoticeProps> = ({
  isOwnAccount = false,
  returnPath = '/',
  onUnsuspend,
  isAdminViewing = false,
}) => {
  const { navigate } = useRouter();
  const { logout } = useAuth();
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Case 1: The authenticated user themselves is suspended
  if (isOwnAccount) {
    return (
      <div 
        id="suspended-account-own-screen"
        className="max-w-xl mx-auto my-12 bg-[#ffffff] border border-red-300 rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-xs relative"
      >
        <div 
          id="suspended-account-icon-wrapper"
          className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shadow-xs"
        >
          <ShieldAlert size={26} />
        </div>

        <div id="suspended-account-header-content" className="space-y-2">
          <div 
            id="suspended-account-badge"
            className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2.5 py-0.5 rounded-sm border border-red-200"
          >
            Security Restriction
          </div>
          {/* Exact phrase requested: "Your account is suspended." */}
          <h2 
            id="suspended-account-title"
            className="text-2xl sm:text-3xl font-bold text-[#101418] font-serif"
          >
            Your account is suspended.
          </h2>
          <p 
            id="suspended-account-subtitle"
            className="text-xs sm:text-sm text-[#54595d] max-w-md mx-auto leading-relaxed font-sans"
          >
            Your access to authenticated functions, authoring tools, and contributor workspaces has been restricted by encyclopedia administration.
          </p>
        </div>

        {/* Clearly visible "Help" or "Contact Support" option */}
        <div id="suspended-account-help-wrapper" className="pt-1">
          <button
            id="suspended-account-help-button"
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            aria-expanded={showHelp}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#3366cc] hover:text-[#1d4ed8] bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 hover:border-blue-300 rounded-sm transition-all cursor-pointer shadow-2xs group"
          >
            <HelpCircle size={16} className="text-[#3366cc]" />
            <span>Contact Support</span>
            {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Help details panel: shown when user clicks Help / Contact Support */}
          {showHelp && (
            <div
              id="suspended-account-help-panel"
              className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-sm text-left text-xs text-[#202122] space-y-3 animate-fadeIn"
            >
              {/* Exact explanation requested */}
              <p id="suspended-account-help-explanation" className="leading-relaxed text-[#334155] font-sans">
                If you believe your account was suspended by mistake or you have not violated our rules, you can contact us for help.
              </p>

              {/* Exact official email format requested */}
              <div 
                id="suspended-account-contact-box"
                className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="font-mono text-xs">
                  <span className="text-[#64748b]">Contact: </span>
                  <a
                    id="suspended-account-support-email-link"
                    href="mailto:thelegendswiki@gmail.com"
                    className="font-bold text-[#3366cc] hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xs inline-flex items-center gap-1.5"
                  >
                    <Mail size={13} />
                    thelegendswiki@gmail.com
                  </a>
                </div>
                <a
                  id="suspended-account-mailto-action"
                  href="mailto:thelegendswiki@gmail.com?subject=Account%20Suspension%20Inquiry"
                  className="text-[11px] font-mono font-medium text-[#3366cc] hover:underline"
                >
                  Send Inquiry Email &rarr;
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div id="suspended-account-actions-wrapper" className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            id="suspended-account-return-button"
            variant="secondary"
            size="md"
            onClick={() => navigate(returnPath)}
            icon={<ArrowLeft size={15} />}
            className="w-full sm:w-auto"
          >
            Return to Main Codex
          </Button>
          <Button
            id="suspended-account-logout-button"
            variant="outline"
            size="md"
            onClick={handleLogout}
            disabled={isLoggingOut}
            icon={<LogOut size={15} />}
            className="w-full sm:w-auto text-[#54595d] hover:text-red-700 hover:border-red-300"
          >
            {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </div>
      </div>
    );
  }

  // Case 2: Public visitor or another normal user viewing a suspended profile
  return (
    <div 
      id="suspended-account-public-screen"
      className="max-w-xl mx-auto my-12 bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-xs relative"
    >
      <div 
        id="suspended-account-public-icon-wrapper"
        className="mx-auto w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shadow-xs"
      >
        <ShieldAlert size={26} />
      </div>

      <div id="suspended-account-public-header-content" className="space-y-2">
        <div 
          id="suspended-account-public-badge"
          className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-sm border border-amber-200"
        >
          Registry Notice
        </div>
        {/* Exact phrase requested: "This account is suspended." */}
        <h2 
          id="suspended-account-public-title"
          className="text-2xl sm:text-3xl font-bold text-[#101418] font-serif"
        >
          This account is suspended.
        </h2>
        <p 
          id="suspended-account-public-subtitle"
          className="text-xs sm:text-sm text-[#54595d] max-w-md mx-auto leading-relaxed font-sans"
        >
          This contributor dossier has been suspended under encyclopedia governance and its profile archives are not publicly accessible.
        </p>
      </div>

      {/* Admin management bypass / restore button if viewed by an Admin or Super Admin */}
      {isAdminViewing && onUnsuspend && (
        <div id="suspended-account-admin-panel" className="p-4 bg-blue-50/70 border border-blue-200 rounded-sm text-left space-y-2">
          <div className="text-xs font-mono font-bold text-blue-900 uppercase tracking-wider">
            Administrative Clearance Action
          </div>
          <p className="text-xs text-[#334155]">
            As an authorized administrator, you can restore this account to active status directly from this dossier.
          </p>
          <div className="pt-1">
            <Button
              id="suspended-account-admin-unsuspend-button"
              variant="primary"
              size="sm"
              onClick={onUnsuspend}
            >
              Unsuspend / Restore Account
            </Button>
          </div>
        </div>
      )}

      {/* Public action: Return to home */}
      <div id="suspended-account-public-actions-wrapper" className="pt-2 flex justify-center gap-3">
        <Button
          id="suspended-account-public-return-button"
          variant="secondary"
          size="md"
          onClick={() => navigate(returnPath)}
          icon={<ArrowLeft size={15} />}
        >
          Return to Main Codex
        </Button>
      </div>
    </div>
  );
};

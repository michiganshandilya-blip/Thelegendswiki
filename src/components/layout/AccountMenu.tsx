import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  User,
  LogOut,
  PlusCircle,
  Bookmark,
  ChevronDown,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../../types';
import { normalizeHandle, formatDisplayHandle } from '../../services/userService';

export const AccountMenu: React.FC = () => {
  const { userProfile, currentUser, role, isEditor, isAdmin, isSuperAdmin, logout } = useAuth();
  const { navigate } = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const rawHandle =
    userProfile?.username ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
    currentUser?.displayName ||
    currentUser?.uid ||
    'scholar';

  const userHandle = normalizeHandle(rawHandle) || 'scholar';
  const displayName = userProfile?.displayName || currentUser?.displayName || userHandle;
  const initial = displayName.charAt(0).toUpperCase();
  const displayHandle = formatDisplayHandle(userProfile?.username || userHandle);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setIsOpen(false);
      navigate('/');
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const roleStyles: Record<UserRole, string> = {
    guest: 'bg-slate-100 text-slate-700 border-slate-200',
    user: 'bg-blue-50 text-blue-700 border-blue-200',
    registered_user: 'bg-blue-50 text-blue-700 border-blue-200',
    admin: 'bg-blue-50 text-blue-800 border-blue-200 font-bold',
    editor: 'bg-blue-50 text-blue-800 border-blue-200 font-bold',
    administrator: 'bg-blue-50 text-blue-800 border-blue-200 font-bold',
    super_admin: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
  };

  const handleProfileNavigation = () => {
    setIsOpen(false);
    if (userProfile?.username) {
      navigate(`/user/${userProfile.username}`);
    } else if (userHandle) {
      navigate(`/user/${userHandle}`);
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Account trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-sm bg-[#ffffff] hover:bg-[#f8f9fa] border border-[#cbd5e1] text-[#202122] transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
      >
        {/* Avatar */}
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-sm object-cover border border-slate-300"
          />
        ) : (
          <div
            className={`w-5 h-5 rounded-sm flex items-center justify-center text-white text-[11px] font-bold ${
              isSuperAdmin ? 'bg-amber-700' : isAdmin ? 'bg-blue-700' : 'bg-[#3366cc]'
            }`}
          >
            {initial}
          </div>
        )}

        <span className="text-xs font-medium max-w-[110px] truncate text-[#202122] group-hover:text-[#3366cc] transition-colors">
          {displayName}
        </span>

        <ChevronDown
          size={13}
          className={`text-[#72777d] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#3366cc]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-[#ffffff] border border-[#cbd5e1] rounded-sm shadow-lg z-50 overflow-hidden">
          {/* User Details Header */}
          <div 
            onClick={handleProfileNavigation}
            className="p-3 bg-[#f8f9fa] border-b border-[#eaecf0] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
            title="Open Contributor Profile"
          >
            <div className="flex items-center gap-2.5">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-sm object-cover border border-[#cbd5e1]"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-sm flex items-center justify-center text-white text-xs font-bold font-legend ${
                    isSuperAdmin ? 'bg-amber-700' : isAdmin ? 'bg-blue-700' : 'bg-[#3366cc]'
                  }`}
                >
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-[#101418] truncate">
                  {displayName}
                </div>
                <div className="text-[11px] font-mono text-[#54595d] truncate">
                  {displayHandle}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#eaecf0]">
              <span className="text-[10px] font-mono text-[#72777d] uppercase">Role</span>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-sm border uppercase ${
                  roleStyles[role] || roleStyles.user
                }`}
              >
                {role === 'super_admin' ? 'SUPER ADMIN' : role === 'admin' ? 'ADMIN' : 'USER'}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1 space-y-0.5 text-xs text-[#202122]">
            {/* View Profile */}
            <button
              type="button"
              onClick={handleProfileNavigation}
              className="w-full px-3 py-2 text-left hover:bg-[#f1f5f9] rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User size={14} className="text-[#3366cc]" />
              <span>Profile Dashboard</span>
            </button>

            {/* Create Article */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/create');
              }}
              className="w-full px-3 py-2 text-left hover:bg-[#f1f5f9] rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <PlusCircle size={14} className="text-[#059669]" />
              <span>Create Article Entry</span>
            </button>

            {/* My Articles & Contributions */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/my-articles');
              }}
              className="w-full px-3 py-2 text-left hover:bg-[#f1f5f9] rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Bookmark size={14} className="text-[#2563eb]" />
              <span>My Contributions</span>
            </button>

            {/* Super Admin Control Center (for Super Admins) */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/super-admin');
                }}
                className="w-full px-3 py-2 text-left bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 font-semibold rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer border border-amber-200/60"
              >
                <ShieldCheck size={14} className="text-amber-700" />
                <span>Super Admin Control Center</span>
              </button>
            )}

            {/* Governance Desk (for Admins & Super Admins) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin');
                }}
                className="w-full px-3 py-2 text-left bg-blue-50/50 hover:bg-blue-50 text-[#3366cc] font-medium rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Shield size={14} className="text-[#3366cc]" />
                <span>Admin Governance Desk</span>
              </button>
            )}

            {/* Archival Theme Switcher Menu Item */}
            <div className="border-t border-[#eaecf0] my-1 pt-1">
              <ThemeToggle variant="menu-item" />
            </div>

            {/* Logout */}
            <div className="pt-1 mt-1 border-t border-[#eaecf0]">
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                {loggingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

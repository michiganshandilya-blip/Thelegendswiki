import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import {
  User,
  LogOut,
  PlusCircle,
  Bookmark,
  Settings,
  Shield,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';

export const AccountMenu: React.FC = () => {
  const { userProfile, role, logout } = useAuth();
  const { navigate } = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const username = userProfile?.username || 'scholar';
  const displayName = userProfile?.displayName || username;
  const initial = displayName.charAt(0).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    guest: 'bg-slate-800 text-slate-300 border-slate-700',
    registered_user: 'bg-blue-950 text-blue-300 border-blue-600/40',
    editor: 'bg-amber-950 text-amber-300 border-amber-500/40',
    administrator: 'bg-indigo-950 text-indigo-300 border-indigo-500/40',
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Account trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-sm bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {/* Avatar */}
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-sm object-cover border border-blue-500/40"
          />
        ) : (
          <div className="w-6 h-6 rounded-sm bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/50 flex items-center justify-center text-white text-xs font-bold font-legend">
            {initial}
          </div>
        )}

        <span className="text-xs font-medium max-w-[110px] truncate text-slate-200 group-hover:text-blue-300 transition-colors">
          {displayName}
        </span>

        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#0e1424] border border-slate-700/90 rounded-sm shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* User Details Header */}
          <div className="p-3 bg-[#080c14] border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-sm object-cover border border-blue-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/50 flex items-center justify-center text-white text-xs font-bold font-legend">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-slate-100 truncate">
                  {displayName}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  @{username}
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Clearance</span>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-sm border uppercase ${
                  roleStyles[role] || roleStyles.registered_user
                }`}
              >
                {role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1 space-y-0.5 text-xs text-slate-300">
            {/* View Profile */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(`/user/${username}`);
              }}
              className="w-full px-3 py-2 text-left hover:bg-slate-800/70 hover:text-white rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User size={14} className="text-blue-400" />
              <span>Scholar Profile</span>
            </button>

            {/* Create Article */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/create');
              }}
              className="w-full px-3 py-2 text-left hover:bg-slate-800/70 hover:text-white rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <PlusCircle size={14} className="text-emerald-400" />
              <span>Create Article Entry</span>
            </button>

            {/* My Articles & Contributions */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/my-articles');
              }}
              className="w-full px-3 py-2 text-left hover:bg-slate-800/70 hover:text-white rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Bookmark size={14} className="text-sky-400" />
              <span>My Contributions</span>
            </button>

            {/* Settings (Placeholder) */}
            <div className="w-full px-3 py-2 text-left rounded-sm flex items-center justify-between text-slate-500 cursor-not-allowed">
              <div className="flex items-center gap-2.5">
                <Settings size={14} className="text-slate-500" />
                <span>Preferences</span>
              </div>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-sm">
                Soon
              </span>
            </div>

            {/* Logout */}
            <div className="pt-1 mt-1 border-t border-slate-800">
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                {loggingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
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

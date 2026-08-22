import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS } from './Navigation';
import { ThemeToggle } from '../common/ThemeToggle';
import { X, User, LogIn, LogOut, UserPlus, PlusCircle, ShieldCheck, Shield } from 'lucide-react';
import { CodeXAvatar } from '../ai/CodeXAvatar';
import { DEMO_CATEGORIES } from '../../data/demoData';
import { normalizeHandle, formatDisplayHandle } from '../../services/userService';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const { currentPath, navigate, getRandomArticleSlug } = useRouter();
  const { isAuthenticated, userProfile, currentUser, logout, role, isSuperAdmin, isAdmin } = useAuth();

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    if (path === '/random') {
      const slug = getRandomArticleSlug();
      navigate(`/wiki/${slug}`);
    } else {
      navigate(path);
    }
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/');
  };

  const rawHandle =
    userProfile?.username ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
    currentUser?.displayName ||
    currentUser?.uid ||
    'scholar';

  const userHandle = normalizeHandle(rawHandle) || 'scholar';
  const displayName = userProfile?.displayName || currentUser?.displayName || userHandle;
  const displayHandle = formatDisplayHandle(userProfile?.username || userHandle);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#ffffff] border-r border-[#eaecf0] shadow-xl flex flex-col z-50">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[#eaecf0] flex items-center justify-between bg-[#f8f9fa]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-[#3366cc] flex items-center justify-center text-white text-xs font-bold font-legend">
              W
            </div>
            <span className="font-bold text-[#101418] text-sm font-serif">
              TheLegends<span className="text-[#3366cc]">Wiki</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1.5 text-[#54595d] hover:text-[#101418] hover:bg-[#eaecf0] rounded-sm focus:outline-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Status Bar */}
        <div className="p-3 bg-[#ffffff] border-b border-[#eaecf0]">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div 
                onClick={() => handleNavigate(`/user/${userProfile?.username || userHandle}`)}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-90"
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-sm object-cover border border-[#cbd5e1] shrink-0"
                  />
                ) : (
                  <div
                    className={`w-7 h-7 rounded-sm flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                      isSuperAdmin ? 'bg-amber-700' : isAdmin ? 'bg-blue-700' : 'bg-[#3366cc]'
                    }`}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#101418] truncate">
                    {displayName}
                  </div>
                  <div className="text-[10px] font-mono text-[#54595d]">
                    {displayHandle} ·{' '}
                    <span
                      className={`uppercase font-bold ${
                        isSuperAdmin ? 'text-amber-800' : isAdmin ? 'text-blue-800' : 'text-slate-600'
                      }`}
                    >
                      {role === 'super_admin' ? 'SUPER ADMIN' : role === 'admin' ? 'ADMIN' : 'USER'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SUPER ADMIN QUICK ACTION BUTTON (Only visible to Super Admin) */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/super-admin')}
                  className="w-full px-2.5 py-1.5 bg-amber-100/90 hover:bg-amber-200 text-amber-950 rounded-sm text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300 shadow-2xs"
                >
                  <ShieldCheck size={13} className="text-amber-700" />
                  <span>Super Admin Control Center</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleNavigate(`/user/${userProfile?.username || userHandle}`)}
                  className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#202122] rounded-sm text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-[#cbd5e1]"
                >
                  <User size={12} /> Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/create')}
                  className="px-2 py-1 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle size={12} /> Create
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleNavigate('/login')}
                className="w-full py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#202122] rounded-sm text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-[#cbd5e1]"
              >
                <LogIn size={13} /> Log In
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/signup')}
                className="w-full py-1.5 bg-[#3366cc] hover:bg-[#2557bb] text-white rounded-sm text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={13} /> Join Wiki
              </button>
            </div>
          )}
        </div>

        {/* Scrollable links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <span className="text-[10px] font-bold text-[#54595d] uppercase tracking-widest block mb-2 px-2">
              Navigation
            </span>
            <div className="space-y-1">
              {/* Code X Assistant item */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('thelegendswiki:open-ai'));
                }}
                className="w-full text-left px-3 py-2 rounded-sm text-sm font-semibold flex items-center justify-between text-[#3366cc] bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CodeXAvatar size={18} />
                  <span>Code X Assistant</span>
                </div>
                <span className="text-[9px] font-mono uppercase bg-white border border-blue-200 text-[#3366cc] px-1 py-0.2 rounded-xs font-bold">
                  Gemini
                </span>
              </button>

              {/* SUPER ADMIN ENTRY (Mobile Navigation list) */}
              {isAuthenticated && isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/super-admin')}
                  className="w-full text-left px-3 py-2 rounded-sm text-sm font-bold flex items-center justify-between text-amber-950 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-700" />
                    <span>Super Admin Control Center</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-amber-200 text-amber-900 px-1 py-0.2 rounded-xs font-bold">
                    ROOT
                  </span>
                </button>
              )}

              {/* ADMIN EDITORIAL DESK ENTRY */}
              {isAuthenticated && isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/admin')}
                  className="w-full text-left px-3 py-2 rounded-sm text-sm font-semibold flex items-center justify-between text-[#3366cc] bg-blue-50/50 hover:bg-blue-100/50 border border-blue-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[#3366cc]" />
                    <span>Admin Editorial Desk</span>
                  </div>
                </button>
              )}

              {NAV_LINKS.map((link) => {
                const isActive =
                  link.path === '/'
                    ? currentPath === '/'
                    : currentPath.startsWith(link.path);

                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleNavigate(link.path)}
                    className={`w-full text-left px-3 py-2 rounded-sm text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-[#3366cc] border border-blue-200 font-semibold'
                        : 'text-[#54595d] hover:bg-[#f1f5f9] hover:text-[#101418]'
                    }`}
                  >
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Behind the Curtains Facets */}
          <div>
            <span className="text-[10px] font-bold text-[#54595d] uppercase tracking-widest block mb-2 px-2">
              Behind the Curtains Facets
            </span>
            <div className="space-y-1">
              {DEMO_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleNavigate(`/category/${cat.slug}`)}
                  className="w-full text-left px-3 py-1.5 rounded-sm text-xs text-[#54595d] hover:text-amber-800 hover:bg-amber-50/50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-[#72777d] font-mono">
                    {cat.articleCount.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Archival Theme Switcher in Mobile Drawer */}
          <div className="pt-2">
            <ThemeToggle variant="card" />
          </div>

          {/* Logout in Mobile if authenticated */}
          {isAuthenticated && (
            <div className="pt-2 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-sm flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Log Out of Codex</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

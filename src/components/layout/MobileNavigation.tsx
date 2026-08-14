import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS } from './Navigation';
import { X, BookOpen, Shuffle, User, LogIn, LogOut, UserPlus, PlusCircle } from 'lucide-react';
import { DEMO_CATEGORIES } from '../../data/demoData';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const { currentPath, navigate, getRandomArticleSlug } = useRouter();
  const { isAuthenticated, userProfile, logout, role } = useAuth();

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

  const username = userProfile?.username || 'scholar';
  const displayName = userProfile?.displayName || username;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#0b101d] border-r border-slate-800 shadow-2xl flex flex-col z-50">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#080c14]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white text-xs font-bold font-legend border border-blue-400/40">
              L
            </div>
            <span className="font-bold text-slate-100 text-sm">
              TheLegends<span className="text-indigo-400 font-semibold">Wiki</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-sm focus:outline-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Status Bar */}
        <div className="p-3 bg-[#0e1424] border-b border-slate-800">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-sm bg-blue-600/80 border border-blue-400/40 flex items-center justify-center text-white text-xs font-bold font-legend">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {displayName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    @{username} · <span className="capitalize">{role.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleNavigate(`/user/${username}`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User size={12} /> Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/create')}
                  className="px-2 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-sm text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
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
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn size={13} /> Log In
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/signup')}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-sm text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
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
            <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest block mb-2 px-2">
              Navigation
            </span>
            <div className="space-y-1">
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
                        ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest block mb-2 px-2">
              Browse by Discipline
            </span>
            <div className="space-y-1">
              {DEMO_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleNavigate(`/category/${cat.slug}`)}
                  className="w-full text-left px-3 py-1.5 rounded-sm text-xs text-slate-400 hover:text-blue-300 hover:bg-slate-800/50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {cat.articleCount.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Logout in Mobile if authenticated */}
          {isAuthenticated && (
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-sm flex items-center gap-2 cursor-pointer"
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

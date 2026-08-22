import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { SearchBar } from '../common/SearchBar';
import { Navigation } from './Navigation';
import { MobileNavigation } from './MobileNavigation';
import { AccountMenu } from './AccountMenu';
import { ThemeToggle } from '../common/ThemeToggle';
import { Menu, Search, X, BookOpen, PenLine, Shuffle, Sparkles, ShieldCheck } from 'lucide-react';
import { CodeXAvatar } from '../ai/CodeXAvatar';

export const Header: React.FC = () => {
  const { navigate, getRandomArticleSlug } = useRouter();
  const { isAuthenticated, loading, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleRandom = () => {
    const slug = getRandomArticleSlug();
    navigate(`/wiki/${slug}`);
  };

  const handleOpenAiAssistant = () => {
    window.dispatchEvent(new CustomEvent('thelegendswiki:open-ai'));
  };

  return (
    <>
      <header
        id="encyclopedia-header"
        className="sticky top-0 z-40 w-full bg-[#ffffff] border-b border-[#eaecf0] h-14 shrink-0 shadow-xs"
      >
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
              aria-label="TheLegendsWiki Homepage"
            >
              {/* Classic Book/Codex Emblem */}
              <div className="relative w-8 h-8 rounded-sm bg-[#f8f9fa] border border-[#cbd5e1] flex items-center justify-center text-[#1e293b] font-bold font-legend text-sm shadow-xs group-hover:border-[#3366cc] group-hover:text-[#3366cc] transition-all">
                <span>W</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2563eb] rounded-full" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-bold text-[#101418] font-serif tracking-tight leading-tight group-hover:text-[#3366cc] transition-colors">
                    TheLegends<span className="text-[#3366cc] font-semibold">Wiki</span>
                  </span>
                </div>
                <span className="font-handwritten text-xs text-[#64748b] leading-none -mt-0.5">
                  The Open Knowledge Codex
                </span>
              </div>
            </button>

            {/* Header Navigation Links */}
            <Navigation className="hidden lg:flex" />
          </div>

          {/* Center Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl px-4 lg:px-6">
            <SearchBar size="compact" placeholder="Search knowledge archives, legends, science..." />
          </div>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-2 text-sm shrink-0">
            {/* Super Admin Quick Link - ONLY visible to authenticated Super Admin */}
            {isAuthenticated && isSuperAdmin && (
              <button
                type="button"
                onClick={() => navigate('/super-admin')}
                className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-100/90 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group"
                title="Super Admin Control Center (michiganshandilya@gmail.com)"
              >
                <ShieldCheck size={13} className="text-amber-700 group-hover:scale-110 transition-transform" />
                <span>Super Admin</span>
              </button>
            )}

            {/* Code X AI Assistant Quick Trigger */}
            <button
              type="button"
              onClick={handleOpenAiAssistant}
              className="px-2.5 py-1 text-xs text-[#3366cc] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 hover:border-[#3366cc] rounded-sm transition-all cursor-pointer flex items-center gap-1.5 font-serif font-semibold shadow-2xs group"
              title="Ask Code X (Gemini AI Assistant)"
              aria-label="Open Code X AI Assistant"
            >
              <CodeXAvatar size={16} className="group-hover:scale-105 transition-transform" />
              <span>Code X</span>
            </button>

            <button
              type="button"
              onClick={handleRandom}
              className="px-2.5 py-1 text-xs text-[#54595d] hover:text-[#202122] hover:bg-[#f1f5f9] rounded-sm transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-[#cbd5e1]"
              title="Read a random article"
            >
              <Shuffle size={13} className="text-[#64748b]" />
              <span>Random</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/create')}
              className="px-2.5 py-1 text-xs text-[#3366cc] hover:text-[#1d4ed8] hover:bg-[#f0f6ff] rounded-sm transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-blue-200 font-medium"
              title="Create a new article"
            >
              <PenLine size={13} />
              <span>Contribute</span>
            </button>

            {/* Theme Switcher Toggle */}
            <ThemeToggle variant="compact" />

            <div className="h-4 w-px bg-[#eaecf0] mx-1" />

            {loading ? (
              <div className="w-20 h-7 bg-slate-100 animate-pulse rounded-sm" />
            ) : isAuthenticated ? (
              <AccountMenu />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#3366cc] font-medium hover:text-[#1d4ed8] transition-colors cursor-pointer text-xs px-2 py-1 hover:underline"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="bg-[#3366cc] hover:bg-[#2557bb] active:bg-[#1d4ed8] text-white px-3 py-1 rounded-sm font-medium transition-all text-xs cursor-pointer shadow-xs border border-[#2557bb]"
                >
                  Create Account
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 sm:hidden">
            {/* Theme Toggle (Mobile) */}
            <ThemeToggle variant="compact" />

            {/* Mobile Code X Trigger */}
            <button
              type="button"
              onClick={handleOpenAiAssistant}
              aria-label="Open Code X AI Assistant"
              title="Ask Code X"
              className="px-2 py-1 text-[#3366cc] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-sm focus:outline-none cursor-pointer flex items-center gap-1 text-xs font-serif font-bold"
            >
              <CodeXAvatar size={16} />
              <span className="text-[11px] font-mono">Code X</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle mobile search bar"
              className="p-2 text-[#54595d] hover:text-[#101418] hover:bg-[#f1f5f9] rounded-sm focus:outline-none cursor-pointer"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 text-[#54595d] hover:text-[#101418] hover:bg-[#f1f5f9] rounded-sm focus:outline-none cursor-pointer"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Search Input */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 py-2.5 bg-[#ffffff] border-t border-[#eaecf0] shadow-md">
            <div className="flex items-center gap-2">
              <SearchBar
                size="compact"
                placeholder="Search TheLegendsWiki..."
                autoFocus
                onSearchSubmit={() => setMobileSearchOpen(false)}
              />
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="p-1.5 text-[#54595d] hover:text-[#101418]"
                aria-label="Close mobile search"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer Menu */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
};

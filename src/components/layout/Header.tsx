import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { SearchBar } from '../common/SearchBar';
import { Navigation } from './Navigation';
import { MobileNavigation } from './MobileNavigation';
import { AccountMenu } from './AccountMenu';
import { Menu, Search, X, LogIn, UserPlus } from 'lucide-react';

export const Header: React.FC = () => {
  const { navigate } = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      <header
        id="encyclopedia-header"
        className="sticky top-0 z-40 w-full bg-[#090d18]/90 backdrop-blur-md border-b border-slate-800/90 h-14 shrink-0 shadow-lg shadow-black/20"
      >
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
              aria-label="TheLegendsWiki Homepage"
            >
              {/* Tech Emblem Logo */}
              <div className="relative w-7 h-7 rounded-sm bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white text-xs font-bold font-legend border border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_18px_rgba(59,130,246,0.8)] transition-all">
                <span className="translate-y-px">L</span>
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] tracking-widest text-blue-400 uppercase font-bold leading-none">
                  Archival Codex
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-tight group-hover:text-blue-300 transition-colors">
                  TheLegends<span className="text-indigo-400 font-semibold">Wiki</span>
                </span>
              </div>
            </button>

            {/* Header Navigation Links */}
            <Navigation className="hidden lg:flex" />
          </div>

          {/* Center Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl px-4 lg:px-8">
            <SearchBar size="compact" placeholder="Search knowledge archives, legends, science..." />
          </div>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-3 text-sm shrink-0">
            {loading ? (
              <div className="w-20 h-7 bg-slate-800/60 animate-pulse rounded-sm" />
            ) : isAuthenticated ? (
              <AccountMenu />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-slate-300 font-medium hover:text-blue-400 transition-colors cursor-pointer text-xs sm:text-sm px-2 py-1"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-1.5 rounded-sm font-medium transition-all text-xs sm:text-sm cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.35)] border border-blue-400/40"
                >
                  Join Wiki
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle mobile search bar"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-sm focus:outline-none cursor-pointer"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-sm focus:outline-none cursor-pointer"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Search Input */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 py-2.5 bg-[#0e1424] border-t border-slate-800">
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
                className="p-1.5 text-slate-400 hover:text-slate-200"
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
